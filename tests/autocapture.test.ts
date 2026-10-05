import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'
import EventQueue, { FLUSH_INTERVAL_MS, MAX_BATCH_SIZE } from '../src/EventQueue'
import type { TrackedEventInput } from '../src/EventQueue'
import { SESSION_IDLE_TIMEOUT_MS, endSession, touchSession } from '../src/session'

type SentRequest = { init: RequestInit, events: TrackedEventInput[] }

let fetchMock: ReturnType<typeof vi.fn>
let clients: Client[] = []

function sent(): SentRequest[] {
  return fetchMock.mock.calls.map(([ , init ]) => ({
    init,
    events: JSON.parse(init.body).variables.input.events,
  }))
}

function sentEvents(): TrackedEventInput[] {
  return sent().flatMap((request) => request.events)
}

function makeClient(autocapture: ConstructorParameters<typeof Client>[0]['autocapture'] = true): Client {
  const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test', autocapture })
  clients.push(client)
  return client
}

async function flushTimers(): Promise<void> {
  await vi.advanceTimersByTimeAsync(FLUSH_INTERVAL_MS)
}

beforeEach(() => {
  vi.useFakeTimers()
  window.localStorage.clear()
  endSession()
  window.history.replaceState(null, '', '/start')
  fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { trackEvents: { success: true } } }) })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  clients.forEach((client) => client.stopAutocapture())
  clients = []
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('autocapture', () => {
  it('is off unless configured', async () => {
    makeClient(false)
    window.history.pushState(null, '', '/other')
    await flushTimers()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('captures the initial page view with page and session context', async () => {
    const client = makeClient()
    client.setIdentity('user-1', 'token-1')
    await flushTimers()

    const [ request ] = sent()
    expect(request.init.method).toBe('POST')
    expect(request.init.headers).toMatchObject({
      'X-Public-Key': 'pk_test',
      'X-Target-Environment': 'test',
      'X-Identity-Token': 'token-1',
    })
    expect(JSON.parse(request.init.body as string).query).toContain('trackEvents')

    const [ pageview ] = request.events
    expect(pageview.event).toBe('$pageview')
    expect(pageview.data).toMatchObject({ path: '/start', url: 'http://localhost:3000/start' })
    expect(pageview.systemContext.page.path).toBe('/start')
    expect(pageview.systemContext.sessionId).toEqual(expect.any(String))
    expect(pageview.accountAnonymousUid).toBe(client.accountAnonymousUid)
    expect(Number.isNaN(Date.parse(pageview.timestamp))).toBe(false)
  })

  it('records a leave and a view on client-side navigation', async () => {
    makeClient()
    vi.advanceTimersByTime(1500)
    window.history.pushState(null, '', '/pricing')
    await flushTimers()

    const events = sentEvents()
    expect(events.map((e) => e.event)).toEqual([ '$pageview', '$pageleave', '$pageview' ])
    expect(events[1].data).toMatchObject({ path: '/start', durationMs: 1500 })
    expect(events[2].data).toMatchObject({ path: '/pricing', referrer: 'http://localhost:3000/start' })
  })

  it('treats query-string and anchor changes as the same page', async () => {
    makeClient()
    window.history.replaceState(null, '', '/start?page=2')
    window.history.pushState(null, '', '/start#pricing')
    await flushTimers()

    expect(sentEvents().map((e) => e.event)).toEqual([ '$pageview' ])
  })

  it('treats hash-router routes as pages', async () => {
    makeClient()
    window.history.pushState(null, '', '/start#/settings')
    await flushTimers()

    expect(sentEvents().map((e) => e.event)).toEqual([ '$pageview', '$pageleave', '$pageview' ])
  })

  it('records a leave and flushes with keepalive when the page is hidden away', async () => {
    makeClient()
    window.dispatchEvent(new Event('pagehide'))
    await vi.advanceTimersByTimeAsync(0)

    const [ request ] = sent()
    expect(request.init.keepalive).toBe(true)
    expect(request.events.map((e) => e.event)).toEqual([ '$pageview', '$pageleave' ])
  })

  it('honours per-event options', async () => {
    makeClient({ pageleave: false })
    window.history.pushState(null, '', '/pricing')
    await flushTimers()

    expect(sentEvents().map((e) => e.event)).toEqual([ '$pageview', '$pageview' ])
  })

  it('stops listening after stopAutocapture', async () => {
    const client = makeClient()
    client.stopAutocapture()
    fetchMock.mockClear()

    window.history.pushState(null, '', '/pricing')
    await flushTimers()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('swallows transport failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    makeClient()

    await expect(flushTimers()).resolves.toBeUndefined()
  })
})

describe('EventQueue', () => {
  const event = (n: number) => ({ event: `e${n}` }) as TrackedEventInput

  it('flushes as soon as a batch fills', () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const queue = new EventQueue(send)

    for (let n = 0; n < MAX_BATCH_SIZE; n += 1) queue.enqueue(event(n))

    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toHaveLength(MAX_BATCH_SIZE)
    expect(queue.size).toBe(0)
  })

  it('sends what is pending on flush, and nothing when empty', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const queue = new EventQueue(send)
    queue.enqueue(event(1))
    queue.enqueue(event(2))

    await queue.flush({ keepalive: true })
    await queue.flush()

    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith([ event(1), event(2) ], { keepalive: true })
  })
})

describe('session', () => {
  it('keeps one id while active and rotates after the idle timeout', () => {
    const first = touchSession(1_000)
    expect(touchSession(1_000 + SESSION_IDLE_TIMEOUT_MS - 1)).toBe(first)

    const later = 1_000 + SESSION_IDLE_TIMEOUT_MS * 3
    expect(touchSession(later)).not.toBe(first)
  })

  it('starts a new session after reset', () => {
    const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
    const before = touchSession()

    client.reset()

    expect(touchSession()).not.toBe(before)
  })
})
