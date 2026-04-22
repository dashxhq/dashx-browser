// @vitest-environment node

// Runs in the node environment — `window` is truly undefined, mirroring an
// SSR render (Next.js RSC / getServerSideProps / Remix loader).

import { describe, expect, it } from 'vitest'

import { getItem, setItem } from '../src/storage'
import Client from '../src/Client'

describe('storage — SSR / no-window', () => {
  it('does not throw when window is undefined at import time', () => {
    // Sanity — if the import above had side-effects touching `window`,
    // the test file would already have crashed before this ran.
    expect(typeof window).toBe('undefined')
  })

  it('getItem returns null in a non-browser environment', () => {
    expect(getItem('accountUid')).toBeNull()
    expect(getItem('identityToken')).toBeNull()
    expect(getItem('accountAnonymousUid')).toBeNull()
    expect(getItem('fcmToken')).toBeNull()
  })

  it('setItem is a silent no-op in a non-browser environment', () => {
    expect(() => setItem('accountUid', 'user-1')).not.toThrow()
    expect(() => setItem('accountUid', null)).not.toThrow()
    // Nothing was actually persisted — confirmed by getItem returning null.
    expect(getItem('accountUid')).toBeNull()
  })

  it('Client can be constructed on the server without throwing', () => {
    // This is the real SSR concern: `DashX.configure(...)` in a server
    // component or getServerSideProps shouldn't crash even though nothing
    // meaningful will be persisted until the page hydrates on the client.
    expect(() => new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })).not.toThrow()
  })

  it('Client bootstrapped on the server generates an in-memory anonymous UID', () => {
    const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
    // uuid-random falls back to Node's `crypto` module, so the UID itself is
    // still a valid v4. It just won't survive past this request.
    expect(client.accountAnonymousUid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(client.accountUid).toBeNull()
    expect(client.identityToken).toBeNull()
  })

  it('setIdentity on the server does not throw', () => {
    const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
    expect(() => client.setIdentity('user-1', 'token-1')).not.toThrow()
    // State is held in memory for this request; nothing was persisted.
    expect(client.accountUid).toBe('user-1')
    expect(client.identityToken).toBe('token-1')
  })
})
