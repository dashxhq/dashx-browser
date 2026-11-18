import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'
import { FakeWebSocket, latestSocket, token } from './support/fakeWebSocket'

const HOUR = 60 * 60 * 1000
const user = (uid: string) => ({ kind: 'USER', uid })

function makeClient(): Client {
  return new Client({
    publicKey: 'pk_test',
    targetEnvironment: 'test',
    realtimeBaseUri: 'wss://realtime.test',
  })
}

describe('setIdentity with a new token while the socket is live', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeWebSocket)
    FakeWebSocket.instances = []
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('keeps the socket for a refreshed token of the same user, even when every accepted connection refetches one', () => {
    const client = makeClient()
    client.setIdentity('member', token('first', 7 * 24 * HOUR, user('member')))
    client.connectWebSocket({
      onMessage: (message) => {
        if (message.type === 'CONNECTED') {
          vi.advanceTimersByTime(1000)
          client.setIdentity('member', token('fresh', 7 * 24 * HOUR, user('member')))
        }
      },
    })

    latestSocket().accept()

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(latestSocket().identityToken).toContain('first')
    client.disconnectWebSocket()
  })

  it('reconnects with a token refreshed while the socket is still connecting', () => {
    const client = makeClient()
    client.setIdentity('member', token('stale', 7 * 24 * HOUR, user('member')))
    client.connectWebSocket()
    const connecting = latestSocket()

    client.setIdentity('member', token('fresh', 7 * 24 * HOUR, user('member')))

    expect(connecting.readyState).toBe(FakeWebSocket.CLOSED)
    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(latestSocket().identityToken).toContain('fresh')
    client.disconnectWebSocket()
  })

  it('connects with a token refreshed before the server accepted the old one, which it then refuses', () => {
    const client = makeClient()
    vi.spyOn((client as any).logger, 'warn').mockImplementation(() => {})
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    client.setIdentity('member', token('stale', 7 * 24 * HOUR, user('member')))
    client.connectWebSocket()
    const handshaking = latestSocket()
    handshaking.open()

    client.setIdentity('member', token('fresh', 7 * 24 * HOUR, user('member')))
    handshaking.serverClose(4401)
    latestSocket().accept()

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(latestSocket().identityToken).toContain('fresh')
    expect(client.isWebSocketConnected).toBe(true)
    client.disconnectWebSocket()
  })

  it('reconnects with the refreshed token after the connection drops', async () => {
    const client = makeClient()
    client.setIdentity('member', token('first', 7 * 24 * HOUR, user('member')))
    client.connectWebSocket()
    latestSocket().accept()
    const refreshed = token('refreshed', 8 * 24 * HOUR, user('member'))
    client.setIdentity('member', refreshed)

    latestSocket().serverClose(1006)
    await vi.advanceTimersByTimeAsync(2000)

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(latestSocket().identityToken).toBe(refreshed)
    client.disconnectWebSocket()
  })

  it('reconnects for a different user', () => {
    const client = makeClient()
    client.setIdentity('first', token('first', 7 * 24 * HOUR, user('first')))
    client.connectWebSocket()
    latestSocket().accept()

    client.setIdentity('second', token('second', 7 * 24 * HOUR, user('second')))

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(latestSocket().identityToken).toContain('second')
    client.disconnectWebSocket()
  })

  it('reconnects for a refreshed member token, which the server closes at expiry', () => {
    const member = { kind: 'MEMBER', uid: 'account-id', environment_id: 'environment-id' }
    const client = makeClient()
    client.setIdentity(undefined, token('first', HOUR, member))
    client.connectWebSocket()
    latestSocket().accept()

    client.setIdentity(undefined, token('renewed', 12 * HOUR, member))

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(latestSocket().identityToken).toContain('renewed')
    client.disconnectWebSocket()
  })

  it('reconnects on logout', () => {
    const client = makeClient()
    client.setIdentity('member', token('first', 7 * 24 * HOUR, user('member')))
    client.connectWebSocket()
    latestSocket().accept()

    client.setIdentity()

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(latestSocket().identityToken).toBeNull()
    client.disconnectWebSocket()
  })
})
