import { beforeEach, describe, expect, it } from 'vitest'

import Client from '../src/Client'
import { getItem, setItem } from '../src/storage'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function makeClient(): Client {
  return new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
}

describe('Client.reset', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('clears accountUid and identityToken', () => {
    const client = makeClient()
    client.setIdentity('user-123', 'token-abc')
    client.reset()

    expect(client.accountUid).toBeNull()
    expect(client.identityToken).toBeNull()
    expect(getItem('accountUid')).toBeNull()
    expect(getItem('identityToken')).toBeNull()
  })

  it('rotates the anonymous UID to a new valid UUID', () => {
    const client = makeClient()
    const before = client.accountAnonymousUid
    expect(before).toMatch(UUID_RE)

    client.reset()

    const after = client.accountAnonymousUid
    expect(after).toMatch(UUID_RE)
    expect(after).not.toBe(before)
  })

  it('clears the persisted FCM token', () => {
    setItem('fcmToken', 'fcm-existing-token')
    const client = makeClient()
    client.reset()

    expect(getItem('fcmToken')).toBeNull()
  })

  it('is idempotent — calling reset twice leaves identity cleared', () => {
    const client = makeClient()
    client.setIdentity('user-123', 'token-abc')
    client.reset()
    const firstAnon = client.accountAnonymousUid

    client.reset()
    expect(client.accountUid).toBeNull()
    expect(client.identityToken).toBeNull()
    expect(client.accountAnonymousUid).not.toBe(firstAnon)
  })
})
