import Client, { WebsocketMessage, DASHX_CLOSE_CODES } from './Client'
import WebSocketManager, { ReadyState } from './WebSocketManager'
import type { ClientParams, InAppNotifications, WebsocketMessageType, InAppNotificationData, ProductVariantReleaseRule, ProductVariantRelease, AiAgent, AiMessage, AiAgentStarterMessage, AiAgentStarterSuggestion } from './Client'
import type { WebSocketOptions, QueuedMessage } from './WebSocketManager'

export default (params: ClientParams): Client => new Client(params)
export { WebsocketMessage, WebSocketManager, DASHX_CLOSE_CODES, ReadyState }
export type {
  Client,
  ClientParams,
  InAppNotificationData,
  InAppNotifications,
  ProductVariantReleaseRule,
  ProductVariantRelease,
  AiAgent,
  AiMessage,
  AiAgentStarterMessage,
  AiAgentStarterSuggestion,
  QueuedMessage,
  WebsocketMessageType,
  WebSocketOptions,
}
