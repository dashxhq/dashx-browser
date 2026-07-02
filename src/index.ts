import Client, {
  WebsocketMessage,
  isTerminalCloseCode,
  IN_APP_MESSAGES_PAGE_SIZE,
  TERMINAL_CLOSE_CODE_MIN,
  TERMINAL_CLOSE_CODE_MAX,
} from './Client'
import WebSocketManager, { ReadyState } from './WebSocketManager'
import type {
  ClientParams,
  InAppMessages,
  WebsocketMessageType,
  InAppMessageData,
  InAppChatMessageData,
  StartInAppChatConversationArgs,
  SendInAppChatMessageArgs,
  FetchInAppChatMessagesArgs,
  ProductVariantReleaseRule,
  ProductVariantRelease,
  AiAgent,
  AiNotification,
  AiAgentStarterMessage,
  AiAgentStarterSuggestion,
  DashXPushPayload,
  FirebaseMessaging,
  SubscribeOptions,
} from './Client'
import type { WebSocketOptions, QueuedMessage } from './WebSocketManager'
import type { ContactKind, ContactStatus, TrackMessageStatus } from './generated'

let instance: Client | null = null

function ensureConfigured(): Client {
  if (!instance) {
    throw new Error('DashX.configure() must be called before using any other method.')
  }
  return instance
}

const DashX = {
  configure(params: ClientParams): Client {
    instance = new Client(params)
    return instance
  },

  createClient(params: ClientParams): Client {
    return new Client(params)
  },

  // Identity
  identify(options: string | Record<string, any>) { return ensureConfigured().identify(options as any) },
  // Forward the exact arguments (not a fixed `(uid, token)`) so a zero-arg
  // `DashX.setIdentity()` reaches `Client.setIdentity()` with no args and is
  // detected as a logout. Hard-coding two args makes it `(undefined, undefined)`,
  // which the client reads as "leave both unchanged" — silently breaking logout.
  setIdentity(...args: Parameters<Client['setIdentity']>) { return ensureConfigured().setIdentity(...args) },
  setAnonymousIdentity(uid: string) { return ensureConfigured().setAnonymousIdentity(uid) },
  reset() { return ensureConfigured().reset() },

  // Analytics
  track(event: string, data?: any) { return ensureConfigured().track(event, data) },
  trackMessage(params: Parameters<Client['trackMessage']>[0]) { return ensureConfigured().trackMessage(params) },

  // In-App Messages
  fetchInAppMessages() { return ensureConfigured().fetchInAppMessages() },
  fetchMoreInAppMessages() { return ensureConfigured().fetchMoreInAppMessages() },
  addInAppMessageToCache(message: InAppMessageData) { return ensureConfigured().addInAppMessageToCache(message) },
  watchFetchInAppMessages(callback: (_data: InAppMessages) => void) { return ensureConfigured().watchFetchInAppMessages(callback) },
  watchFetchInAppMessagesAggregate(callback: (_data: number) => void) { return ensureConfigured().watchFetchInAppMessagesAggregate(callback) },
  onInAppMessage(callback: (_message: InAppMessageData) => void) { return ensureConfigured().onInAppMessage(callback) },

  // Push Notifications
  subscribe(messaging: FirebaseMessaging, options?: SubscribeOptions) { return ensureConfigured().subscribe(messaging, options) },
  unsubscribe() { return ensureConfigured().unsubscribe() },
  onPushNotificationReceived(callback: (_payload: DashXPushPayload) => void) { return ensureConfigured().onPushNotificationReceived(callback) },
  attachForegroundMessaging(messaging: FirebaseMessaging, options?: Parameters<Client['attachForegroundMessaging']>[1]) { return ensureConfigured().attachForegroundMessaging(messaging, options) },
  getNotificationPermission() { return ensureConfigured().getNotificationPermission() },
  requestNotificationPermission() { return ensureConfigured().requestNotificationPermission() },
  showInAppChatNotification(options: Parameters<Client['showInAppChatNotification']>[0]) { return ensureConfigured().showInAppChatNotification(options) },

  // CMS
  searchRecords(resource: string, options?: any) { return ensureConfigured().searchRecords(resource, options) },
  fetchRecord(urn: string, options: any) { return ensureConfigured().fetchRecord(urn, options) },

  // Cart
  addItemToCart(options: any) { return ensureConfigured().addItemToCart(options) },
  applyCouponToCart(options: { couponCode: string }) { return ensureConfigured().applyCouponToCart(options) },
  removeCouponFromCart(options: { couponCode: string }) { return ensureConfigured().removeCouponFromCart(options) },
  fetchCart(options: { orderId?: string }) { return ensureConfigured().fetchCart(options) },
  transferCart(options: { orderId?: string }) { return ensureConfigured().transferCart(options) },

  // Preferences
  fetchStoredPreferences() { return ensureConfigured().fetchStoredPreferences() },
  saveStoredPreferences(preferenceData: any) { return ensureConfigured().saveStoredPreferences(preferenceData) },

  // Contacts
  fetchContacts() { return ensureConfigured().fetchContacts() },
  saveContacts(contacts: any[]) { return ensureConfigured().saveContacts(contacts) },

  // Assets
  upload(options: any) { return ensureConfigured().upload(options) },
  getAsset(options: { id: string }) { return ensureConfigured().getAsset(options) },

  // Product Releases
  fetchProductVariantRelease() { return ensureConfigured().fetchProductVariantRelease() },
  fetchProductVariantReleaseRule() { return ensureConfigured().fetchProductVariantReleaseRule() },
  watchFetchProductVariantReleaseRule(callback: (_data: ProductVariantReleaseRule | null) => void) { return ensureConfigured().watchFetchProductVariantReleaseRule(callback) },

  // AI Agent
  loadAiAgent(options: { publicEmbedKey: string }) { return ensureConfigured().loadAiAgent(options) },
  invokeAiAgent(options: { publicEmbedKey: string; prompt: string; conversationId?: string }) { return ensureConfigured().invokeAiAgent(options) },

  // InApp Chat
  startInAppChatConversation(args: StartInAppChatConversationArgs) { return ensureConfigured().startInAppChatConversation(args) },
  sendInAppChatMessage(args: SendInAppChatMessageArgs) { return ensureConfigured().sendInAppChatMessage(args) },
  fetchInAppChatMessages(args: FetchInAppChatMessagesArgs) { return ensureConfigured().fetchInAppChatMessages(args) },
  subscribeToChannel(channelName: string, handler: (_message: InAppChatMessageData) => void, options?: { onReconnectAck?: () => void }) { return ensureConfigured().subscribeToChannel(channelName, handler, options) },

  // WebSocket
  connectWebSocket() { return ensureConfigured().connectWebSocket() },
  disconnectWebSocket() { return ensureConfigured().disconnectWebSocket() },
  createWebSocketConnection(options?: Parameters<Client['createWebSocketConnection']>[0]) { return ensureConfigured().createWebSocketConnection(options) },
  registerWatchedQuery(refetch: () => void, name: string) { return ensureConfigured().registerWatchedQuery(refetch, name) },
  unregisterWatchedQuery(name: string) { return ensureConfigured().unregisterWatchedQuery(name) },

  // Getters
  get accountUid() { return ensureConfigured().accountUid },
  get accountAnonymousUid() { return ensureConfigured().accountAnonymousUid },
  get identityToken() { return ensureConfigured().identityToken },
  get isWebSocketConnected() { return ensureConfigured().isWebSocketConnected },
  get graphqlClient() { return ensureConfigured().graphqlClient },
  get context() { return ensureConfigured().context },
}

export default DashX
export {
  Client,
  WebsocketMessage,
  WebSocketManager,
  isTerminalCloseCode,
  IN_APP_MESSAGES_PAGE_SIZE,
  TERMINAL_CLOSE_CODE_MIN,
  TERMINAL_CLOSE_CODE_MAX,
  ReadyState,
}
export type {
  AiAgent,
  AiAgentStarterMessage,
  AiAgentStarterSuggestion,
  AiNotification,
  ClientParams,
  ContactKind,
  ContactStatus,
  DashXPushPayload,
  FetchInAppChatMessagesArgs,
  FirebaseMessaging,
  InAppChatMessageData,
  InAppMessageData,
  InAppMessages,
  ProductVariantRelease,
  SendInAppChatMessageArgs,
  StartInAppChatConversationArgs,
  ProductVariantReleaseRule,
  QueuedMessage,
  SubscribeOptions,
  TrackMessageStatus,
  WebSocketOptions,
  WebsocketMessageType,
}
