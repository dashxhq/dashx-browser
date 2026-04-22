import { beforeEach, describe, expect, it } from 'vitest'

import DashX, { Client } from '../src/index'

describe('DashX facade', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('throws when methods are called before configure()', () => {
    expect(() => DashX.setIdentity('user-1')).toThrow(
      'DashX.configure() must be called before using any other method.',
    )
    expect(() => DashX.reset()).toThrow(
      'DashX.configure() must be called before using any other method.',
    )
  })

  it('configure() returns a Client instance that survives repeat method calls', () => {
    const client = DashX.configure({ publicKey: 'pk_test', targetEnvironment: 'test' })
    expect(client).toBeInstanceOf(Client)

    DashX.setIdentity('user-1', 'token-a')
    expect(DashX.accountUid).toBe('user-1')
    expect(DashX.identityToken).toBe('token-a')
  })

  it('configure() replaces the singleton on repeated calls', () => {
    const a = DashX.configure({ publicKey: 'pk_a', targetEnvironment: 'test' })
    const b = DashX.configure({ publicKey: 'pk_b', targetEnvironment: 'test' })
    expect(a).not.toBe(b)
    expect(b.publicKey).toBe('pk_b')
  })

  it('createClient() returns a standalone Client without affecting the facade singleton', () => {
    DashX.configure({ publicKey: 'pk_test', targetEnvironment: 'test' })
    const standalone = DashX.createClient({ publicKey: 'pk_other', targetEnvironment: 'other' })
    expect(standalone).toBeInstanceOf(Client)
    expect(standalone.publicKey).toBe('pk_other')
    expect(DashX.graphqlClient).not.toBe(standalone.graphqlClient)
  })

  it('setIdentity() via the facade proxies to the configured instance', () => {
    DashX.configure({ publicKey: 'pk_test', targetEnvironment: 'test' })

    DashX.setIdentity('user-9', 'token-9')
    expect(DashX.accountUid).toBe('user-9')
    expect(DashX.identityToken).toBe('token-9')

    DashX.setIdentity()
    expect(DashX.accountUid).toBeNull()
    expect(DashX.identityToken).toBeNull()
  })

  it('reset() via the facade clears identity', () => {
    DashX.configure({ publicKey: 'pk_test', targetEnvironment: 'test' })
    DashX.setIdentity('user-9', 'token-9')
    DashX.reset()

    expect(DashX.accountUid).toBeNull()
    expect(DashX.identityToken).toBeNull()
  })
})
