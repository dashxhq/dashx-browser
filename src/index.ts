import Client, { WebsocketMessage, DASHX_CLOSE_CODES } from './Client'
import type { ClientParams, InAppNotifications, WebsocketMessageType } from './Client'
import WebSocketManager, { ReadyState } from './WebSocketManager'
import type { WebSocketOptions, QueuedMessage } from './WebSocketManager'

export default (params: ClientParams): Client => new Client(params)
export { WebsocketMessage, WebSocketManager, DASHX_CLOSE_CODES, ReadyState }
export type {
  Client,
  ClientParams,
  InAppNotifications,
  WebsocketMessageType,
  WebSocketOptions,
  QueuedMessage
}
