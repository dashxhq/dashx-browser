import { beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'
import packageInfo from '../package.json'

function makeClient() {
  const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
  // Replace Apollo so we can inspect the variables the SDK passed to the
  // SubscribeContact mutation without hitting the network.
  ;(client as any).graphqlClient = {
    mutate: vi.fn().mockResolvedValue({
      data: { subscribeContact: { id: 'sub-id', value: 'fcm-test-token' } },
    }),
  }
  return client
}

function makeMessaging(token: string = 'fcm-test-token') {
  return {
    getToken: vi.fn().mockResolvedValue(token),
    onMessage: vi.fn().mockReturnValue(() => {}),
    deleteToken: vi.fn().mockResolvedValue(true),
  }
}

beforeEach(() => {
  window.localStorage.clear()
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: { permission: 'granted', requestPermission: () => Promise.resolve('granted') },
  })
})

describe('subscribe input.metadata', () => {
  it('sends app + library metadata', async () => {
    const client = makeClient()
    const messaging = makeMessaging()

    await client.subscribe(messaging as any, { vapidKey: 'v' })

    const mutateSpy = (client as any).graphqlClient.mutate as ReturnType<typeof vi.fn>
    expect(mutateSpy).toHaveBeenCalledTimes(1)
    const variables = mutateSpy.mock.calls[0][0].variables

    expect(variables.input.metadata).toEqual({
      app: { identifier: window.location.origin },
      library: {
        name: packageInfo.name,
        version: packageInfo.version,
      },
    })
  })

  it('omits app.identifier when window.location.origin is unavailable', async () => {
    // Simulate a non-browser environment by stripping the origin. The
    // metadata.app object should still be sent (just without identifier).
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, origin: '' },
    })

    const client = makeClient()
    const messaging = makeMessaging()

    try {
      await client.subscribe(messaging as any, { vapidKey: 'v' })

      const mutateSpy = (client as any).graphqlClient.mutate as ReturnType<typeof vi.fn>
      const variables = mutateSpy.mock.calls[0][0].variables

      expect(variables.input.metadata.app).toEqual({})
      expect(variables.input.metadata.library).toEqual({
        name: packageInfo.name,
        version: packageInfo.version,
      })
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    }
  })
})
