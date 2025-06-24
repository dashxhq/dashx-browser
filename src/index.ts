import Client, { WebsocketMessage } from './Client'
import type { ClientParams, InAppNotifications, WebsocketMessageType } from './Client'
import WebSocketManager from './WebSocketManager'
import type { WebSocketOptions } from './WebSocketManager'

export default (params: ClientParams): Client => new Client(params)
export { WebsocketMessage, WebSocketManager }
export type {
  Client,
  ClientParams,
  InAppNotifications,
  WebsocketMessageType,
  WebSocketOptions
}
