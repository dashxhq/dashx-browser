import Client, { WebsocketMessage, DASHX_CLOSE_CODES } from './Client'
import WebSocketManager, { ReadyState } from './WebSocketManager'
import type {
  ClientParams,
  InAppNotifications,
  WebsocketMessageType,
  InAppNotificationData,
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
  setIdentity(uid: string, token: string) { return ensureConfigured().setIdentity(uid, token) },
  setAnonymousIdentity(uid: string) { return ensureConfigured().setAnonymousIdentity(uid) },
  reset() { return ensureConfigured().reset() },

  // Analytics
  track(event: string, data?: any) { return ensureConfigured().track(event, data) },
  trackMessage(params: Parameters<Client['trackMessage']>[0]) { return ensureConfigured().trackMessage(params) },

  // In-App Notifications
  fetchInAppNotifications() { return ensureConfigured().fetchInAppNotifications() },
  addInAppNotificationToCache(notification: InAppNotificationData) { return ensureConfigured().addInAppNotificationToCache(notification) },
  watchFetchInAppNotifications(callback: (_data: InAppNotifications) => void) { return ensureConfigured().watchFetchInAppNotifications(callback) },
  watchFetchInAppNotificationsAggregate(callback: (_data: number) => void) { return ensureConfigured().watchFetchInAppNotificationsAggregate(callback) },
  onNotification(callback: (_notification: InAppNotificationData) => void) { return ensureConfigured().onNotification(callback) },

  // Push Notifications
  subscribe(messaging: FirebaseMessaging, options?: SubscribeOptions) { return ensureConfigured().subscribe(messaging, options) },
  unsubscribe() { return ensureConfigured().unsubscribe() },
  onPushNotificationReceived(callback: (_payload: DashXPushPayload) => void) { return ensureConfigured().onPushNotificationReceived(callback) },

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
export { Client, WebsocketMessage, WebSocketManager, DASHX_CLOSE_CODES, ReadyState }
export type {
  AiAgent,
  AiAgentStarterMessage,
  AiAgentStarterSuggestion,
  AiNotification,
  ClientParams,
  ContactKind,
  ContactStatus,
  DashXPushPayload,
  FirebaseMessaging,
  InAppNotificationData,
  InAppNotifications,
  ProductVariantRelease,
  ProductVariantReleaseRule,
  QueuedMessage,
  SubscribeOptions,
  TrackMessageStatus,
  WebSocketOptions,
  WebsocketMessageType,
}
