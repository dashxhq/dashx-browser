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

  // The API rejects a whole batch over one event without a name, losing the rest with it.
  enqueue(event: QueuedEvent): void {
    if (typeof event.event !== 'string' || !event.event.trim()) {
      logger.error('An event needs a name; this one was dropped:', event.event)
      return
    }

    this.#events.push(event)

    if (this.#events.length >= MAX_BATCH_SIZE) {
      void this.flush()
    } else if (!this.#timer) {
      this.#timer = setTimeout(() => { void this.flush() }, FLUSH_INTERVAL_MS)
    }
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
