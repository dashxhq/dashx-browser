import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'

const LOCAL_STORAGE_KEY = 'dashx-sdk'
const HOUR = 60 * 60 * 1000

class FakeWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances: FakeWebSocket[] = []

  readyState = FakeWebSocket.CONNECTING
  onopen: ((_event: Event) => void) | null = null
  onclose: ((_event: CloseEvent) => void) | null = null
  onerror: ((_event: Event) => void) | null = null
  onmessage: ((_event: MessageEvent) => void) | null = null

  url: string

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  get identityToken(): string | null {
    return new URL(this.url).searchParams.get('identityToken')
  }

  sent: Record<string, any>[] = []

  open(): void {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  // What the server does for a token it accepts; it refuses one by opening and then closing 4401.
  accept(): void {
    this.open()
    this.onmessage?.({
      data: JSON.stringify({ type: 'CONNECTED', data: { connectionId: 'connection' } }),
    } as MessageEvent)
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data))
    if (JSON.parse(data).type === 'PING') {
      this.onmessage?.({ data: JSON.stringify({ type: 'PONG' }) } as MessageEvent)
    }
  }

  close(): void {
    this.serverClose(1000)
  }

  serverClose(code: number): void {
    if (this.readyState === FakeWebSocket.CLOSED) {
      return
    }
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.({ code } as CloseEvent)
  }
}

function token(name: string, expiresInMs: number): string {
  const payload = globalThis.btoa(JSON.stringify({ exp: Math.floor((Date.now() + expiresInMs) / 1000) }))
    .replace(/=+$/, '')
  return `header.${payload}.${name}`
}

function latestSocket(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
}

function readPersisted(): Record<string, unknown> {
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0)
}

function makeClient(identityTokenProvider?: () => Promise<string>): Client {
  return new Client({
    publicKey: 'pk_test',
    targetEnvironment: 'test',
    realtimeBaseUri: 'wss://realtime.test',
    identityTokenProvider,
  })
}

describe('identityTokenProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.spyOn(Math, 'random').mockReturnValue(0)
    FakeWebSocket.instances = []
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('connects with a provided token and never persists it', async () => {
    const provider = vi.fn().mockResolvedValue(token('first', 12 * HOUR))
    const client = makeClient(provider)

    client.connectWebSocket()
    await settle()

    expect(provider).toHaveBeenCalledTimes(1)
    expect(latestSocket().identityToken).toBe(token('first', 12 * HOUR))
    expect(readPersisted().identityToken ?? null).toBeNull()
    client.disconnectWebSocket()
  })

  it('renews the token before it expires and reconnects with the new one', async () => {
    const provider = vi.fn()
      .mockResolvedValueOnce(token('first', 12 * HOUR))
      .mockResolvedValueOnce(token('second', 12 * HOUR))
    const client = makeClient(provider)
    client.connectWebSocket()
    await settle()
    const first = latestSocket()
    first.accept()

    await vi.advanceTimersByTimeAsync(12 * HOUR - 6 * 60 * 1000)
    expect(provider).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000)
    expect(provider).toHaveBeenCalledTimes(2)
    expect(first.readyState).toBe(FakeWebSocket.CLOSED)
    expect(latestSocket().identityToken).toContain('second')
    client.disconnectWebSocket()
  })

  it('fetches a fresh token once after the server refuses one, and reconnects', async () => {
    const provider = vi.fn()
      .mockResolvedValueOnce(token('first', 12 * HOUR))
      .mockResolvedValueOnce(token('second', 12 * HOUR))
    const client = makeClient(provider)
    client.connectWebSocket()
    await settle()
    latestSocket().accept()

    latestSocket().serverClose(4401)
    await settle()

    expect(provider).toHaveBeenCalledTimes(2)
    expect(latestSocket().identityToken).toContain('second')
    client.disconnectWebSocket()
  })

  it('stops when a freshly provided token is refused too', async () => {
    const provider = vi.fn().mockResolvedValue(token('refused', 12 * HOUR))
    const client = makeClient(provider)
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    vi.spyOn((client as any).logger, 'warn').mockImplementation(() => {})
    client.connectWebSocket()
    await settle()

    latestSocket().open()
    latestSocket().serverClose(4401)
    await settle()
    const sockets = FakeWebSocket.instances.length
    latestSocket().open()
    latestSocket().serverClose(4401)
    await vi.advanceTimersByTimeAsync(24 * HOUR)

    expect(provider).toHaveBeenCalledTimes(2)
    expect(FakeWebSocket.instances).toHaveLength(sockets)

    client.connectWebSocket()
    await settle()
    expect(provider).toHaveBeenCalledTimes(3)
    expect(FakeWebSocket.instances).toHaveLength(sockets + 1)
    client.disconnectWebSocket()
  })

  it('restarts right after a terminal refusal with a fresh token, never the refused one', async () => {
    const provider = vi.fn()
      .mockResolvedValueOnce(token('first', 12 * HOUR))
      .mockResolvedValueOnce(token('second', 12 * HOUR))
      .mockResolvedValueOnce(token('third', 12 * HOUR))
    const client = makeClient(provider)
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    vi.spyOn((client as any).logger, 'warn').mockImplementation(() => {})
    client.connectWebSocket()
    await settle()
    latestSocket().open()
    latestSocket().serverClose(4401)
    await settle()
    latestSocket().open()
    latestSocket().serverClose(4401)
    await settle()

    client.connectWebSocket()
    await settle()

    expect(provider).toHaveBeenCalledTimes(3)
    expect(latestSocket().identityToken).toContain('third')

    latestSocket().open()
    latestSocket().serverClose(4401)
    await settle()
    expect(provider).toHaveBeenCalledTimes(3)
    client.disconnectWebSocket()
  })

  it('stops renewing after any other terminal close', async () => {
    const provider = vi.fn().mockResolvedValue(token('forbidden', 12 * HOUR))
    const client = makeClient(provider)
    vi.spyOn((client as any).logger, 'warn').mockImplementation(() => {})
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    client.connectWebSocket()
    await settle()
    latestSocket().accept()
    const sockets = FakeWebSocket.instances.length

    latestSocket().serverClose(4403)
    await vi.advanceTimersByTimeAsync(24 * HOUR)

    expect(provider).toHaveBeenCalledTimes(1)
    expect(FakeWebSocket.instances).toHaveLength(sockets)
    client.disconnectWebSocket()
  })

  it('refreshes again for a later refusal once a fresh token was accepted', async () => {
    const provider = vi.fn()
      .mockResolvedValueOnce(token('first', 12 * HOUR))
      .mockResolvedValueOnce(token('second', 12 * HOUR))
      .mockResolvedValueOnce(token('third', 12 * HOUR))
    const client = makeClient(provider)
    client.connectWebSocket()
    await settle()
    latestSocket().accept()

    latestSocket().serverClose(4401)
    await settle()
    latestSocket().accept()
    latestSocket().serverClose(4401)
    await settle()

    expect(provider).toHaveBeenCalledTimes(3)
    expect(latestSocket().identityToken).toContain('third')
    client.disconnectWebSocket()
  })

  it('stops when the provider fails after a refusal', async () => {
    const provider = vi.fn()
      .mockResolvedValueOnce(token('first', 12 * HOUR))
      .mockRejectedValueOnce(new Error('backend down'))
    const client = makeClient(provider)
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    client.connectWebSocket()
    await settle()
    latestSocket().accept()
    const sockets = FakeWebSocket.instances.length

    latestSocket().serverClose(4401)
    await vi.advanceTimersByTimeAsync(24 * HOUR)

    expect(provider).toHaveBeenCalledTimes(2)
    expect(FakeWebSocket.instances).toHaveLength(sockets)
    client.disconnectWebSocket()
  })

  it('retries a failed renewal while the current token is still valid', async () => {
    const provider = vi.fn()
      .mockResolvedValueOnce(token('first', 12 * HOUR))
      .mockRejectedValueOnce(new Error('backend down'))
      .mockResolvedValueOnce(token('second', 12 * HOUR))
    const client = makeClient(provider)
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    client.connectWebSocket()
    await settle()
    latestSocket().accept()

    await vi.advanceTimersByTimeAsync(12 * HOUR - 5 * 60 * 1000)
    expect(provider).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(30 * 1000)
    expect(provider).toHaveBeenCalledTimes(3)
    expect(latestSocket().identityToken).toContain('second')
    client.disconnectWebSocket()
  })
})

describe('the managed socket', () => {
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

  it('sends the public key and target environment in the handshake', () => {
    const client = makeClient()
    client.connectWebSocket({ queryParams: { custom: 'value' } })

    const params = new URL(latestSocket().url).searchParams
    expect(params.get('publicKey')).toBe('pk_test')
    expect(params.get('targetEnvironment')).toBe('test')
    expect(params.get('custom')).toBe('value')
    client.disconnectWebSocket()
  })

  it('keeps its handlers across a reconnect for a new token, without the old socket\'s events', async () => {
    const onOpen = vi.fn()
    const onClose = vi.fn()
    const onMessage = vi.fn()
    const provider = vi.fn()
      .mockResolvedValueOnce(token('first', 12 * HOUR))
      .mockResolvedValueOnce(token('second', 12 * HOUR))
    const client = makeClient(provider)
    client.connectWebSocket({ onOpen, onClose, onMessage })
    await settle()
    const first = latestSocket()
    first.accept()

    first.serverClose(4401)
    await settle()
    expect(onClose).toHaveBeenCalledTimes(1)
    latestSocket().accept()

    expect(client.webSocketManager?.isConnected).toBe(true)
    expect(onOpen).toHaveBeenCalledTimes(2)
    expect(onMessage).toHaveBeenCalledTimes(2)

    first.onmessage?.({ data: JSON.stringify({ type: 'CONNECTED', data: {} }) } as MessageEvent)
    expect(onMessage).toHaveBeenCalledTimes(2)
    client.disconnectWebSocket()
  })
})

describe('without an identityTokenProvider', () => {
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

  it('treats a refusal as terminal', async () => {
    const client = makeClient()
    vi.spyOn((client as any).logger, 'warn').mockImplementation(() => {})
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    client.setIdentity('member', token('host', HOUR))
    client.connectWebSocket()
    latestSocket().accept()

    latestSocket().serverClose(4401)
    await vi.advanceTimersByTimeAsync(60 * 1000)

    expect(FakeWebSocket.instances).toHaveLength(1)
    client.disconnectWebSocket()
  })

  it('reconnects a refused socket when the host sets a new token', async () => {
    const client = makeClient()
    vi.spyOn((client as any).logger, 'warn').mockImplementation(() => {})
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    client.setIdentity('member', token('expired', HOUR))
    client.connectWebSocket()
    latestSocket().accept()
    latestSocket().serverClose(4401)

    client.setIdentity(undefined, token('renewed', 12 * HOUR))

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(latestSocket().identityToken).toContain('renewed')
    client.disconnectWebSocket()
  })

  it('does not connect a socket the host never asked for when the token changes', () => {
    const client = makeClient()
    client.setIdentity('member', token('first', HOUR))
    client.setIdentity(undefined, token('second', HOUR))

    expect(FakeWebSocket.instances).toHaveLength(0)
  })
})

describe('two clients on one page', () => {
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

  it('keep the member\'s uids out of the page\'s stored visitor', async () => {
    const user = makeClient()
    user.setIdentity('visitor', 'user-token')
    const storedAnonymousUid = user.accountAnonymousUid
    const member = makeClient(vi.fn().mockResolvedValue(token('member', 12 * HOUR)))

    expect(member.accountUid).toBeNull()
    expect(member.accountAnonymousUid).not.toBe(storedAnonymousUid)
    member.connectWebSocket()
    await settle()
    latestSocket().accept()

    const subscribe = latestSocket().sent.find((message) => message.type === 'SUBSCRIBE')
    expect(subscribe?.data.accountUid ?? null).toBeNull()
    expect(readPersisted().accountUid).toBe('visitor')
    expect(readPersisted().accountAnonymousUid).toBe(storedAnonymousUid)
    member.disconnectWebSocket()
  })

  it('keep their own tokens', async () => {
    const user = makeClient()
    user.setIdentity('visitor', 'user-token')
    const member = makeClient(vi.fn().mockResolvedValue(token('member', 12 * HOUR)))

    member.connectWebSocket()
    await settle()

    expect(member.identityToken).toContain('member')
    expect(user.identityToken).toBe('user-token')
    expect(readPersisted().identityToken).toBe('user-token')
    expect(makeClient().identityToken).toBe('user-token')
    member.disconnectWebSocket()
  })
})
