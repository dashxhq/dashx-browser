import { WebsocketMessageType } from './Client'

export interface WebSocketOptions {
  url: string
  protocols?: string | string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  heartbeatMessage?: string
  shouldReconnect?: (_closeEvent: CloseEvent) => boolean
  onOpen?: (_event: Event) => void
  onClose?: (_event: CloseEvent) => void
  onError?: (_event: Event) => void
  onMessage?: (_event: MessageEvent) => void
  onReconnect?: (_attempt: number) => void
  onReconnectFailed?: () => void
}

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isConnecting = false
  private shouldReconnect = true
  private lastCloseEvent: CloseEvent | null = null

  private options: Required<WebSocketOptions>

  constructor(options: WebSocketOptions) {
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 20,
      heartbeatInterval: 30000,
      heartbeatMessage: 'ping',
      shouldReconnect: () => true,
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      onMessage: () => {},
      onReconnect: () => {},
      onReconnectFailed: () => {},
      ...options,
      protocols: options.protocols || [],
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true
    this.shouldReconnect = true

    try {
      this.ws = new WebSocket(this.options.url, this.options.protocols)
      this.setupEventHandlers()
    } catch (error) {
      this.isConnecting = false
      this.options.onError(error as Event)
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.shouldReconnect = false
    this.clearTimers()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(message: WebsocketMessageType): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      throw new Error('WebSocket is not connected')
    }
  }

  sendRaw(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    } else {
      throw new Error('WebSocket is not connected')
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = (_event: Event) => {
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.options.onOpen(_event)
    }

    this.ws.onclose = (_event: CloseEvent) => {
      this.isConnecting = false
      this.stopHeartbeat()
      this.options.onClose(_event)
      this.lastCloseEvent = _event

      if (this.shouldReconnect && !_event.wasClean) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (_event: Event) => {
      this.isConnecting = false
      this.options.onError(_event)
    }

    this.ws.onmessage = (_event: MessageEvent) => {
      // Handle heartbeat responses
      if (_event.data === 'pong' || _event.data === this.options.heartbeatMessage) {
        return
      }

      this.options.onMessage(_event)
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.options.onReconnectFailed()
      return
    }

    // Check if we should reconnect based on the close event
    if (this.lastCloseEvent && !this.options.shouldReconnect(this.lastCloseEvent)) {
      this.options.onReconnectFailed()
      return
    }

    this.reconnectAttempts++
    this.options.onReconnect(this.reconnectAttempts)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, this.options.reconnectInterval)
  }

  private startHeartbeat(): void {
    if (this.options.heartbeatInterval <= 0) return

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(this.options.heartbeatMessage)
      }
    }, this.options.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
  }
}

export default WebSocketManager
