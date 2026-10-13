import type { SystemContextInput, SystemContextPageInput } from './generated'
import { TrackedEventInputShape } from './generated/inputShapes'
import conformInput, { isObject } from './conformInput'
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

// The API rejects a whole batch over one malformed event, losing the rest with it. The JSON round
// trip proves the event serialises and snapshots data the caller may still mutate.
function toSendable(event: QueuedEvent): QueuedEvent {
  let json: string
  try {
    json = JSON.stringify(event)
  } catch {
    throw new Error('it cannot be serialised as JSON')
  }
  const sendable = conformInput(JSON.parse(json), TrackedEventInputShape) as QueuedEvent

  // The API trims the name, and stores a blank one as a nameless event type.
  if (!sendable.event.trim()) throw new Error('event is blank')
  // The API checks this beyond what the JSON scalar accepts.
  if (sendable.data != null && !isObject(sendable.data)) throw new Error('data must be an object')

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
