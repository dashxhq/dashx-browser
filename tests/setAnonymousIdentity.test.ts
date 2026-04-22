import { beforeEach, describe, expect, it } from 'vitest'

import Client from '../src/Client'

const LOCAL_STORAGE_KEY = 'dashx-sdk'
const UUID_A = '11111111-2222-4333-8444-555555555555'
const UUID_B = '66666666-7777-4888-8999-aaaaaaaaaaaa'

function makeClient(): Client {
  return new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
}

describe('Client.setAnonymousIdentity', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('accepts a valid UUID and updates accountAnonymousUid', () => {
    const client = makeClient()
    client.setAnonymousIdentity(UUID_A)
    expect(client.accountAnonymousUid).toBe(UUID_A)
  })

  it('persists the anonymous UID to localStorage', () => {
    const client = makeClient()
    client.setAnonymousIdentity(UUID_A)

    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    const persisted = JSON.parse(raw!) as Record<string, unknown>
    expect(persisted.accountAnonymousUid).toBe(UUID_A)
  })

  it('overwrites the previous anonymous UID when called again', () => {
    const client = makeClient()
    client.setAnonymousIdentity(UUID_A)
    client.setAnonymousIdentity(UUID_B)
    expect(client.accountAnonymousUid).toBe(UUID_B)
  })

  it('throws when the value is not a valid UUID', () => {
    const client = makeClient()
    expect(() => client.setAnonymousIdentity('not-a-uuid')).toThrow('Anonymous UID must be a valid UUID')
    expect(() => client.setAnonymousIdentity('')).toThrow('Anonymous UID must be a valid UUID')
  })

  it('does not clobber other persisted identity fields', () => {
    const client = makeClient()
    client.setIdentity('user-123', 'token-abc')
    client.setAnonymousIdentity(UUID_A)

    expect(client.accountUid).toBe('user-123')
    expect(client.identityToken).toBe('token-abc')
    expect(client.accountAnonymousUid).toBe(UUID_A)
  })
})
