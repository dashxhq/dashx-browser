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
  if (sendable.systemContext != null && !isObject(sendable.systemContext)) throw new Error('systemContext must be an object')

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
