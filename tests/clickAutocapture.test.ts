import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TITLE_SETTLE_MS } from '../src/autocapture'
import Client from '../src/Client'
import { FLUSH_INTERVAL_MS } from '../src/EventQueue'
import type { QueuedEvent } from '../src/EventQueue'
import { MASKED } from '../src/privacy'
import { endSession } from '../src/session'

type ClientParams = ConstructorParameters<typeof Client>[0]

let fetchMock: ReturnType<typeof vi.fn>
let clients: Client[] = []

function sentEvents(): QueuedEvent[] {
  return fetchMock.mock.calls.flatMap(([ , init ]) => JSON.parse(init.body).variables.input.events)
}

function clicks(): QueuedEvent[] {
  return sentEvents().filter((event) => event.event === '$autocapture')
}

function makeClient(autocapture: ClientParams['autocapture'] = { clicks: true }, params: Partial<ClientParams> = {}): Client {
  const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test', autocapture, ...params })
  clients.push(client)
  return client
}

function render(html: string): void {
  document.body.innerHTML = html
}

function click(selector: string): void {
  document.querySelector(selector)!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))
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
  document.body.innerHTML = ''
  fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { trackEvents: { success: true } } }) })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  clients.forEach((client) => client.stopAutocapture())
  clients = []
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('click autocapture', () => {
  it('credits a click on a nested node to the button around it', async () => {
    render(`
      <main class="page">
        <section id="plans" class="card">
          <button id="buy" class="btn btn-primary" type="button" data-plan="pro"><span>Buy   now</span></button>
        </section>
      </main>
    `)
    makeClient()
    click('#buy span')
    await flushTimers()

    const [ event ] = clicks()
    expect(event.data).toEqual({
      eventType: 'click',
      tagName: 'button',
      text: 'Buy now',
      elementId: 'buy',
      type: 'button',
      classes: [ 'btn', 'btn-primary' ],
      dataAttributes: { 'data-plan': 'pro' },
      selector: 'main.page > section#plans.card > button#buy.btn.btn-primary',
      path: '/start',
    })
    expect(event.systemContext.page.path).toBe('/start')
    expect(event.systemContext.sessionId).toEqual(expect.any(String))
  })

  it('records links with their masked target', async () => {
    render('<a href="/pricing?gclid=abc&plan=pro">Pricing</a>')
    makeClient({ clicks: true }, { maskPersonalDataProperties: true })
    click('a')
    await flushTimers()

    expect(clicks()[0].data).toMatchObject({
      tagName: 'a',
      text: 'Pricing',
      href: `http://localhost:3000/pricing?gclid=${MASKED}&plan=pro`,
    })
  })

  it('names icon buttons by their aria-label and leaves out javascript: links', async () => {
    render('<a href="javascript:void(0)" aria-label="Close"><svg></svg></a>')
    makeClient()
    click('svg')
    await flushTimers()

    const [ event ] = clicks()
    expect(event.data).toMatchObject({ tagName: 'a', ariaLabel: 'Close' })
    expect(event.data).not.toHaveProperty('href')
    expect(event.data).not.toHaveProperty('text')
  })

  it('ignores clicks on anything that is not interactive', async () => {
    render('<div><p id="copy">Some text</p></div>')
    makeClient()
    click('#copy')
    await flushTimers()

    expect(clicks()).toEqual([])
  })

  it('captures elements marked with data-dx-capture and role=button', async () => {
    render('<div data-dx-capture id="card">Card</div><div role="button" id="fake">Fake</div>')
    makeClient()
    click('#card')
    click('#fake')
    await flushTimers()

    expect(clicks().map((event) => event.data.elementId)).toEqual([ 'card', 'fake' ])
  })

  it('skips anything inside dx-no-capture or data-dx-no-capture', async () => {
    render(`
      <div class="dx-no-capture"><button id="a">A</button></div>
      <section data-dx-no-capture><button id="b">B</button></section>
    `)
    makeClient()
    click('#a')
    click('#b')
    await flushTimers()

    expect(clicks()).toEqual([])
  })

  it('never records what was typed into a field', async () => {
    render(`
      <input id="check" type="checkbox" name="terms" value="secret-value">
      <input id="send" type="submit" value="Send">
      <input id="email" type="email" value="person@example.test">
    `)
    makeClient()
    click('#check')
    click('#send')
    click('#email')
    await flushTimers()

    const data = clicks().map((event) => event.data)
    expect(data).toEqual([
      expect.objectContaining({ tagName: 'input', type: 'checkbox', name: 'terms' }),
      expect.objectContaining({ tagName: 'input', type: 'submit', text: 'Send' }),
    ])
    expect(JSON.stringify(data)).not.toContain('secret-value')
  })

  it('drops every value that looks like a card or social security number', async () => {
    render(`
      <button id="text">Pay with 4242 4242 4242 4242</button>
      <input id="value" type="submit" value="4242 4242 4242 4242">
      <button id="label" aria-label="Card 4242-4242-4242-4242"></button>
      <button id="title" title="SSN 123-45-6789"></button>
      <button id="data" name="123-45-6789" data-card="4242424242424242">Go</button>
      <button id="long">${'Lorem ipsum '.repeat(21)}4242 4242 4242 4242</button>
    `)
    makeClient()
    for (const id of [ 'text', 'value', 'label', 'title', 'data', 'long' ]) click(`#${id}`)
    await flushTimers()

    const data = clicks().map((event) => event.data)
    expect(data.map((element) => element.elementId)).toEqual([ 'text', 'value', 'label', 'title', 'data', 'long' ])
    expect(JSON.stringify(data)).not.toMatch(/4242|123-45-6789/)
    expect(data[4]).toMatchObject({ text: 'Go' })
  })

  it('records form submits without their contents', async () => {
    render('<form id="signup" name="signup"><input name="email" value="person@example.test"></form>')
    makeClient()
    document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushTimers()

    const [ event ] = clicks()
    expect(event.data).toEqual({
      eventType: 'submit',
      tagName: 'form',
      elementId: 'signup',
      name: 'signup',
      selector: 'form#signup',
      path: '/start',
    })
  })

  it('records the page view before a click made while it waits for its title', async () => {
    render('<button id="go">Go</button>')
    makeClient()
    window.history.pushState(null, '', '/pricing')
    click('#go')
    await flushTimers()

    expect(sentEvents().map((event) => `${event.event} ${event.data.path}`)).toEqual([
      '$pageview /start',
      '$pageleave /start',
      '$pageview /pricing',
      '$autocapture /pricing',
    ])
  })

  it('credits clicks inside an open shadow root to the inner element', async () => {
    render('<div id="host"></div>')
    const shadow = document.querySelector('#host')!.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<button id="inner">Inside</button>'
    makeClient()
    shadow.querySelector('#inner')!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))
    await flushTimers()

    expect(clicks()[0].data).toMatchObject({ tagName: 'button', elementId: 'inner', text: 'Inside' })
  })

  it('is off with autocapture: true, clicks: false and after stopAutocapture', async () => {
    render('<button id="go">Go</button>')
    makeClient(true)
    click('#go')
    const client = makeClient({ clicks: false })
    click('#go')
    client.stopAutocapture()
    client.startAutocapture({ clicks: true })
    client.stopAutocapture()
    click('#go')
    await flushTimers()

    expect(clicks()).toEqual([])
    expect(sentEvents().map((event) => event.event)).toContain('$pageview')
  })

  it('lets beforeSend drop clicks', async () => {
    render('<button id="go">Go</button>')
    makeClient({ clicks: true }, { beforeSend: (event) => (event.event === '$autocapture' ? null : event) })
    click('#go')
    await flushTimers()

    expect(clicks()).toEqual([])
    expect(sentEvents().map((event) => event.event)).toEqual([ '$pageview' ])
  })
})
