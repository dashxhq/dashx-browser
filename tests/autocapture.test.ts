import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TITLE_SETTLE_MS } from '../src/autocapture'
import Client from '../src/Client'
import DashX from '../src/index'
import EventQueue, { FLUSH_INTERVAL_MS, MAX_BATCH_SIZE } from '../src/EventQueue'
import type { QueuedEvent } from '../src/EventQueue'
import { MASKED, maskQueryParams } from '../src/privacy'
import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_MAX_LENGTH_MS,
  campaignFromUrl,
  endSession,
  touchSession,
} from '../src/session'

type SentRequest = { init: RequestInit, events: QueuedEvent[] }

let fetchMock: ReturnType<typeof vi.fn>
let clients: Client[] = []

function sent(): SentRequest[] {
  return fetchMock.mock.calls.map(([ , init ]) => ({
    init,
    events: JSON.parse(init.body).variables.input.events,
  }))
}

function sentEvents(): QueuedEvent[] {
  return sent().flatMap((request) => request.events)
}

type ClientParams = ConstructorParameters<typeof Client>[0]

function makeClient(autocapture: ClientParams['autocapture'] = true, params: Partial<ClientParams> = {}): Client {
  const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test', autocapture, ...params })
  clients.push(client)
  return client
}

async function flushTimers(): Promise<void> {
  await vi.advanceTimersByTimeAsync(TITLE_SETTLE_MS + FLUSH_INTERVAL_MS)
}

beforeEach(() => {
  vi.useFakeTimers()
  window.localStorage.clear()
  endSession()
  window.history.replaceState(null, '', '/start')
  document.title = ''
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

  it('records the title the new route sets after the URL changes', async () => {
    document.title = 'Start'
    makeClient()
    await vi.advanceTimersByTimeAsync(TITLE_SETTLE_MS)

    window.history.pushState(null, '', '/pricing')
    document.title = 'Pricing'
    await flushTimers()

    const views = sentEvents().filter((e) => e.event === '$pageview')
    expect(views.map((e) => [ e.data.path, e.data.title ])).toEqual([ [ '/start', 'Start' ], [ '/pricing', 'Pricing' ] ])
  })

  it('captures a pending view before the next navigation leaves it', async () => {
    makeClient()
    window.history.pushState(null, '', '/pricing')
    window.history.pushState(null, '', '/checkout')
    await flushTimers()

    expect(sentEvents().map((e) => `${e.event} ${e.data.path}`)).toEqual([
      '$pageview /start',
      '$pageleave /start',
      '$pageview /pricing',
      '$pageleave /pricing',
      '$pageview /checkout',
    ])
  })

  it('keeps the landing campaign for the rest of the session', async () => {
    window.history.replaceState(null, '', '/start?utm_source=newsletter&utm_campaign=launch')
    makeClient()
    window.history.pushState(null, '', '/pricing')
    await flushTimers()

    const campaigns = sentEvents().map((e) => e.systemContext.campaign)
    expect(campaigns).toHaveLength(3)
    campaigns.forEach((campaign) => {
      expect(campaign).toEqual({ name: 'launch', source: 'newsletter', medium: '', term: '', content: '' })
    })
  })

  it('sends no campaign when the session did not land with one', async () => {
    makeClient()
    await flushTimers()

    expect(sentEvents()[0].systemContext.campaign).toBeUndefined()
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
    await vi.advanceTimersByTimeAsync(TITLE_SETTLE_MS)
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

  it('records the page once when stopped and restarted before its view settles', async () => {
    const client = makeClient()
    client.stopAutocapture()
    client.startAutocapture()
    await flushTimers()

    expect(sentEvents().map((e) => e.event)).toEqual([ '$pageview' ])
  })

  it('stops the previous client when configure is called again', async () => {
    clients.push(DashX.configure({ publicKey: 'pk_test', targetEnvironment: 'test', autocapture: true }))
    clients.push(DashX.configure({ publicKey: 'pk_test', targetEnvironment: 'test', autocapture: true }))
    await vi.advanceTimersByTimeAsync(TITLE_SETTLE_MS)
    window.history.pushState(null, '', '/pricing')
    await flushTimers()

    expect(sentEvents().map((e) => e.event)).toEqual([ '$pageview', '$pageleave', '$pageview' ])
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

describe('track', () => {
  it('carries the page and the autocapture session', async () => {
    const client = makeClient()
    await flushTimers()
    const { sessionId } = sentEvents()[0].systemContext

    await client.track('Signed Up', { plan: 'pro' })

    const tracked = sentEvents()[1]
    expect(tracked.event).toBe('Signed Up')
    expect(tracked.data).toEqual({ plan: 'pro' })
    expect(tracked.systemContext.page).toMatchObject({ path: '/start', url: 'http://localhost:3000/start' })
    expect(tracked.systemContext.sessionId).toBe(sessionId)
  })

  it('sends at once with keepalive, taking queued autocaptured events along', async () => {
    const client = makeClient()
    await vi.advanceTimersByTimeAsync(TITLE_SETTLE_MS)

    await client.track('Signed Up')

    const [ request ] = sent()
    expect(request.init.keepalive).toBe(true)
    expect(request.events.map((e) => e.event)).toEqual([ '$pageview', 'Signed Up' ])
  })

  it('reports the same page and referrer as the page view after client-side navigation', async () => {
    const client = makeClient()
    window.history.pushState(null, '', '/pricing')
    document.title = 'Pricing'
    await vi.advanceTimersByTimeAsync(TITLE_SETTLE_MS)

    await client.track('Clicked Buy')

    const view = sentEvents().find((e) => e.event === '$pageview' && e.data?.path === '/pricing')
    const tracked = sentEvents().find((e) => e.event === 'Clicked Buy')
    expect(tracked?.systemContext.page).toEqual(view?.systemContext.page)
    expect(tracked?.systemContext.page?.referrer).toBe('http://localhost:3000/start')
  })

  it('reports the current url, masked, after a query-string change, keeping the previous route as referrer', async () => {
    const client = makeClient(true, { maskPersonalDataProperties: true })
    window.history.pushState(null, '', '/search')
    await vi.advanceTimersByTimeAsync(TITLE_SETTLE_MS)
    window.history.replaceState(null, '', '/search?q=shoes&gclid=abc')

    await client.track('Searched')

    const tracked = sentEvents().find((e) => e.event === 'Searched')
    expect(tracked?.systemContext.page).toMatchObject({
      url: 'http://localhost:3000/search?q=shoes&gclid=<masked>',
      path: '/search',
      referrer: 'http://localhost:3000/start',
    })
  })

  it('sends calls made in the same tick as one request', async () => {
    const client = makeClient(false)

    await Promise.all([ client.track('A'), client.track('B'), client.track('C') ])

    expect(sent()).toHaveLength(1)
    expect(sentEvents().map((e) => e.event)).toEqual([ 'A', 'B', 'C' ])
  })

  it('stops using keepalive once in-flight keepalive bodies would pass the budget', async () => {
    const settle: Array<() => void> = []
    fetchMock.mockImplementation(() => new Promise((resolve) => {
      settle.push(() => resolve({ ok: true, json: async () => ({}) }))
    }))
    const client = makeClient(false)
    const blob = 'x'.repeat(25_000)
    const keepalives = () => fetchMock.mock.calls.map(([ , init ]) => init.keepalive)

    for (const event of [ 'A', 'B', 'C' ]) {
      void client.track(event, { blob })
      await vi.advanceTimersByTimeAsync(0)
    }
    expect(keepalives()).toEqual([ true, true, false ])

    settle[0]()
    await vi.advanceTimersByTimeAsync(0)
    void client.track('D', { blob })
    await vi.advanceTimersByTimeAsync(0)
    expect(keepalives()).toEqual([ true, true, false, true ])
  })

  it('works without autocapture', async () => {
    const client = makeClient(false)

    await client.track('Signed Up')

    expect(sentEvents().map((e) => e.event)).toEqual([ 'Signed Up' ])
  })

  it('resolves rather than rejecting when the send fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const client = makeClient(false)

    await expect(client.track('Signed Up')).resolves.toBeUndefined()
  })

  it('drops keepalive when the payload is too large for it', async () => {
    const client = makeClient(false)

    await client.track('Upload', { blob: 'x'.repeat(70 * 1024) })

    expect(sent()[0].init.keepalive).toBe(false)
  })
})

describe('privacy', () => {
  it('sends URLs in full by default', async () => {
    window.history.replaceState(null, '', '/start?gclid=abc&plan=pro')
    makeClient()
    await flushTimers()

    expect(sentEvents()[0].systemContext.page.url).toBe('http://localhost:3000/start?gclid=abc&plan=pro')
  })

  it('masks ad-click ids and custom parameters in urls and referrers, keeping the campaign', async () => {
    window.history.replaceState(null, '', '/start?gclid=abc&token=t1&plan=pro&utm_source=mail')
    makeClient(true, { maskPersonalDataProperties: true, customPersonalDataProperties: [ 'token' ] })
    vi.advanceTimersByTime(TITLE_SETTLE_MS)
    window.history.pushState(null, '', '/next?fbclid=xyz')
    await flushTimers()

    const [ landing, leave, next ] = sentEvents()
    const maskedLanding = `http://localhost:3000/start?gclid=${MASKED}&token=${MASKED}&plan=pro&utm_source=mail`
    expect(landing.data).toMatchObject({ url: maskedLanding })
    expect(landing.systemContext.page.url).toBe(maskedLanding)
    expect(landing.systemContext.campaign).toMatchObject({ source: 'mail' })
    expect(leave.data).toMatchObject({ url: maskedLanding })
    expect(next.systemContext.page).toMatchObject({
      url: `http://localhost:3000/next?fbclid=${MASKED}`,
      referrer: maskedLanding,
    })
  })

  it('ignores custom parameters unless masking is on', async () => {
    window.history.replaceState(null, '', '/start?token=t1')
    makeClient(true, { customPersonalDataProperties: [ 'token' ] })
    await flushTimers()

    expect(sentEvents()[0].systemContext.page.url).toBe('http://localhost:3000/start?token=t1')
  })

  it('lets beforeSend rewrite or drop autocaptured events, in order', async () => {
    window.history.replaceState(null, '', '/start?q=secret')
    makeClient(true, {
      beforeSend: [
        (event) => (event.event === '$pageleave' ? null : event),
        (event) => ({ ...event, data: { ...(event.data as object), url: 'redacted' } }),
      ],
    })
    vi.advanceTimersByTime(TITLE_SETTLE_MS)
    window.history.pushState(null, '', '/next')
    await flushTimers()

    const events = sentEvents()
    expect(events.map((e) => e.event)).toEqual([ '$pageview', '$pageview' ])
    expect(events.every((e) => e.data.url === 'redacted')).toBe(true)
  })

  it('drops the event, without throwing, when beforeSend throws', async () => {
    const client = makeClient(true, { beforeSend: () => { throw new Error('hook bug') } })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(client.track('Signed Up')).resolves.toBeUndefined()
    await flushTimers()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lets beforeSend drop a track() call before it is sent', async () => {
    const client = makeClient(false, { beforeSend: (event) => (event.event === 'Secret' ? null : event) })

    await expect(client.track('Secret')).resolves.toBeUndefined()
    await client.track('Signed Up')

    expect(sentEvents().map((e) => e.event)).toEqual([ 'Signed Up' ])
  })
})

describe('maskQueryParams', () => {
  it('masks only whole names and leaves the rest of the url untouched', () => {
    expect(maskQueryParams('https://a.test/p%20q?xgclid=1&gclid=2&q=a+b#top', [ 'gclid' ]))
      .toBe(`https://a.test/p%20q?xgclid=1&gclid=${MASKED}&q=a+b#top`)
  })

  it('masks the query of a hash-router route too', () => {
    expect(maskQueryParams('https://a.test/#/landing?gclid=1&plan=pro', [ 'gclid' ]))
      .toBe(`https://a.test/#/landing?gclid=${MASKED}&plan=pro`)
  })

  it('matches names case-insensitively', () => {
    expect(maskQueryParams('https://a.test/?GCLID=1&Email=a@b.test', [ 'gclid', 'email' ]))
      .toBe(`https://a.test/?GCLID=${MASKED}&Email=${MASKED}`)
  })
})

describe('EventQueue', () => {
  const event = (n: number) => ({ event: `e${n}` }) as QueuedEvent

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

describe('campaignFromUrl', () => {
  it('maps UTM parameters and leaves absent ones empty', () => {
    expect(campaignFromUrl('https://example.com/?utm_medium=email&utm_term=shoes&utm_content=hero')).toEqual({
      name: '', source: '', medium: 'email', term: 'shoes', content: 'hero',
    })
    expect(campaignFromUrl('https://example.com/?ref=twitter')).toBeNull()
  })
})

describe('session', () => {
  it('keeps one id while active and rotates after the idle timeout', () => {
    const first = touchSession(1_000)
    expect(touchSession(1_000 + SESSION_IDLE_TIMEOUT_MS - 1)).toBe(first)

    const later = 1_000 + SESSION_IDLE_TIMEOUT_MS * 3
    expect(touchSession(later)).not.toBe(first)
  })

  it('starts a new session after 24 hours, however active it stays', () => {
    const first = touchSession(1_000)
    let now = 1_000
    while (now < 1_000 + SESSION_MAX_LENGTH_MS - SESSION_IDLE_TIMEOUT_MS) {
      now += SESSION_IDLE_TIMEOUT_MS - 1
      expect(touchSession(now)).toBe(first)
    }

    expect(touchSession(1_000 + SESSION_MAX_LENGTH_MS)).not.toBe(first)
  })

  it('starts a new session after reset', () => {
    const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
    const before = touchSession()

    client.reset()

    expect(touchSession()).not.toBe(before)
  })
})
