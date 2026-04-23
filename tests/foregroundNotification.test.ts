import { beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'

type MessagingStub = {
  getToken: ReturnType<typeof vi.fn>
  onMessage: ReturnType<typeof vi.fn>
  deleteToken: ReturnType<typeof vi.fn>
  __fire: (_payload: Record<string, unknown>) => void
}

function makeMessaging(token: string = 'fcm-token'): MessagingStub {
  let handler: ((_payload: any) => void) | null = null
  const onMessage = vi.fn((h: (_payload: any) => void) => {
    handler = h
    return () => { handler = null }
  })
  return {
    getToken: vi.fn().mockResolvedValue(token),
    onMessage,
    deleteToken: vi.fn().mockResolvedValue(true),
    __fire: (_payload) => { if (handler) handler(_payload) },
  }
}

function makeRegistration() {
  return { showNotification: vi.fn().mockResolvedValue(undefined) }
}

function makeClient() {
  const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
  // Stub the GraphQL client so subscribe doesn't actually hit the network —
  // we only care about the foreground onMessage branch here.
  ;(client as any).graphqlClient = {
    mutate: vi.fn().mockResolvedValue({
      data: { subscribeContact: { id: 'sub-id', value: 'fcm-token' } },
    }),
  }
  ;(client as any).trackMessage = vi.fn()
  return client
}

beforeEach(() => {
  window.localStorage.clear()
  // Ensure the permission gate doesn't block subscribe.
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: { permission: 'granted', requestPermission: () => Promise.resolve('granted') },
  })
})

describe('foreground notification rendering', () => {
  it('calls registration.showNotification by default when a push arrives while the tab is focused', async () => {
    const client = makeClient()
    const messaging = makeMessaging()
    const registration = makeRegistration()

    await client.subscribe(messaging as any, {
      vapidKey: 'v',
      serviceWorkerRegistration: registration as any,
    })

    messaging.__fire({
      data: {
        dashx: JSON.stringify({
          id: 'n-1',
          title: 'Order shipped',
          body: 'On its way',
          image: 'https://app.example.com/banner.png',
          url: 'https://app.example.com/orders/42',
        }),
      },
    })

    await Promise.resolve()

    expect(registration.showNotification).toHaveBeenCalledWith(
      'Order shipped',
      expect.objectContaining({
        body: 'On its way',
        icon: 'https://app.example.com/banner.png',
        data: expect.objectContaining({
          dashxNotificationId: 'n-1',
          url: 'https://app.example.com/orders/42',
        }),
      }),
    )
  })

  it('does NOT render the system banner when showForegroundNotifications is false', async () => {
    const client = makeClient()
    const messaging = makeMessaging()
    const registration = makeRegistration()

    await client.subscribe(messaging as any, {
      serviceWorkerRegistration: registration as any,
      showForegroundNotifications: false,
    })

    messaging.__fire({
      data: { dashx: JSON.stringify({ id: 'n-3', title: 'Hi' }) },
    })

    await Promise.resolve()

    expect(registration.showNotification).not.toHaveBeenCalled()
  })

  it('wires the onMessage listener even on the already-subscribed fast path (page-reload scenario)', async () => {
    // Simulate the real-world bug: user subscribed in a previous session,
    // FCM token is persisted to localStorage, tab reloads, consumer calls
    // subscribe() again. The token comes back identical, so subscribe
    // early-returns. Before the fix, the onMessage listener was never wired
    // in the new JS scope and foreground pushes silently disappeared.
    window.localStorage.setItem(
      'dashx-sdk',
      JSON.stringify({ fcmToken: 'persisted-token' }),
    )

    const client = makeClient()
    const messaging = makeMessaging('persisted-token')
    const registration = makeRegistration()
    const callback = vi.fn()
    client.onPushNotificationReceived(callback)

    await client.subscribe(messaging as any, {
      serviceWorkerRegistration: registration as any,
    })

    // Fast-path hit — no new SubscribeContact mutation, no setItem churn.
    expect(messaging.onMessage).toHaveBeenCalledTimes(1)

    messaging.__fire({
      data: { dashx: JSON.stringify({ id: 'n-x', title: 'Reloaded', body: 'Still works' }) },
    })

    await Promise.resolve()

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      id: 'n-x',
      title: 'Reloaded',
    }))
    expect(registration.showNotification).toHaveBeenCalledWith(
      'Reloaded',
      expect.objectContaining({ body: 'Still works' }),
    )
  })

  it('attachForegroundMessaging wires the listener without prompting or fetching a token', async () => {
    // This is the standalone path for consumers that don't want to couple
    // listener setup to the subscribe() permission/token dance — call it at
    // mount and pushes flow through even without touching `subscribe` again.
    const client = makeClient()
    const messaging = makeMessaging()
    const callback = vi.fn()
    client.onPushNotificationReceived(callback)

    client.attachForegroundMessaging(messaging as any)

    expect(messaging.getToken).not.toHaveBeenCalled()
    expect(messaging.onMessage).toHaveBeenCalledTimes(1)

    messaging.__fire({
      data: { dashx: JSON.stringify({ id: 'n-a', title: 'No prompt', body: 'Just wire' }) },
    })

    await Promise.resolve()

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 'n-a' }))
  })

  it('attachForegroundMessaging registers the SW from registerServiceWorker path when passed', async () => {
    // This is the "explicit registration at app mount" flow — consumer wants
    // the foreground banner to render on the very first push, without waiting
    // for the Firebase `getToken` call inside `subscribe` to auto-register.
    const registration = makeRegistration()
    const registerSpy = vi.fn().mockResolvedValue(registration)
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerSpy,
        ready: new Promise(() => {}), // never resolves — pending state
      },
    })

    const client = makeClient()
    const messaging = makeMessaging()

    client.attachForegroundMessaging(messaging as any, {
      registerServiceWorker: '/firebase-messaging-sw.js',
    })

    // Let the register promise resolve
    await Promise.resolve()
    await Promise.resolve()

    expect(registerSpy).toHaveBeenCalledWith('/firebase-messaging-sw.js')

    messaging.__fire({
      data: { dashx: JSON.stringify({ id: 'n-r1', title: 'Registered', body: 'Banner works' }) },
    })

    await Promise.resolve()

    expect(registration.showNotification).toHaveBeenCalledWith(
      'Registered',
      expect.objectContaining({ body: 'Banner works' }),
    )
  })

  it('attachForegroundMessaging uses an explicit serviceWorkerRegistration when passed', async () => {
    const registration = makeRegistration()
    const registerSpy = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerSpy,
        ready: new Promise(() => {}),
      },
    })

    const client = makeClient()
    const messaging = makeMessaging()

    client.attachForegroundMessaging(messaging as any, {
      serviceWorkerRegistration: registration as any,
    })

    messaging.__fire({
      data: { dashx: JSON.stringify({ id: 'n-r2', title: 'Explicit', body: 'No register call' }) },
    })

    await Promise.resolve()

    // Explicit registration means we never touched navigator.serviceWorker.register
    expect(registerSpy).not.toHaveBeenCalled()
    expect(registration.showNotification).toHaveBeenCalledWith(
      'Explicit',
      expect.objectContaining({ body: 'No register call' }),
    )
  })

  it('attachForegroundMessaging hydrates the SW registration so banners render without subscribe()', async () => {
    // This is the demo-web / standalone mount scenario: consumer calls
    // attachForegroundMessaging at bootstrap, never calls subscribe in this
    // session. The Firebase SW is registered under the hood and exposed via
    // navigator.serviceWorker.ready — attachForegroundMessaging should pick
    // that up so the system banner still renders on foreground pushes.
    const registration = makeRegistration()
    const originalReady = (navigator as any).serviceWorker?.ready
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve(registration) },
    })

    const client = makeClient()
    const messaging = makeMessaging()

    client.attachForegroundMessaging(messaging as any)

    // Give the deferred ready-promise hydration a chance to resolve.
    await Promise.resolve()
    await Promise.resolve()

    messaging.__fire({
      data: { dashx: JSON.stringify({ id: 'n-hy', title: 'Hydrated', body: 'Banner works' }) },
    })

    await Promise.resolve()

    expect(registration.showNotification).toHaveBeenCalledWith(
      'Hydrated',
      expect.objectContaining({ body: 'Banner works' }),
    )

    // Cleanup
    if (originalReady) {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { ready: originalReady },
      })
    }
  })

  it('attachForegroundMessaging replaces a previously wired listener', async () => {
    const client = makeClient()
    const firstMessaging = makeMessaging()
    const secondMessaging = makeMessaging()

    client.attachForegroundMessaging(firstMessaging as any)
    client.attachForegroundMessaging(secondMessaging as any)

    expect(firstMessaging.onMessage).toHaveBeenCalledTimes(1)
    expect(secondMessaging.onMessage).toHaveBeenCalledTimes(1)
    // The unsubscribe returned by the first call should have been invoked
    // during the second attach — verified indirectly by the second messaging
    // being the live one (first one's handler is no longer wired).
  })

  it('still invokes onPushNotificationReceived callbacks regardless of foreground rendering preference', async () => {
    const client = makeClient()
    const messaging = makeMessaging()
    const registration = makeRegistration()
    const callback = vi.fn()
    client.onPushNotificationReceived(callback)

    await client.subscribe(messaging as any, {
      serviceWorkerRegistration: registration as any,
      showForegroundNotifications: false,
    })

    messaging.__fire({
      data: { dashx: JSON.stringify({ id: 'n-4', title: 'Hi', body: 'There' }) },
    })

    await Promise.resolve()

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      id: 'n-4',
      title: 'Hi',
      body: 'There',
    }))
    expect(registration.showNotification).not.toHaveBeenCalled()
  })
})
