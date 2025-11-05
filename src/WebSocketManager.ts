import uuid from 'uuid-random'

import { WebsocketMessage, WebsocketMessageType } from './Client'

/* eslint-disable no-unused-vars */
export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}
/* eslint-enable no-unused-vars */

export interface QueuedMessage {
  message: WebsocketMessageType
  timestamp: number
  retryCount: number
}

export interface WebSocketOptions {
  url: string
  protocols?: string | string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  heartbeatMessage?: WebsocketMessageType
  connectionTimeout?: number
  pingTimeout?: number
  maxMessageRetries?: number
  messageRetryInterval?: number
  shouldReconnect?: boolean | ((_closeEvent: CloseEvent) => boolean)
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
  private connectionTimeoutTimer: NodeJS.Timeout | null = null
  private pingTimeoutTimer: NodeJS.Timeout | null = null
  private messageRetryTimer: NodeJS.Timeout | null = null
  private isConnecting = false
  private shouldReconnect = true
  private lastCloseEvent: CloseEvent | null = null
  private messageQueue: QueuedMessage[] = []
  private isWaitingForPong = false

  private options: Required<Omit<WebSocketOptions, 'shouldReconnect'>> & {
    shouldReconnect: (_closeEvent: CloseEvent) => boolean
  }

  constructor(options: WebSocketOptions) {
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 20,
      heartbeatInterval: 30000,
      heartbeatMessage: { type: WebsocketMessage.PING, data: { nonce: uuid() } },
      connectionTimeout: 10000, // 10 seconds connection timeout
      pingTimeout: 5000, // 5 seconds ping timeout
      maxMessageRetries: 3,
      messageRetryInterval: 1000,
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      onMessage: () => {},
      onReconnect: () => {},
      onReconnectFailed: () => {},
      ...options,
      protocols: options.protocols || [],
      // Convert boolean to function or use provided function, default to true
      shouldReconnect: typeof options.shouldReconnect === 'boolean'
        ? () => options.shouldReconnect as boolean
        : (options.shouldReconnect as ((_closeEvent: CloseEvent) => boolean) || (() => true)),
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

      // Set connection timeout
      this.connectionTimeoutTimer = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          console.warn(`WebSocket connection timeout after ${this.options.connectionTimeout}ms`)
          this.ws.close()
        }
      }, this.options.connectionTimeout)

    } catch (error) {
      this.isConnecting = false
      this.options.onError(error as Event)
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.shouldReconnect = false
    this.clearTimers()
    this.messageQueue = []

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(message: WebsocketMessageType): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message for later if not connected
      this.queueMessage(message)
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

  get queuedMessageCount(): number {
    return this.messageQueue.length
  }

  private queueMessage(message: WebsocketMessageType): void {
    const queuedMessage: QueuedMessage = {
      message,
      timestamp: Date.now(),
      retryCount: 0,
    }
    this.messageQueue.push(queuedMessage)
    console.log(`Message queued. Queue size: ${this.messageQueue.length}`)
  }

  private processMessageQueue(): void {
    if (!this.isConnected || this.messageQueue.length === 0) return

    const messagesToSend = this.messageQueue.filter(
      (queued) => queued.retryCount < this.options.maxMessageRetries
    )

    messagesToSend.forEach((queued) => {
      try {
        this.ws!.send(JSON.stringify(queued.message))
        // Remove from queue on successful send
        this.messageQueue = this.messageQueue.filter((m) => m !== queued)
        console.log('Queued message sent successfully')
      } catch {
        queued.retryCount++
        console.warn(`Failed to send queued message, retry ${queued.retryCount}/${this.options.maxMessageRetries}`)
      }
    })

    // Remove messages that have exceeded max retries
    this.messageQueue = this.messageQueue.filter(
      (queued) => queued.retryCount < this.options.maxMessageRetries
    )
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = (_event: Event) => {
      this.isConnecting = false
      this.reconnectAttempts = 0

      // Clear connection timeout
      if (this.connectionTimeoutTimer) {
        clearTimeout(this.connectionTimeoutTimer)
        this.connectionTimeoutTimer = null
      }

      this.startHeartbeat()
      this.processMessageQueue() // Send any queued messages
      this.options.onOpen(_event)
    }

    this.ws.onclose = (_event: CloseEvent) => {
      this.isConnecting = false
      this.stopHeartbeat()
      this.clearPingTimeout()

      // Clear connection timeout
      if (this.connectionTimeoutTimer) {
        clearTimeout(this.connectionTimeoutTimer)
        this.connectionTimeoutTimer = null
      }

      this.options.onClose(_event)
      this.lastCloseEvent = _event

      // Always attempt to reconnect unless explicitly told not to
      if (this.shouldReconnect) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (_event: Event) => {
      this.isConnecting = false

      // Clear connection timeout
      if (this.connectionTimeoutTimer) {
        clearTimeout(this.connectionTimeoutTimer)
        this.connectionTimeoutTimer = null
      }

      this.options.onError(_event)
    }

    this.ws.onmessage = (_event: MessageEvent) => {
      // Handle heartbeat responses
      try {
        const data = JSON.parse(_event.data)
        if (data.type === 'PONG') {
          this.clearPingTimeout()
          this.isWaitingForPong = false
          return
        }
      } catch {
        // Not JSON, ignore
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

    // Exponential backoff with jitter
    // const baseDelay = this.options.reconnectInterval
    // const maxDelay = 30000 // 30 seconds max
    // const exponentialDelay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), maxDelay)
    // const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    const finalDelay = 2000

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${Math.round(finalDelay)}ms`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, finalDelay)
  }

  private startHeartbeat(): void {
    if (this.options.heartbeatInterval <= 0) return

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN && !this.isWaitingForPong) {
        this.ws.send(JSON.stringify(this.options.heartbeatMessage))
        this.isWaitingForPong = true

        // Set ping timeout
        this.pingTimeoutTimer = setTimeout(() => {
          if (this.isWaitingForPong) {
            console.warn('Ping timeout - no pong received')
            this.ws?.close()
          }
        }, this.options.pingTimeout)
      }
    }, this.options.heartbeatInterval)
  }

  private clearPingTimeout(): void {
    if (this.pingTimeoutTimer) {
      clearTimeout(this.pingTimeoutTimer)
      this.pingTimeoutTimer = null
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    this.clearPingTimeout()
    this.isWaitingForPong = false
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer)
      this.connectionTimeoutTimer = null
    }
    if (this.messageRetryTimer) {
      clearTimeout(this.messageRetryTimer)
      this.messageRetryTimer = null
    }
    this.stopHeartbeat()
  }
}

export default WebSocketManager
