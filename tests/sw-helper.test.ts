import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createDashXServiceWorkerHandler } from '../src/sw-helper'

type SWWindowClient = {
  url: string
  focus: ReturnType<typeof vi.fn>
  navigate?: ReturnType<typeof vi.fn>
}

function makeClient(url: string): SWWindowClient {
  return {
    url,
    focus: vi.fn().mockResolvedValue(undefined),
    navigate: vi.fn().mockResolvedValue(null),
  }
}

function makeClients(options: { clients?: SWWindowClient[]; disableMatchAll?: boolean } = {}) {
  const list = options.clients ?? []
  return {
    matchAll: options.disableMatchAll
      ? undefined
      : vi.fn().mockResolvedValue(list),
    openWindow: vi.fn().mockResolvedValue(null),
  }
}

type TestEvent = {
  notification: { close: ReturnType<typeof vi.fn>; data: Record<string, unknown> }
  waitUntil: (_promise: Promise<unknown>) => void
  __pending: Promise<unknown>[]
}

function makeEvent(data: Record<string, unknown>): TestEvent {
  const pending: Promise<unknown>[] = []
  return {
    notification: { close: vi.fn(), data },
    waitUntil(promise: Promise<unknown>) { pending.push(promise) },
    __pending: pending,
  }
}

async function drain(event: TestEvent) {
  await Promise.all(event.__pending)
}

const config = { publicKey: 'pk_test', targetEnvironment: 'test' }

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
})

describe('sw-helper onNotificationClick', () => {
  it('focuses an existing same-origin tab and navigates it instead of opening a new window', async () => {
    const handler = createDashXServiceWorkerHandler(config)
    const existing = makeClient('https://app.example.com/home')
    const clients = makeClients({ clients: [ existing ] })

    const event = makeEvent({
      dashxNotificationId: 'n-1',
      url: 'https://app.example.com/orders/42',
    })

    handler.onNotificationClick(event as any, clients as any)
    await drain(event)

    expect(existing.focus).toHaveBeenCalledTimes(1)
    expect(existing.navigate).toHaveBeenCalledWith('https://app.example.com/orders/42')
    expect(clients.openWindow).not.toHaveBeenCalled()
  })

  it('falls back to openWindow when no same-origin tab is open', async () => {
    const handler = createDashXServiceWorkerHandler(config)
    const otherOrigin = makeClient('https://other.example.com/')
    const clients = makeClients({ clients: [ otherOrigin ] })

    const event = makeEvent({
      dashxNotificationId: 'n-2',
      url: 'https://app.example.com/orders/42',
    })

    handler.onNotificationClick(event as any, clients as any)
    await drain(event)

    expect(otherOrigin.focus).not.toHaveBeenCalled()
    expect(clients.openWindow).toHaveBeenCalledWith('https://app.example.com/orders/42')
  })

  it('falls back to openWindow when matchAll is not supported (older Safari)', async () => {
    const handler = createDashXServiceWorkerHandler(config)
    const clients = makeClients({ disableMatchAll: true })

    const event = makeEvent({
      dashxNotificationId: 'n-3',
      url: 'https://app.example.com/orders/42',
    })

    handler.onNotificationClick(event as any, clients as any)
    await drain(event)

    expect(clients.openWindow).toHaveBeenCalledWith('https://app.example.com/orders/42')
  })

  it('ignores non-http(s) URLs — no navigation, no openWindow', async () => {
    const handler = createDashXServiceWorkerHandler(config)
    const clients = makeClients()

    const event = makeEvent({
      dashxNotificationId: 'n-4',
      url: 'myapp://product/42',
    })

    handler.onNotificationClick(event as any, clients as any)
    await drain(event)

    expect(clients.openWindow).not.toHaveBeenCalled()
  })

  it('skips navigation entirely when no URL is in the payload', async () => {
    const handler = createDashXServiceWorkerHandler(config)
    const clients = makeClients()

    const event = makeEvent({ dashxNotificationId: 'n-5' })

    handler.onNotificationClick(event as any, clients as any)
    await drain(event)

    expect(clients.openWindow).not.toHaveBeenCalled()
  })

  it('tolerates a client with a malformed URL and continues to check others', async () => {
    const handler = createDashXServiceWorkerHandler(config)
    const broken = makeClient('not a valid url')
    const good = makeClient('https://app.example.com/')
    const clients = makeClients({ clients: [ broken, good ] })

    const event = makeEvent({
      dashxNotificationId: 'n-6',
      url: 'https://app.example.com/orders/42',
    })

    handler.onNotificationClick(event as any, clients as any)
    await drain(event)

    expect(broken.focus).not.toHaveBeenCalled()
    expect(good.focus).toHaveBeenCalled()
  })
})

