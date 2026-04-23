import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'

function makeClient() {
  return new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
}

function stubNotificationPermission(value: NotificationPermission | undefined) {
  if (value === undefined) {
    // Simulate an environment without the Notification API at all (e.g. some
    // SSR bundles, workers, or very restricted iframes). `undefined` → delete
    // the global so `typeof Notification === 'undefined'` is true.
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: undefined,
    })
    return
  }
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: {
      permission: value,
      requestPermission: () => Promise.resolve(value),
    },
  })
}

describe('Client.getNotificationPermission', () => {
  afterEach(() => {
    // Reset to granted so other test files aren't affected by whatever this
    // suite last stubbed.
    stubNotificationPermission('granted')
  })

  it('returns the current Notification.permission value in supported browsers', () => {
    const client = makeClient()

    stubNotificationPermission('default')
    expect(client.getNotificationPermission()).toBe('default')

    stubNotificationPermission('granted')
    expect(client.getNotificationPermission()).toBe('granted')

    stubNotificationPermission('denied')
    expect(client.getNotificationPermission()).toBe('denied')
  })

  it('returns "unsupported" when the Notification API is absent', () => {
    const client = makeClient()
    stubNotificationPermission(undefined)
    expect(client.getNotificationPermission()).toBe('unsupported')
  })
})

describe('Client push entry-point validation', () => {
  beforeEach(() => {
    stubNotificationPermission('granted')
  })

  it('attachForegroundMessaging throws with a descriptive error when given a bad messaging object', () => {
    const client = makeClient()

    expect(() => client.attachForegroundMessaging(undefined as any)).toThrow(
      /invalid `messaging` argument/,
    )
    expect(() => client.attachForegroundMessaging({} as any)).toThrow(
      /invalid `messaging` argument/,
    )
    expect(() => client.attachForegroundMessaging({ getToken: () => {} } as any)).toThrow(
      /invalid `messaging` argument/,
    )
  })

  it('subscribe rejects with the same validation error when messaging is bad', async () => {
    const client = makeClient()
    ;(client as any).graphqlClient = {
      mutate: vi.fn().mockResolvedValue({
        data: { subscribeContact: { id: 'sub-id', value: 'fcm-token' } },
      }),
    }

    await expect(client.subscribe({} as any)).rejects.toThrow(
      /invalid `messaging` argument/,
    )
  })
})
