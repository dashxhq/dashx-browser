import { beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'

function makeClient(): Client {
  const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
  // Stub Apollo so unsubscribe doesn't actually hit the network unless the
  // test explicitly arranges a response shape.
  ;(client as any).graphqlClient = {
    mutate: vi.fn(),
  }
  return client
}

const LOCAL_STORAGE_KEY = 'dashx-sdk'

// Use a valid v4 UUID — the Client's `accountAnonymousUid` setter
// validates the format and throws on anything else.
const VALID_ANON_UUID = '12345678-1234-4234-8234-123456789012'

function seedFcmToken(token: string) {
  window.localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({ fcmToken: token, accountAnonymousUid: VALID_ANON_UUID }),
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('Client.unsubscribe', () => {
  it('resolves with `success: false` when no FCM token is saved locally — legitimate "nothing to unsubscribe" outcome', async () => {
    // A missing local token is a valid no-op outcome,
    // not an error. The device just wasn't subscribed in this session.
    const client = makeClient()
    const mutateSpy = (client as any).graphqlClient.mutate as ReturnType<typeof vi.fn>

    const result = await client.unsubscribe()

    expect(result).toEqual({ success: false })
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('forwards the backend `success: true` outcome verbatim', async () => {
    seedFcmToken('fcm-abc')
    const client = makeClient()
    ;(client as any).graphqlClient.mutate.mockResolvedValue({
      data: { unsubscribeContact: { success: true } },
    })

    const result = await client.unsubscribe()
    expect(result).toEqual({ success: true })
  })

  it('forwards the backend `success: false` outcome verbatim (contact not found server-side)', async () => {
    // The backend returns `success: false` when no matching subscribed
    // contact exists — anonymous UID rotated, FCM token stale, etc. The SDK
    // surfaces it directly so callers can branch on it.
    seedFcmToken('fcm-stale')
    const client = makeClient()
    ;(client as any).graphqlClient.mutate.mockResolvedValue({
      data: { unsubscribeContact: { success: false } },
    })

    const result = await client.unsubscribe()
    expect(result).toEqual({ success: false })
  })

  it('clears the saved FCM token after a successful round-trip', async () => {
    seedFcmToken('fcm-clear')
    const client = makeClient()
    ;(client as any).graphqlClient.mutate.mockResolvedValue({
      data: { unsubscribeContact: { success: true } },
    })

    await client.unsubscribe()

    // After unsubscribe, the next call should hit the no-token early-return
    // path (success: false) without invoking the mutation a second time.
    const mutateSpy = (client as any).graphqlClient.mutate as ReturnType<typeof vi.fn>
    mutateSpy.mockClear()

    const second = await client.unsubscribe()
    expect(second).toEqual({ success: false })
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('rejects when the GraphQL response has no unsubscribeContact data (transport-level shape error)', async () => {
    seedFcmToken('fcm-bad')
    const client = makeClient()
    ;(client as any).graphqlClient.mutate.mockResolvedValue({ data: null })

    await expect(client.unsubscribe()).rejects.toThrow('Failed to unsubscribe contact')
  })

  it('propagates a Firebase deleteToken failure as a rejection', async () => {
    seedFcmToken('fcm-fb')
    const client = makeClient()
    // `attachForegroundMessaging` is the public way to wire `#firebaseMessaging`
    // — we use it here purely to set up state for unsubscribe to call into.
    const fakeMessaging = {
      getToken: vi.fn(),
      onMessage: vi.fn().mockReturnValue(() => {}),
      deleteToken: vi.fn().mockRejectedValue(new Error('Firebase deleteToken failed')),
    }
    client.attachForegroundMessaging(fakeMessaging as any)

    await expect(client.unsubscribe()).rejects.toThrow('Firebase deleteToken failed')
  })
})
