import type { SystemContextInput, SystemContextPageInput } from './generated'
import { createLogger } from './logging'

const logger = createLogger('EVENTS')

// The API accepts up to 100 per call; 20 keeps a batch well inside the 64KB keepalive budget.
export const MAX_BATCH_SIZE = 20

export const FLUSH_INTERVAL_MS = 5000

export type PageContext = SystemContextPageInput

export type QueuedEvent = {
  event: string,
  accountUid: string | null,
  accountAnonymousUid: string | null,
  data?: Record<string, unknown>,
  timestamp: string,
  systemContext: SystemContextInput,
}

export type SendEvents = (_events: QueuedEvent[], _options: { keepalive: boolean }) => Promise<void>

const isObject = (value: unknown): boolean => typeof value === 'object' && value !== null && !Array.isArray(value)

const isOptionalString = (value: unknown): boolean => value == null || typeof value === 'string'

type Kind = 'string' | 'boolean' | 'int' | 'float' | 'decimal'

type Shape = { [field: string]: Kind | `${Kind}!` | Shape }

const MAX_INT = 2 ** 31 - 1

const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/

const MATCHES_KIND: Record<Kind, (_value: unknown) => boolean> = {
  string: (value) => typeof value === 'string',
  boolean: (value) => typeof value === 'boolean',
  int: (value) => Number.isInteger(value) && Math.abs(value as number) <= MAX_INT,
  float: (value) => typeof value === 'number' && Number.isFinite(value),
  decimal: (value) => (typeof value === 'number' && Number.isFinite(value))
    || (typeof value === 'string' && DECIMAL.test(value)),
}

// SystemContextInput as the API declares it (`!` marks a required field); keep in sync with
// src/generated. GraphQL rejects the whole batch over an unknown or mistyped field at any depth.
const SYSTEM_CONTEXT: Shape = {
  app: { build: 'string!', name: 'string!', namespace: 'string!', version: 'string!' },
  campaign: { content: 'string!', medium: 'string!', name: 'string!', source: 'string!', term: 'string!' },
  device: {
    adTrackingEnabled: 'boolean!',
    advertisingId: 'string!',
    id: 'string!',
    kind: 'string!',
    manufacturer: 'string!',
    model: 'string!',
    name: 'string!',
  },
  ipV4: 'string!',
  ipV6: 'string',
  library: { name: 'string!', version: 'string!' },
  locale: 'string!',
  location: { city: 'string', country: 'string', latitude: 'decimal', longitude: 'decimal', speed: 'decimal' },
  network: { bluetooth: 'boolean!', carrier: 'string!', cellular: 'boolean!', wifi: 'boolean!' },
  os: { name: 'string!', version: 'string!' },
  page: { path: 'string!', referrer: 'string', title: 'string', url: 'string!' },
  screen: { density: 'float!', height: 'int!', width: 'int!' },
  sessionId: 'string',
  timeZone: 'string!',
  userAgent: 'string!',
}

// The fields the shape knows, checked; unknown fields are left out.
function conform(value: unknown, shape: Shape, path: string): Record<string, unknown> {
  if (!isObject(value)) throw new Error(`${path} must be an object`)

  const conformed: Record<string, unknown> = {}
  for (const [ field, spec ] of Object.entries(shape)) {
    const fieldValue = (value as Record<string, unknown>)[field]
    const fieldPath = `${path}.${field}`

    if (typeof spec === 'object') {
      if (fieldValue != null) conformed[field] = conform(fieldValue, spec, fieldPath)
      continue
    }

    const kind = spec.replace('!', '') as Kind
    if (fieldValue == null) {
      if (spec.endsWith('!')) throw new Error(`${fieldPath} is required`)
      continue
    }
    if (!MATCHES_KIND[kind](fieldValue)) throw new Error(`${fieldPath} must be a ${kind}`)
    conformed[field] = fieldValue
  }
  return conformed
}

// The API rejects a whole batch over one malformed event, losing the rest with it. The JSON round
// trip proves the event serialises and snapshots data the caller may still mutate.
function toSendable(event: QueuedEvent): QueuedEvent {
  const { event: name, accountUid, accountAnonymousUid, data, timestamp, systemContext } = event
  let json: string
  try {
    json = JSON.stringify({ event: name, accountUid, accountAnonymousUid, data, timestamp, systemContext })
  } catch {
    throw new Error('it cannot be serialised as JSON')
  }
  const sendable = JSON.parse(json)

  if (typeof sendable.event !== 'string' || !sendable.event.trim()) throw new Error('it has no name')
  if (!isOptionalString(sendable.accountUid) || !isOptionalString(sendable.accountAnonymousUid)) {
    throw new Error('account uids must be strings')
  }
  if (sendable.data != null && !isObject(sendable.data)) throw new Error('data must be an object')
  if (sendable.systemContext != null) {
    sendable.systemContext = conform(sendable.systemContext, SYSTEM_CONTEXT, 'systemContext')
  }

  if (sendable.timestamp != null) {
    const time = typeof sendable.timestamp === 'string' ? Date.parse(sendable.timestamp) : NaN
    if (Number.isNaN(time)) throw new Error('timestamp must be a date')
    // The API only parses ISO 8601; Date.parse also takes looser formats.
    sendable.timestamp = new Date(time).toISOString()
  }

  return sendable
}

export default class EventQueue {
  #events: QueuedEvent[] = []

  #timer: ReturnType<typeof setTimeout> | null = null

  #scheduled: Promise<void> | null = null

  readonly #send: SendEvents

  constructor(send: SendEvents) {
    this.#send = send
  }

  get size(): number {
    return this.#events.length
  }

  // Returns false when the event is malformed and was dropped.
  enqueue(event: QueuedEvent): boolean {
    let sendable: QueuedEvent
    try {
      sendable = toSendable(event)
    } catch (error) {
      logger.error(`The '${String(event.event)}' event was dropped because ${(error as Error).message}:`, event)
      return false
    }

    this.#events.push(sendable)

    if (this.#events.length >= MAX_BATCH_SIZE) {
      void this.flush()
    } else if (!this.#timer) {
      this.#timer = setTimeout(() => { void this.flush() }, FLUSH_INTERVAL_MS)
    }
    return true
  }

  // Calls in the same tick share one request instead of each sending its own.
  flushSoon(options: { keepalive?: boolean } = {}): Promise<void> {
    this.#scheduled ??= Promise.resolve().then(() => {
      this.#scheduled = null
      return this.flush(options)
    })
    return this.#scheduled
  }

  // Events are dropped, not retried, when a send fails: tracking is best-effort.
  async flush({ keepalive = false }: { keepalive?: boolean } = {}): Promise<void> {
    if (this.#timer) {
      clearTimeout(this.#timer)
      this.#timer = null
    }

    const batch = this.#events
    if (!batch.length) return
    this.#events = []

    await this.#send(batch, { keepalive }).catch(() => {})
  }
}
