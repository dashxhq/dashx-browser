import type { SystemContextInput } from './generated'

// The API accepts up to 100 per call; 20 keeps a batch well inside the 64KB keepalive budget.
export const MAX_BATCH_SIZE = 20

export const FLUSH_INTERVAL_MS = 5000

export type PageContext = {
  url: string,
  path: string,
  referrer: string | null,
  title: string | null,
}

export type TrackedEventInput = {
  event: string,
  accountUid: string | null,
  accountAnonymousUid: string | null,
  data: Record<string, unknown>,
  timestamp: string,
  systemContext: SystemContextInput & { page: PageContext, sessionId: string },
}

export type SendEvents = (_events: TrackedEventInput[], _options: { keepalive: boolean }) => Promise<void>

export default class EventQueue {
  #events: TrackedEventInput[] = []

  #timer: ReturnType<typeof setTimeout> | null = null

  readonly #send: SendEvents

  constructor(send: SendEvents) {
    this.#send = send
  }

  get size(): number {
    return this.#events.length
  }

  enqueue(event: TrackedEventInput): void {
    this.#events.push(event)

    if (this.#events.length >= MAX_BATCH_SIZE) {
      void this.flush()
    } else if (!this.#timer) {
      this.#timer = setTimeout(() => { void this.flush() }, FLUSH_INTERVAL_MS)
    }
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
