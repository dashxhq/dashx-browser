import { beforeEach, describe, expect, it } from 'vitest'

import Client from '../src/Client'

const LOCAL_STORAGE_KEY = 'dashx-sdk'
const UUID_A = '11111111-2222-4333-8444-555555555555'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function seedStorage(data: Record<string, unknown>) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
}

function makeClient(): Client {
  return new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
}

describe('Client — identity bootstrap', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('generates a new anonymous UID on first construction', () => {
    const client = makeClient()
    expect(client.accountAnonymousUid).toMatch(UUID_RE)
  })

  it('persists the generated anonymous UID so subsequent instances reuse it', () => {
    const first = makeClient()
    const generatedUid = first.accountAnonymousUid

    const second = makeClient()
    expect(second.accountAnonymousUid).toBe(generatedUid)
  })

  it('loads a previously persisted anonymous UID', () => {
    seedStorage({ accountAnonymousUid: UUID_A })
    const client = makeClient()
    expect(client.accountAnonymousUid).toBe(UUID_A)
  })

  it('loads a previously persisted identity', () => {
    seedStorage({
      accountAnonymousUid: UUID_A,
      accountUid: 'user-999',
      identityToken: 'token-persisted',
    })

    const client = makeClient()
    expect(client.accountUid).toBe('user-999')
    expect(client.identityToken).toBe('token-persisted')
  })

  it('defaults accountUid and identityToken to null when absent in storage', () => {
    seedStorage({ accountAnonymousUid: UUID_A })
    const client = makeClient()
    expect(client.accountUid).toBeNull()
    expect(client.identityToken).toBeNull()
  })
})
