import { beforeEach, describe, expect, it } from 'vitest'

import Client from '../src/Client'

const LOCAL_STORAGE_KEY = 'dashx-sdk'

function makeClient(): Client {
  return new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
}

function readPersisted(): Record<string, unknown> {
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

describe('Client.setIdentity', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('defaults both uid and token to null when called with no arguments', () => {
    const client = makeClient()
    client.setIdentity()
    expect(client.accountUid).toBeNull()
    expect(client.identityToken).toBeNull()
  })

  it('accepts only a uid — token stays null', () => {
    const client = makeClient()
    client.setIdentity('user-123')
    expect(client.accountUid).toBe('user-123')
    expect(client.identityToken).toBeNull()
  })

  it('accepts both uid and token', () => {
    const client = makeClient()
    client.setIdentity('user-123', 'token-abc')
    expect(client.accountUid).toBe('user-123')
    expect(client.identityToken).toBe('token-abc')
  })

  it('accepts explicit nulls for both arguments', () => {
    const client = makeClient()
    client.setIdentity(null, null)
    expect(client.accountUid).toBeNull()
    expect(client.identityToken).toBeNull()
  })

  it('persists uid and token to localStorage', () => {
    const client = makeClient()
    client.setIdentity('user-123', 'token-abc')

    const persisted = readPersisted()
    expect(persisted.accountUid).toBe('user-123')
    expect(persisted.identityToken).toBe('token-abc')
  })

  it('clears previously set identity when called with no args', () => {
    const client = makeClient()
    client.setIdentity('user-123', 'token-abc')
    client.setIdentity()

    expect(client.accountUid).toBeNull()
    expect(client.identityToken).toBeNull()

    const persisted = readPersisted()
    expect(persisted.accountUid).toBeNull()
    expect(persisted.identityToken).toBeNull()
  })

  it('overwrites only the token when called with the same uid and a new token', () => {
    const client = makeClient()
    client.setIdentity('user-123', 'old-token')
    client.setIdentity('user-123', 'new-token')
    expect(client.accountUid).toBe('user-123')
    expect(client.identityToken).toBe('new-token')
  })

  it('reset() clears identity set via setIdentity back to null', () => {
    const client = makeClient()
    client.setIdentity('user-123', 'token-abc')
    client.reset()
    expect(client.accountUid).toBeNull()
    expect(client.identityToken).toBeNull()
  })
})
