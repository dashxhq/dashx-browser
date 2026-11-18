// Stands in for the browser WebSocket: tests open, accept or close it as the realtime server would.
export class FakeWebSocket {
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

export function token(name: string, expiresInMs: number, claims: Record<string, unknown> = {}): string {
  const payload = globalThis.btoa(JSON.stringify({ ...claims, exp: Math.floor((Date.now() + expiresInMs) / 1000) }))
    .replace(/=+$/, '')
  return `header.${payload}.${name}`
}

export function latestSocket(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
}
