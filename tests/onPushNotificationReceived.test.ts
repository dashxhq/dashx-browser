import { beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'

function makeClient(): Client {
  return new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
}

describe('Client.onPushNotificationReceived', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns an unsubscribe function', () => {
    const client = makeClient()
    const unsubscribe = client.onPushNotificationReceived(() => {})
    expect(typeof unsubscribe).toBe('function')
  })

  it('calling unsubscribe does not throw', () => {
    const client = makeClient()
    const unsubscribe = client.onPushNotificationReceived(() => {})
    expect(() => unsubscribe()).not.toThrow()
  })

  it('supports registering multiple callbacks independently', () => {
    const client = makeClient()
    const a = vi.fn()
    const b = vi.fn()

    const unsubA = client.onPushNotificationReceived(a)
    const unsubB = client.onPushNotificationReceived(b)

    expect(typeof unsubA).toBe('function')
    expect(typeof unsubB).toBe('function')
    expect(unsubA).not.toBe(unsubB)
  })

  it('unsubscribing twice is a no-op', () => {
    const client = makeClient()
    const unsubscribe = client.onPushNotificationReceived(() => {})
    unsubscribe()
    expect(() => unsubscribe()).not.toThrow()
  })
})
