import uuid from 'uuid-random'
import { ApolloCache, ApolloClient, ApolloLink, HttpLink, InMemoryCache, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

import SearchRecordsInputBuilder, { FetchRecordsOptions, SearchRecordsOptions } from './SearchRecordsInputBuilder'
import generateContext from './context'
import WebSocketManager from './WebSocketManager'
import { createLogger } from './logging'
import { getItem, setItem } from './storage'
import packageInfo from '../package.json'
import { DEFAULT_BASE_URI, TRACK_MESSAGE_STATUS } from './constants'
import type { DashXPushPayload } from './push-types'
import {
  AddItemToCartDocument,
  ApplyCouponToCartDocument,
  AssetDocument,
  FetchCartDocument,
  FetchContactsDocument,
  FetchInAppMessagesAggregateDocument,
  FetchInAppMessagesDocument,
  FetchProductVariantReleaseDocument,
  FetchProductVariantReleaseRuleDocument,
  FetchRecordDocument,
  FetchStoredPreferencesDocument,
  IdentifyAccountDocument,
  InvokeAiAgentDocument,
  LoadAiAgentDocument,
  PrepareAssetDocument,
  RemoveCouponFromCartDocument,
  SaveContactsDocument,
  SaveStoredPreferencesDocument,
  SearchRecordsDocument,
  SubscribeContactDocument,
  TrackEventDocument,
  TrackMessageDocument,
  TransferCartDocument,
  UnsubscribeContactDocument,
} from './generated'
import type {
  ContactStubInput,
  FetchInAppMessagesQuery,
  FetchProductVariantReleaseQuery,
  FetchProductVariantReleaseRuleQuery,
  InvokeAiAgentInput,
  InvokeAiAgentQuery,
  LoadAiAgentInput,
  LoadAiAgentQuery,
  SystemContextInput,
  TrackEventInput,
  TrackMessageInput,
} from './generated'

const UPLOAD_RETRY_LIMIT = 5
const UPLOAD_RETRY_TIMEOUT = 3000
const UNIDENTIFIED_USER_ERROR = 'This operation can be performed only by an identified user. Ensure `dashx.identify` is run before calling this method.'

// Terminal close-code band. When the server closes the socket with a code in
// this range, the failure is terminal (bad credentials, missing account,
// forbidden) — reconnecting can't change the outcome, so the SDK stops.
// Everything else (network drops, abnormal 1006, internal errors) keeps
// retrying.
//
// This is intentionally a *range*, not a fixed list: the server can introduce
// new terminal codes (4401 ~ HTTP 401, 4403 ~ HTTP 403, etc.) without an SDK
// update. The codes must sit in 4000-4999 (the only application range browsers
// expose to JS), and the specific app-error code (e.g. 40100/40300) travels in
// the close *reason*, not the code.
const TERMINAL_CLOSE_CODE_MIN = 4400
const TERMINAL_CLOSE_CODE_MAX = 4499

const isTerminalCloseCode = (code: number): boolean => (
  code >= TERMINAL_CLOSE_CODE_MIN && code <= TERMINAL_CLOSE_CODE_MAX
)

type ClientParams = {
  baseUri?: string,
  realtimeBaseUri?: string,
  publicKey: string,
  targetEnvironment: string,
  targetProduct?: string,
  targetVersion?: string
}

type IdentifyParams = Record<string, any>

type UploadInputType = {
  file: File,
  resource?: string,
  attribute?: string,
}

type SubscriptionSucceededData = {
  channel: string,
}

type InAppMessages = FetchInAppMessagesQuery['messages']

type InAppMessageData = Pick<FetchInAppMessagesQuery['messages'][0], 'id' | 'readAt' | 'renderedContent' | 'sentAt'>

// Two-way chat message. Distinct from `InAppMessageData` (notification-style
// broadcast). `turnSeq` rides WS events but is absent from fetched history.
type InAppChatMessageData = {
  id: string,
  externalUid: string | null,
  conversationId: string,
  senderId: string | null,
  aiRole: string | null,
  turnSeq?: number,
  renderedContent: any,
  createdAt: string,
  sentAt: string | null,
}

type StartInAppChatConversationArgs = {
  identityId: string,
  clientIdempotencyKey: string,
  content?: Record<string, any>,
  clientMessageId?: string,
  data?: Record<string, any>,
}

type SendInAppChatMessageArgs = {
  conversationId: string,
  identityId: string,
  content: Record<string, any>,
  clientMessageId: string,
}

type FetchInAppChatMessagesArgs = {
  conversationId: string,
  limit?: number,
  page?: number,
}

type ChatChannelSubscription = {
  channelName: string,
  conversationId: string | null,
  handler: (_message: InAppChatMessageData) => void,
  onReconnectAck?: () => void,
  acked: boolean,
  readyTimedOut: boolean,
  resolveReady: () => void,
}

type ProductVariantReleaseRule = FetchProductVariantReleaseRuleQuery['productVariantReleaseRule']

type ProductVariantRelease = FetchProductVariantReleaseQuery['productVariantRelease']

type AiAgent = LoadAiAgentQuery['loadAiAgent']

type AiNotification = InvokeAiAgentQuery['invokeAiAgent']

type AiAgentStarterMessage = {
  content: string
}

type AiAgentStarterSuggestion = {
  label?: string,
  content: string
}

type ConnectionData = {
  connectionId: string
}

type SubscribeData = {
  accountUid?: string | null,
  accountAnonymousUid?: string | null,
  targetProduct?: string | null,
  channelName?: string | null
}

/* eslint-disable no-unused-vars */
enum WebsocketMessage {
  PING = 'PING',
  PONG = 'PONG',
  CONNECTED = 'CONNECTED',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  SUBSCRIPTION_SUCCEEDED = 'SUBSCRIPTION_SUCCEEDED',
  IN_APP_MESSAGE = 'IN_APP_MESSAGE',
  IN_APP_CHAT_MESSAGE = 'IN_APP_CHAT_MESSAGE',
  PRODUCT_VARIANT_RELEASE_RULE_UPDATED = 'PRODUCT_VARIANT_RELEASE_RULE_UPDATED',
}
/* eslint-enable no-unused-vars */

type WebsocketMessageType =
  | { type: WebsocketMessage.PING }
  | { type: WebsocketMessage.PONG }
  | { type: WebsocketMessage.CONNECTED, data: ConnectionData }
  | { type: WebsocketMessage.SUBSCRIBE, data: SubscribeData }
  | { type: WebsocketMessage.UNSUBSCRIBE, data: SubscribeData }
  | { type: WebsocketMessage.SUBSCRIPTION_SUCCEEDED, data: SubscriptionSucceededData }
  | { type: WebsocketMessage.IN_APP_MESSAGE, data: InAppMessageData }
  | { type: WebsocketMessage.IN_APP_CHAT_MESSAGE, data: InAppChatMessageData }
  | { type: WebsocketMessage.PRODUCT_VARIANT_RELEASE_RULE_UPDATED, data: ProductVariantReleaseRule }

type FirebaseMessaging = {
  getToken(_options?: { vapidKey?: string; serviceWorkerRegistration?: ServiceWorkerRegistration }): Promise<string>
  onMessage(_handler: (_payload: any) => void): () => void
  deleteToken(): Promise<boolean>
}

type SubscribeOptions = {
  vapidKey?: string
  // An already-registered service worker. Takes precedence over
  // `registerServiceWorker` if both are provided. Forwarded to Firebase's
  // `getToken` so Firebase reuses it instead of auto-registering.
  serviceWorkerRegistration?: ServiceWorkerRegistration
  // Path to a service worker script to register before subscribing. The SDK
  // calls `navigator.serviceWorker.register(path)` and uses the resulting
  // registration. Most apps pass `'/firebase-messaging-sw.js'`.
  registerServiceWorker?: string
  // Tag string associated with the DashX Contact record created or updated by
  // this subscribe call. Forwarded verbatim to the `SubscribeContact`
  // mutation's `tag` input field; use it to segment subscriptions (e.g.
  // "mobile", "web", or a workspace identifier).
  tag?: string
  // When true (default), the SDK calls `registration.showNotification` on
  // foreground pushes so the banner appears even when the app tab is focused.
  // Set to false if you render your own in-app UI from the
  // `onPushNotificationReceived` callback and don't want the system banner
  // duplicating it. Firebase's `onMessage` only fires in foreground — the
  // service worker's `onBackgroundMessage` handles the hidden-tab case and is
  // unaffected by this flag.
  showForegroundNotifications?: boolean
}

type AttachForegroundMessagingOptions = {
  // An already-registered service worker. Takes precedence over
  // `registerServiceWorker`. Pass this when your app registers the SW
  // elsewhere (e.g. a Vite plugin) and you want the SDK to reuse that
  // registration directly.
  serviceWorkerRegistration?: ServiceWorkerRegistration
  // Path to a service worker script to register. The SDK calls
  // `navigator.serviceWorker.register(path)` internally and uses the
  // resulting registration to render foreground banners. Pass this when you
  // want the SW active at app mount, not lazily on first Subscribe click —
  // without an active SW, `onPushNotificationReceived` still fires but the
  // system banner can't render. Most apps pass `'/firebase-messaging-sw.js'`.
  registerServiceWorker?: string
}

type PushNotificationCallback = (_payload: DashXPushPayload) => void

type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

type TrackMessageParams = {
  id: TrackMessageInput['id']
  status: TrackMessageInput['status']
  timestamp?: TrackMessageInput['timestamp']
}

// InApp Chat operations. Inlined via `gql` (rather than codegen'd documents)
// so the SDK builds without introspecting a live GraphQL schema; the matching
// `src/graphql/*.gql` files remain the source for typed codegen if wired later.
const START_IN_APP_CHAT_CONVERSATION = gql`
  mutation StartInAppChatConversation($identityId: UUID!, $clientIdempotencyKey: String!, $content: JSON, $clientMessageId: String, $data: JSON) {
    startInAppChatConversation(input: { identityId: $identityId, clientIdempotencyKey: $clientIdempotencyKey, content: $content, clientMessageId: $clientMessageId, data: $data }) {
      id
    }
  }
`

const SEND_IN_APP_CHAT_MESSAGE = gql`
  mutation SendInAppChatMessage($conversationId: UUID!, $identityId: UUID!, $content: JSON!, $clientMessageId: String!) {
    sendInAppChatMessage(input: { conversationId: $conversationId, identityId: $identityId, content: $content, clientMessageId: $clientMessageId }) {
      id conversationId renderedContent externalUid senderId aiRole sentAt createdAt
    }
  }
`

const FETCH_IN_APP_CHAT_MESSAGES = gql`
  query FetchInAppChatMessages($conversationId: UUID!, $limit: Int, $page: Int) {
    fetchInAppChatMessages(input: { conversationId: $conversationId, limit: $limit, page: $page }) {
      id conversationId renderedContent externalUid senderId aiRole sentAt createdAt
    }
  }
`

const IN_APP_CHAT_CHANNEL_PREFIX = 'in_app_chat:conversation:'

// `IN_APP_CHAT_MESSAGE` events carry `conversationId` but not the channel, so
// the conversation id is parsed from the channel name to route events.
function parseChatChannelConversationId(channelName: string): string | null {
  return channelName.startsWith(IN_APP_CHAT_CHANNEL_PREFIX)
    ? channelName.slice(IN_APP_CHAT_CHANNEL_PREFIX.length)
    : null
}

// `ready` rejects (not hangs) if no ack arrives — the WS error frame carries no
// channel, so timeout is the only reliable per-channel failure signal.
const SUBSCRIBE_ACK_TIMEOUT_MS = 10000

class Client {
  #accountAnonymousUid!: string

  #accountUid: string | null = null

  #identityToken: string | null = null

  #websocketManager: WebSocketManager | null = null

  // The most recent manager from `createWebSocketConnection` (covers both the
  // `connectWebSocket` and the React-provider `createWebSocketConnection` paths),
  // used to send chat channel SUBSCRIBE frames.
  #activeWebsocketManager: WebSocketManager | null = null

  #chatChannelSubscriptions: Set<ChatChannelSubscription> = new Set()

  #messageCallbacks: Set<(_message: InAppMessageData) => void> = new Set()

  #firebaseMessaging: FirebaseMessaging | null = null

  #foregroundMessageUnsubscribe: (() => void) | null = null

  #pushNotificationCallbacks: Set<PushNotificationCallback> = new Set()

  #serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  #showForegroundNotifications: boolean = true

  #subscribePromise: Promise<{ id: string; value: string }> | null = null

  #watchedQueries: Set<{ refetch: () => void; name: string }> = new Set()

  graphqlClient!: ApolloClient

  baseUri: string

  realtimeBaseUri: string

  publicKey: string

  targetEnvironment: string

  targetProduct?: string

  targetVersion?: string

  context: SystemContextInput

  private logger = createLogger('CLIENT')

  constructor({
    publicKey,
    baseUri = DEFAULT_BASE_URI,
    realtimeBaseUri = 'wss://realtime.dashx.com',
    targetEnvironment,
    targetProduct,
    targetVersion
  }: ClientParams) {
    this.baseUri = baseUri
    this.realtimeBaseUri = realtimeBaseUri
    this.publicKey = publicKey
    this.targetEnvironment = targetEnvironment
    this.targetProduct = targetProduct
    this.targetVersion = targetVersion
    this.context = generateContext()
    this.loadIdentity()
    this.initGraphqlClient()
  }

  get accountAnonymousUid(): string | null {
    return this.#accountAnonymousUid
  }

  private set accountAnonymousUid(uid: string) {
    if (!uuid.test(uid)) {
      throw new Error('Anonymous UID must be a valid UUID')
    }

    this.#accountAnonymousUid = uid
    setItem('accountAnonymousUid', this.#accountAnonymousUid)
  }

  get accountUid(): string | null {
    return this.#accountUid
  }

  private set accountUid(uid: string | number | null) {
    if (uid == null) {
      this.#accountUid = uid
    } else {
      this.#accountUid = String(uid)
    }

    setItem('accountUid', this.#accountUid)

    // If WebSocket is connected and we just set an accountUid, subscribe to in-app messages
    if (this.#accountUid && this.#websocketManager?.isConnected) {
      this.subscribeToInAppMessages()
    }
  }

  get identityToken(): string | null {
    return this.#identityToken
  }

  private set identityToken(token: string | null) {
    if (token == null) {
      this.#identityToken = token
    } else {
      this.#identityToken = String(token)
    }

    setItem('identityToken', this.#identityToken)
  }

  private initGraphqlClient() {
    const httpLink = new HttpLink({ uri: this.baseUri })

    const authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        'X-Public-Key': this.publicKey,
        'X-Target-Environment': this.targetEnvironment,
        ...(this.#identityToken ? { 'X-Identity-Token': this.#identityToken } : {}),
      },
    }))

    this.graphqlClient = new ApolloClient({
      link: ApolloLink.from([ authLink, httpLink ]),
      cache: new InMemoryCache(),
      devtools: { enabled: true },
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
        },
      },
    })
  }

  private loadIdentity() {
    this.accountAnonymousUid = getItem('accountAnonymousUid') || uuid()
    this.accountUid = getItem('accountUid') || null
    this.identityToken = getItem('identityToken') || null
  }

  identify(_uid: string): Promise<Response>
  identify(_options: IdentifyParams): Promise<Response>
  identify(options?: string | IdentifyParams): Promise<any> | void {
    let variables = { input: {} }

    if (typeof options === 'string') {
      this.accountUid = options

      variables = {
        input: {
          uid: options,
        },
      }
    } else {
      this.accountUid = options?.uid as string

      variables = {
        input: {
          uid: options?.uid,
          anonymousUid: this.#accountAnonymousUid,
          ...options,
        },
      }
    }

    return this.graphqlClient.mutate({ mutation: IdentifyAccountDocument, variables })
      .then((response) => response.data)
  }

  setIdentity(uid?: string | null, token?: string | null): void {
    // Back-compat: a zero-arg `setIdentity()` clears identity (log out), as it
    // did before per-argument semantics were added.
    // eslint-disable-next-line prefer-rest-params
    if (arguments.length === 0) {
      this.accountUid = null
      this.identityToken = null
      return
    }

    // `undefined` means "leave unchanged"; `null` means "explicitly clear". So
    // updating only the token (uid omitted) must not wipe an existing account
    // uid, and vice versa.
    const tokenChanged = token !== undefined && token !== this.#identityToken
    if (uid !== undefined) {
      this.accountUid = uid
    }
    if (token !== undefined) {
      this.identityToken = token
    }

    // Reconnect the client-managed socket (`connectWebSocket`) so the server
    // picks up the new identity token on the WS connection — InApp Chat
    // ownership keys off it. SCOPE: this covers only `#websocketManager`.
    // Consumers who own their socket via `createWebSocketConnection` (e.g.
    // @dashx/react's provider) must reconnect on identity change themselves —
    // the client can't safely recreate a socket whose handlers it doesn't own.
    if (tokenChanged && this.#websocketManager?.isConnected) {
      this.logger.log('Identity token changed while WS is open — reconnecting')
      this.disconnectWebSocket()
      this.connectWebSocket()
    }
  }

  setAnonymousIdentity(uid: string): void {
    this.accountAnonymousUid = uid
  }

  reset(): void {
    this.accountAnonymousUid = uuid()
    this.accountUid = null
    this.identityToken = null
    this.#foregroundMessageUnsubscribe?.()
    this.#foregroundMessageUnsubscribe = null
    this.#firebaseMessaging = null
    setItem('fcmToken', null)
  }

  track(event: string, data?: Pick<TrackEventInput, 'data'>) {
    const variables = {
      input: {
        event,
        data,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
        systemContext: this.context,
      },
    }

    return this.graphqlClient.mutate({ mutation: TrackEventDocument, variables })
  }

  trackMessage({ id, status, timestamp }: TrackMessageParams) {
    const variables = {
      input: {
        id,
        status,
        timestamp: timestamp || new Date().toISOString(),
      },
    }

    let update
    if (status === 'READ' || status === 'UNREAD') {
      if (!this.#accountUid) {
        throw new Error(UNIDENTIFIED_USER_ERROR)
      }

      update = (cache: ApolloCache) => {
        cache.writeFragment({
          data: {
            id,
            readAt: status === 'UNREAD' ? null : new Date(),
            __typename: 'Message',
          },
          fragment: gql`
            fragment UpdateMessage on Message {
              id
              readAt
            }
          `,
        })

        const fetchInAppMessagesAggregateVariables = {
          input: {
            accountUid: this.#accountUid!,
            filter: {
              readAt: 'null',
            },
          },
        }

        const unreadMessagesAggregate = cache.readQuery({
          query: FetchInAppMessagesAggregateDocument,
          variables: fetchInAppMessagesAggregateVariables,
        })

        let counter = 0
        if (status === 'READ') {
          counter = -1
        } else if (status === 'UNREAD') {
          counter = 1
        }

        cache.writeQuery({
          query: FetchInAppMessagesAggregateDocument,
          data: {
            messagesAggregate: {
              __typename: 'FetchInAppMessagesAggregateResponse',
              count: (unreadMessagesAggregate?.messagesAggregate.count || 0) + counter,
            },
          },
          variables: fetchInAppMessagesAggregateVariables,
        })
      }
    }

    return this.graphqlClient.mutate({
      mutation: TrackMessageDocument,
      variables,
      update,
    })
  }

  async fetchInAppMessages() {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const fetchInAppMessagesVariables = {
      input: {
        accountUid: this.#accountUid,
      },
    }

    const fetchInAppMessagesAggregateVariables = {
      input: {
        ...fetchInAppMessagesVariables.input,
        filter: {
          readAt: 'null',
        },
      },
    }

    await Promise.all([
      this.graphqlClient.query({
        query: FetchInAppMessagesDocument,
        variables: fetchInAppMessagesVariables,
      }),
      this.graphqlClient.query({
        query: FetchInAppMessagesAggregateDocument,
        variables: fetchInAppMessagesAggregateVariables,
      }),
    ])
  }

  addInAppMessageToCache(message: InAppMessageData): void {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const fetchInAppMessagesVariables = {
      input: {
        accountUid: this.#accountUid,
      },
    }

    const existingMessages = this.graphqlClient.readQuery({
      query: FetchInAppMessagesDocument,
      variables: fetchInAppMessagesVariables,
    })

    this.graphqlClient.writeQuery({
      query: FetchInAppMessagesDocument,
      data: {
        messages: [
          { ...message, __typename: 'Message' },
          ...existingMessages?.messages || [],
        ],
      },
      variables: fetchInAppMessagesVariables,
    })

    const fetchInAppMessagesAggregateVariables = {
      input: {
        ...fetchInAppMessagesVariables.input,
        filter: {
          readAt: 'null',
        },
      },
    }

    const unreadMessagesAggregate = this.graphqlClient.readQuery({
      query: FetchInAppMessagesAggregateDocument,
      variables: fetchInAppMessagesAggregateVariables,
    })

    this.graphqlClient.writeQuery({
      query: FetchInAppMessagesAggregateDocument,
      data: {
        messagesAggregate: {
          __typename: 'FetchInAppMessagesAggregateResponse',
          count: (unreadMessagesAggregate?.messagesAggregate.count || 0) + 1,
        },
      },
      variables: fetchInAppMessagesAggregateVariables,
    })
  }

  watchFetchInAppMessages(callback: (_data: InAppMessages) => void): () => void {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables = {
      input: {
        accountUid: this.#accountUid,
      },
    }

    const observableQuery = this.graphqlClient.watchQuery({
      query: FetchInAppMessagesDocument,
      variables,
    })

    // Register this query for automatic refetch on WebSocket reconnection
    this.registerWatchedQuery(() => {
      observableQuery.refetch()
    }, 'watchFetchInAppMessages')

    const subscription = observableQuery.subscribe({
      next(_response: any) {
        callback(_response.data?.messages ?? [])
      },
      error: (_err: any) => {
        this.logger.error(_err)
        callback([])
      },
    })

    return () => {
      subscription.unsubscribe()
      this.unregisterWatchedQuery('watchFetchInAppMessages')
    }
  }

  watchFetchInAppMessagesAggregate(callback: (_data: number) => void): () => void {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables = {
      input: {
        accountUid: this.#accountUid,
        filter: {
          readAt: 'null',
        },
      },
    }

    const observableQuery = this.graphqlClient.watchQuery({
      query: FetchInAppMessagesAggregateDocument,
      variables,
    })

    // Register this query for automatic refetch on WebSocket reconnection
    this.registerWatchedQuery(() => {
      observableQuery.refetch()
    }, 'watchFetchInAppMessagesAggregate')

    const subscription = observableQuery.subscribe({
      next(_response: any) {
        callback(_response.data?.messagesAggregate.count || 0)
      },
      error: (_err: any) => {
        this.logger.error(_err)
        callback(0)
      },
    })

    return () => {
      subscription.unsubscribe()
      this.unregisterWatchedQuery('watchFetchInAppMessagesAggregate')
    }
  }

  subscribe(
    messaging: FirebaseMessaging,
    options?: SubscribeOptions,
  ): Promise<{ id: string; value: string }> {
    if (this.#subscribePromise) {
      return this.#subscribePromise
    }

    this.#subscribePromise = this.#performSubscribe(messaging, options)
      .finally(() => { this.#subscribePromise = null })

    return this.#subscribePromise
  }

  async #performSubscribe(
    messaging: FirebaseMessaging,
    options?: SubscribeOptions,
  ): Promise<{ id: string; value: string }> {
    this.#validateMessaging(messaging)

    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error(`Notification permission ${permission}`)
      }
    }

    // Resolve the preferred registration up-front so we can pass it to
    // Firebase's `getToken` AND cache it for foreground banner rendering.
    // Prefers an explicit registration, falls back to registering from a
    // path, else lets Firebase auto-register inside `getToken`.
    this.#ensureServiceWorkerRegistration({
      registration: options?.serviceWorkerRegistration,
      registerPath: options?.registerServiceWorker,
    })

    const token = await messaging.getToken({
      vapidKey: options?.vapidKey,
      // Reuse whatever we cached above (via explicit option, registerPath,
      // or a prior attachForegroundMessaging call) so Firebase doesn't
      // register a second SW at the same scope.
      serviceWorkerRegistration: options?.serviceWorkerRegistration || this.#serviceWorkerRegistration || undefined,
    })

    // Remember the foreground render preference before any listener fires.
    this.#showForegroundNotifications = options?.showForegroundNotifications !== false

    const savedToken = getItem('fcmToken')
    if (savedToken === token) {
      this.logger.log('Already subscribed with this token')
      // Firebase `onMessage` listeners don't survive page reloads — the JS
      // scope they were registered in is gone. Rewire on every subscribe
      // call (even the "already registered with DashX" fast path), otherwise
      // repeat visits silently drop foreground pushes.
      this.#attachForegroundMessaging(messaging)
      return { id: '', value: token }
    }

    const variables = {
      input: {
        kind: 'WEB' as const,
        value: token,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        targetEnvironment: this.targetEnvironment,
        metadata: this.#buildSubscribeMetadata(),
        ...(options?.tag ? { tag: options.tag } : {}),
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: SubscribeContactDocument, variables })

    const result = response.data?.subscribeContact
    if (!result) {
      throw new Error('Failed to subscribe contact')
    }

    setItem('fcmToken', token)
    this.#attachForegroundMessaging(messaging)

    return result
  }

  /**
   * Wire Firebase's `messaging.onMessage` foreground listener without going
   * through the `subscribe` flow. Safe to call on every app mount — listeners
   * don't survive page reloads, so consumers who only call `subscribe` behind
   * an "Enable notifications" button still need a way to rewire after reload.
   * No permission prompt, no `getToken`, no DashX registration — just the
   * Firebase listener pipe.
   *
   * Pass `options.registerServiceWorker: '/firebase-messaging-sw.js'` (or
   * `options.serviceWorkerRegistration` if you register elsewhere) to ensure
   * the foreground system banner renders. Without either, the SDK only hits
   * `navigator.serviceWorker.ready`, which stays pending until something
   * else registers an SW — meaning the banner won't render on the first
   * push if `subscribe` hasn't been called yet.
   */
  attachForegroundMessaging(messaging: FirebaseMessaging, options?: AttachForegroundMessagingOptions): void {
    this.#validateMessaging(messaging)
    this.#ensureServiceWorkerRegistration({
      registration: options?.serviceWorkerRegistration,
      registerPath: options?.registerServiceWorker,
    })
    this.#attachForegroundMessaging(messaging)
  }

  /**
   * Returns the current Notification permission state, or `'unsupported'`
   * when the Notification API is unavailable (non-browser runtime, or very
   * restricted contexts). Useful for gating `subscribe()` so consumers can
   * avoid the SDK throwing on a permanently-denied permission.
   */
  getNotificationPermission(): NotificationPermissionState {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission as NotificationPermissionState
  }

  #validateMessaging(messaging: FirebaseMessaging): void {
    if (!messaging || typeof messaging.getToken !== 'function' || typeof messaging.onMessage !== 'function') {
      throw new Error(
        'DashX: invalid `messaging` argument. Expected an object with `getToken`, `onMessage`, and `deleteToken` methods (see the FirebaseMessaging interface).',
      )
    }
  }

  // Single source of truth for populating `#serviceWorkerRegistration`.
  // Preference order:
  //   1. Explicit registration passed in (`options.registration`)
  //   2. Already-cached registration (early-return)
  //   3. Register a new SW from `options.registerPath`
  //   4. Opportunistically resolve `navigator.serviceWorker.ready` if an SW
  //      was registered elsewhere in the app (e.g. by Firebase's `getToken`)
  // Both `subscribe` and `attachForegroundMessaging` route through this so
  // the priority rules live in exactly one place.
  #ensureServiceWorkerRegistration(options?: {
    registration?: ServiceWorkerRegistration
    registerPath?: string
  }): void {
    if (options?.registration) {
      this.#serviceWorkerRegistration = options.registration
      return
    }
    if (this.#serviceWorkerRegistration) return
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return

    if (options?.registerPath) {
      navigator.serviceWorker
        .register(options.registerPath)
        .then((registration) => { this.#serviceWorkerRegistration = registration })
        .catch((error) => { this.logger.error('Error registering service worker:', error) })
      return
    }

    if (navigator.serviceWorker.ready) {
      // Don't await — the promise resolves before a push can plausibly
      // arrive, and awaiting would stall the subscribe pipeline.
      navigator.serviceWorker.ready
        .then((registration) => { this.#serviceWorkerRegistration = registration })
        .catch(() => { /* no SW available; banner render will be skipped */ })
    }
  }

  // Build the `metadata` JSON sent at subscribe time and recorded against
  // the Contact.
  // `library.name` is the package's npm name (`@dashx/browser`), matching
  // what `SystemContext.library.name` already sends on track/identify so
  // the browser SDK is internally consistent.
  // Returns the object directly; Apollo serializes it for the JSON scalar.
  #buildSubscribeMetadata(): Record<string, unknown> {
    const app: Record<string, unknown> = {}
    if (typeof window !== 'undefined' && window.location?.origin) {
      app.identifier = window.location.origin
    }
    return {
      app,
      library: {
        name: packageInfo.name,
        version: packageInfo.version,
      },
    }
  }

  // Decode the DashX payload carried under `payload.data.dashx`.
  // Falls back to Firebase's `payload.notification` shape (used when the push
  // is delivered as a "notification" message rather than a "data" message).
  // Returns null when neither shape yields a valid payload — caller skips.
  #parsePushPayload(payload: any): DashXPushPayload | null {
    if (payload?.data?.dashx) {
      try {
        return JSON.parse(payload.data.dashx) as DashXPushPayload
      } catch (error) {
        this.logger.error('Error parsing dashx data payload:', error)
      }
    }

    if (payload?.notification) {
      return {
        id: payload.messageId || payload.fcmMessageId || '',
        title: payload.notification.title,
        body: payload.notification.body,
        image: payload.notification.image,
      }
    }

    return null
  }

  #dispatchToPushCallbacks(parsed: DashXPushPayload): void {
    this.#pushNotificationCallbacks.forEach((callback) => {
      try {
        callback(parsed)
      } catch (error) {
        this.logger.error('Error in push notification callback:', error)
      }
    })
  }

  // Render the foreground system banner via the SW registration. No-ops when
  // the consumer opted out or when the registration isn't available yet.
  // Tap handling (CLICKED track + URL navigation) still flows through the
  // service worker's `onNotificationClick`, regardless of which path showed
  // the banner.
  #renderForegroundBanner(parsed: DashXPushPayload): void {
    if (!this.#showForegroundNotifications) return
    if (!this.#serviceWorkerRegistration) return

    this.#serviceWorkerRegistration
      .showNotification(parsed.title || '', {
        body: parsed.body || '',
        icon: parsed.image,
        data: { dashxNotificationId: parsed.id, url: parsed.url },
      })
      .catch((error) => {
        this.logger.error('Error showing foreground notification:', error)
      })
  }

  #attachForegroundMessaging(messaging: FirebaseMessaging): void {
    this.#firebaseMessaging = messaging

    // Opportunistic hydration when the consumer reached us via
    // `attachForegroundMessaging` rather than `subscribe`. Idempotent — the
    // helper is a no-op if a registration is already cached.
    this.#ensureServiceWorkerRegistration()

    this.#foregroundMessageUnsubscribe?.()
    this.#foregroundMessageUnsubscribe = messaging.onMessage((payload: any) => {
      this.logger.log('Foreground message received:', JSON.stringify(payload))

      const parsed = this.#parsePushPayload(payload)
      if (!parsed) return

      // DELIVERED is tracked exactly once per push: here on the foreground
      // path, or in `sw-helper.ts:onBackgroundMessage` on the background
      // path. Firebase's contract is that the two paths are mutually
      // exclusive for a given message.
      if (parsed.id) {
        this.trackMessage({ id: parsed.id, status: TRACK_MESSAGE_STATUS.DELIVERED })
      }

      this.#dispatchToPushCallbacks(parsed)
      this.#renderForegroundBanner(parsed)
    })
  }

  async unsubscribe(): Promise<{ success: boolean }> {
    const savedToken = getItem('fcmToken')
    if (!savedToken) {
      // Legitimate "nothing to unsubscribe": resolve with `success: false`
      // rather than throwing — a missing local token is not an error, the
      // device just isn't subscribed in this session. Errors are reserved for
      // transport / SDK-state failures.
      return { success: false }
    }

    if (this.#firebaseMessaging) {
      await this.#firebaseMessaging.deleteToken()
    }

    this.#foregroundMessageUnsubscribe?.()
    this.#foregroundMessageUnsubscribe = null

    const variables = {
      input: {
        value: savedToken,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: UnsubscribeContactDocument, variables })

    const result = response.data?.unsubscribeContact
    if (!result) {
      throw new Error('Failed to unsubscribe contact')
    }

    setItem('fcmToken', null)
    this.#firebaseMessaging = null

    return result
  }

  onPushNotificationReceived(callback: PushNotificationCallback): () => void {
    this.#pushNotificationCallbacks.add(callback)

    return () => {
      this.#pushNotificationCallbacks.delete(callback)
    }
  }

  searchRecords(_resource: string): SearchRecordsInputBuilder
  searchRecords(_resource: string, _options: SearchRecordsOptions): Promise<any>
  searchRecords(_resource: string, _options?: SearchRecordsOptions): SearchRecordsInputBuilder | Promise<any> {
    if (!_options) {
      return new SearchRecordsInputBuilder(
        _resource,
        async (_wrappedOptions) => {
          const variables = {
            input: {
              ..._wrappedOptions,
              resource: _resource,
            },
          }

          const response = await this.graphqlClient.query({
            query: SearchRecordsDocument,
            variables,
          })

          return response.data?.searchRecords
        },
      )
    }

    const variables = {
      input: { ..._options, resource: _resource },
    }

    const result = this.graphqlClient.query({ query: SearchRecordsDocument, variables })
      .then((response) => response.data?.searchRecords)

    return result
  }

  async fetchRecord(urn: string, options: FetchRecordsOptions): Promise<any> {
    if (!urn.includes('/')) {
      throw new Error('URN must be of form: {contentType}/{content}')
    }

    const [ resource, recordId ] = urn.split('/')
    const variables = {
      input: { resource, recordId, ...options },
    }

    const response = await this.graphqlClient.query({ query: FetchRecordDocument, variables })
    return response.data?.fetchRecord
  }

  async addItemToCart({ custom = {}, ...options }: {
    itemId: string,
    pricingId: string,
    quantity: string,
    reset: boolean,
    custom?: Record<string, any>,
  }): Promise<any> {
    const variables = {
      input: {
        custom,
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: AddItemToCartDocument, variables })
    return response.data?.addItemToCart
  }

  async applyCouponToCart(options: { couponCode: string }): Promise<any> {
    const variables = {
      input: {
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: ApplyCouponToCartDocument, variables })
    return response.data?.applyCouponToCart
  }

  async removeCouponFromCart(options: { couponCode: string }): Promise<any> {
    const variables = {
      input: {
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: RemoveCouponFromCartDocument, variables })
    return response.data?.removeCouponFromCart
  }

  async fetchCart(options: { orderId?: string }): Promise<any> {
    const variables = {
      input: {
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient.query({ query: FetchCartDocument, variables })
    return response.data?.fetchCart
  }

  async transferCart(options: { orderId?: string }): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables = {
      input: {
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: TransferCartDocument, variables })
    return response.data?.transferCart
  }

  async fetchStoredPreferences(): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables = {
      input: {
        accountUid: this.#accountUid,
      },
    }

    const response = await this.graphqlClient
      .query({ query: FetchStoredPreferencesDocument, variables })
    return response.data?.fetchStoredPreferences.preferenceData
  }

  async saveStoredPreferences(preferenceData: any): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables = {
      input: {
        accountUid: this.#accountUid,
        preferenceData,
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: SaveStoredPreferencesDocument, variables })
    return response?.data?.saveStoredPreferences
  }

  async fetchContacts(): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables = {
      input: { uid: this.#accountUid },
    }

    const response = await this.graphqlClient.query({ query: FetchContactsDocument, variables })
    return response?.data?.fetchContacts?.contacts
  }

  async saveContacts(contacts: Pick<ContactStubInput, 'kind' | 'value' | 'tag'>[]): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables = {
      input: {
        uid: this.#accountUid,
        contacts,
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: SaveContactsDocument, variables })
    return response?.data?.saveContacts
  }

  async upload(options: UploadInputType) {
    const { file, attribute, resource } = options
    const variables = {
      input: {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        attribute,
        resource,
        targetEnvironment: this.targetEnvironment,
      },
    }

    const response = await this.graphqlClient
      .mutate({ mutation: PrepareAssetDocument, variables })

    const id = response?.data?.prepareAsset?.id
    const url = response?.data?.prepareAsset?.data?.upload?.url

    if (!url || !id) {
      throw new Error('Something went wrong')
    }

    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'x-goog-meta-origin-id': id,
      },
    })

    let retryLefts = UPLOAD_RETRY_LIMIT
    const checkAsset = async (): Promise<any> => {
      const asset = await this.getAsset({ id })

      const status = asset?.uploadStatus

      if (status === 'UPLOADED') return Promise.resolve(asset)

      await new Promise((resolve) => { setTimeout(resolve, UPLOAD_RETRY_TIMEOUT) })

      retryLefts -= 1
      if (!retryLefts) {
        return Promise.reject(new Error('Something went wrong'))
      }

      return checkAsset()
    }

    return checkAsset()
  }

  async getAsset(options: { id: string }) {
    const { id } = options

    const variables = { id }
    const response = await this.graphqlClient.query({ query: AssetDocument, variables })

    return response?.data?.asset
  }

  async fetchProductVariantRelease(): Promise<ProductVariantRelease> {
    if (!this.targetVersion) {
      throw new Error('`targetVersion` must be set when initializing the client')
    }

    const variables = {
      input: {
        targetVersion: this.targetVersion,
        targetEnvironment: this.targetEnvironment,
      },
    }

    const response = await this.graphqlClient.query({
      query: FetchProductVariantReleaseDocument,
      variables,
    })

    return response.data!.productVariantRelease
  }

  async loadAiAgent({publicEmbedKey}: Pick<LoadAiAgentInput, 'publicEmbedKey'>): Promise<AiAgent> {
    if (!publicEmbedKey) {
      throw new Error('`publicEmbedKey` must be specified')
    }

    const variables = {
      input: {
        publicEmbedKey,
        targetEnvironment: this.targetEnvironment,
      },
    }

    const response = await this.graphqlClient.query({
      query: LoadAiAgentDocument,
      variables,
    })

    if (response.error) {
      throw new Error(response.error.message || 'Failed to load AI agent')
    }

    return response.data!.loadAiAgent
  }

  async invokeAiAgent({conversationId, prompt, publicEmbedKey}: Pick<InvokeAiAgentInput, 'conversationId' | 'prompt' | 'publicEmbedKey'>): Promise<AiNotification> {
    if (!prompt) {
      throw new Error('`prompt` must be specified')
    }
    if (!publicEmbedKey) {
      throw new Error('`publicEmbedKey` must be specified')
    }

    const variables = {
      input: {
        conversationId,
        prompt,
        publicEmbedKey,
        targetEnvironment: this.targetEnvironment,
      },
    }

    const response = await this.graphqlClient.query({
      query: InvokeAiAgentDocument,
      variables,
    })

    if (response.error) {
      throw new Error(response.error.message || 'Failed to invoke AI agent')
    }

    return response.data!.invokeAiAgent
  }

  async fetchProductVariantReleaseRule(): Promise<ProductVariantReleaseRule> {
    if (!this.targetProduct) {
      throw new Error('`targetProduct` must be set when initializing the client')
    }

    const variables = {
      input: {
        targetProduct: this.targetProduct,
        targetEnvironment: this.targetEnvironment,
      },
    }

    const response = await this.graphqlClient.query({
      query: FetchProductVariantReleaseRuleDocument,
      variables,
    })

    return response.data!.productVariantReleaseRule
  }

  watchFetchProductVariantReleaseRule(callback: (_data: ProductVariantReleaseRule | null) => void): void {
    if (!this.targetProduct) {
      throw new Error('`targetProduct` must be set when initializing the client')
    }

    const variables = {
      input: {
        targetProduct: this.targetProduct,
        targetEnvironment: this.targetEnvironment,
      },
    }

    const observableQuery = this.graphqlClient.watchQuery({
      query: FetchProductVariantReleaseRuleDocument,
      variables,
    })

    // Register this query for automatic refetch on WebSocket reconnection
    this.registerWatchedQuery(() => {
      observableQuery.refetch()
    }, 'watchFetchProductVariantReleaseRule')

    observableQuery.subscribe({
      next(_response: any) {
        callback(_response.data?.productVariantReleaseRule ?? null)
      },
      error: (_err: any) => {
        this.logger.error(_err)
        callback(null)
      },
    })
  }

  // WebSocket methods for real-time functionality
  connectWebSocket(): void {
    if (this.#websocketManager?.isConnected) {
      return
    }

    this.#websocketManager = this.createWebSocketConnection()
    this.#websocketManager.connect()
  }

  disconnectWebSocket(): void {
    this.#websocketManager?.disconnect()
    this.#websocketManager = null
  }

  get isWebSocketConnected(): boolean {
    return this.#websocketManager?.isConnected ?? false
  }

  // Register a watched query for automatic refetch on WebSocket reconnection
  registerWatchedQuery(refetch: () => void, name: string): void {
    this.#watchedQueries.add({ refetch, name })
  }

  unregisterWatchedQuery(name: string): void {
    this.#watchedQueries.forEach((query) => {
      if (query.name === name) {
        this.#watchedQueries.delete(query)
      }
    })
  }

  // Trigger refetch of all watched queries
  private refetchWatchedQueries(): void {
    this.#watchedQueries.forEach(({ refetch, name }) => {
      try {
        refetch()
      } catch (error) {
        this.logger.error(`Error refetching ${name}:`, error)
      }
    })
  }

  // In-app message callback management
  onInAppMessage(callback: (_message: InAppMessageData) => void): () => void {
    this.#messageCallbacks.add(callback)

    // Return unsubscribe function
    return () => {
      this.#messageCallbacks.delete(callback)
    }
  }

  private notifyMessageCallbacks(message: InAppMessageData): void {
    this.#messageCallbacks.forEach(callback => {
      try {
        callback(message)
      } catch (error) {
        this.logger.error('Error in in-app message callback:', error)
      }
    })
  }

  // ── InApp Chat ──────────────────────────────────────────────────────────

  startInAppChatConversation(args: StartInAppChatConversationArgs): Promise<{ id: string }> {
    return this.graphqlClient
      .mutate<{ startInAppChatConversation: { id: string } }>({
        mutation: START_IN_APP_CHAT_CONVERSATION,
        variables: args,
      })
      .then((response) => response.data!.startInAppChatConversation)
  }

  sendInAppChatMessage(args: SendInAppChatMessageArgs): Promise<InAppChatMessageData> {
    return this.graphqlClient
      .mutate<{ sendInAppChatMessage: InAppChatMessageData }>({
        mutation: SEND_IN_APP_CHAT_MESSAGE,
        variables: args,
      })
      .then((response) => response.data!.sendInAppChatMessage)
  }

  fetchInAppChatMessages(args: FetchInAppChatMessagesArgs): Promise<InAppChatMessageData[]> {
    return this.graphqlClient
      .query<{ fetchInAppChatMessages: InAppChatMessageData[] }>({
        query: FETCH_IN_APP_CHAT_MESSAGES,
        variables: args,
        fetchPolicy: 'network-only',
      })
      .then((response) => response.data?.fetchInAppChatMessages ?? [])
  }

  // Subscribe to a realtime channel (e.g. `in_app_chat:conversation:{id}`).
  // `ready` resolves on the first server ack; reconnects re-subscribe and fire
  // `onReconnectAck` so callers can refetch anything missed during the outage.
  subscribeToChannel(
    channelName: string,
    handler: (_message: InAppChatMessageData) => void,
    options?: { onReconnectAck?: () => void },
  ): { ready: Promise<void>, unsubscribe: () => void } {
    let resolveReady!: () => void
    let rejectReady!: (_error: Error) => void
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve
      rejectReady = reject
    })

    const subscription: ChatChannelSubscription = {
      channelName,
      conversationId: parseChatChannelConversationId(channelName),
      handler,
      onReconnectAck: options?.onReconnectAck,
      acked: false,
      readyTimedOut: false,
      resolveReady,
    }
    this.#chatChannelSubscriptions.add(subscription)

    const timeout = setTimeout(() => {
      if (!subscription.acked) {
        subscription.readyTimedOut = true
        rejectReady(new Error(`Timed out subscribing to channel: ${channelName}`))
      }
    }, SUBSCRIBE_ACK_TIMEOUT_MS)
    subscription.resolveReady = () => {
      clearTimeout(timeout)
      resolveReady()
    }

    // Send now if connected; otherwise the next `onOpen` re-subscribe sends it.
    if (this.#activeWebsocketManager?.isConnected) {
      this.#activeWebsocketManager.send({
        type: WebsocketMessage.SUBSCRIBE,
        data: { channelName },
      })
    }

    return {
      ready,
      unsubscribe: () => {
        clearTimeout(timeout)
        this.#chatChannelSubscriptions.delete(subscription)
        // Tell the server to stop forwarding this channel; without it the
        // subscription lives on the socket until disconnect and events keep
        // arriving at the page-level `onMessage`.
        if (this.#activeWebsocketManager?.isConnected) {
          this.#activeWebsocketManager.send({
            type: WebsocketMessage.UNSUBSCRIBE,
            data: { channelName },
          })
        }
      },
    }
  }

  private resubscribeChatChannels(manager: WebSocketManager): void {
    this.#chatChannelSubscriptions.forEach((subscription) => {
      manager.send({
        type: WebsocketMessage.SUBSCRIBE,
        data: { channelName: subscription.channelName },
      })
    })
  }

  private handleChatChannelSubscriptionSucceeded(channel: string): void {
    this.#chatChannelSubscriptions.forEach((subscription) => {
      if (subscription.channelName !== channel) {
        return
      }
      if (subscription.acked) {
        subscription.onReconnectAck?.()
      } else {
        subscription.acked = true
        if (subscription.readyTimedOut) {
          // `ready` already rejected on timeout; treat this first real ack as a
          // recovery so the caller can load anything it deferred.
          subscription.onReconnectAck?.()
        } else {
          subscription.resolveReady()
        }
      }
    })
  }

  private notifyChatChannelSubscribers(message: InAppChatMessageData): void {
    this.#chatChannelSubscriptions.forEach((subscription) => {
      // Route by conversation id (the event carries no channel name), so two
      // open chat widgets on one socket don't receive each other's messages.
      if (subscription.conversationId && subscription.conversationId !== message.conversationId) {
        return
      }
      try {
        subscription.handler(message)
      } catch (error) {
        this.logger.error('Error in chat channel handler:', error)
      }
    })
  }

  // Flexible WebSocket connection method for different frameworks. The caller
  // owns the returned manager's lifecycle — including reconnecting it on an
  // identity-token change (`setIdentity` only auto-reconnects the
  // `connectWebSocket`-managed socket; see `setIdentity`).
  createWebSocketConnection(options?: {
    onMessage?: (_message: WebsocketMessageType) => void
    onOpen?: () => void
    onClose?: (_event: CloseEvent) => void
    onError?: (_error: Event) => void
    onReconnect?: (_attempt: number) => void
    onReconnectFailed?: () => void
    queryParams?: Record<string, string>
    shouldReconnect?: boolean | ((_closeEvent: CloseEvent) => boolean)
  }): WebSocketManager {
    // Build URL with query parameters. `identityToken` is auto-injected from
    // the stored value (set via `setIdentity`) so the SDK uses the same token
    // for both GraphQL (X-Identity-Token header) and the WS handshake — the
    // server identifies the visitor from it, which gates InApp Chat ownership.
    // The key is camelCase to match the other handshake params
    // (`publicKey`/`targetEnvironment`).
    const mergedParams: Record<string, string> = { ...(options?.queryParams ?? {}) }
    if (this.#identityToken && !mergedParams.identityToken) {
      mergedParams.identityToken = this.#identityToken
    }

    let url = this.realtimeBaseUri
    const paramKeys = Object.keys(mergedParams)
    if (paramKeys.length > 0) {
      const params = new URLSearchParams()
      paramKeys.forEach((key) => {
        params.append(key, mergedParams[key])
      })
      url += `?${params.toString()}`
    }

    const wsManager = new WebSocketManager({
      url,
      onOpen: () => {
        // Automatically subscribe to in-app messages
        this.subscribeToInAppMessages(wsManager)
        // Re-send tracked chat channel subscriptions (first connect + every reconnect)
        this.resubscribeChatChannels(wsManager)
        // Trigger refetch of all watched queries when WebSocket connects
        setTimeout(() => {
          this.refetchWatchedQueries()
        }, 100)
        options?.onOpen?.()
      },
      onMessage: (event: MessageEvent) => {
        try {
          const message: WebsocketMessageType = JSON.parse(event.data)
          this.handleWebSocketMessage(message)
          options?.onMessage?.(message)
        } catch (error) {
          this.logger.error('Error parsing WebSocket message:', error)
        }
      },
      onClose: (event: CloseEvent) => {
        options?.onClose?.(event)
      },
      onError: (error) => {
        this.logger.error('WebSocket error:', error)
        options?.onError?.(error)
      },
      onReconnect: (attempt) => {
        this.logger.log(`WebSocket reconnecting... attempt ${attempt}`)
        options?.onReconnect?.(attempt)
      },
      onReconnectFailed: () => {
        this.logger.error('WebSocket reconnection failed')
        options?.onReconnectFailed?.()
      },
      shouldReconnect: options?.shouldReconnect ?? ((closeEvent: CloseEvent) => {
        // Don't retry on terminal close codes (auth / permission failures).
        if (isTerminalCloseCode(closeEvent.code)) {
          this.logger.warn(`WebSocket closed with terminal code ${closeEvent.code}, not retrying`)
          return false
        }
        // Retry for everything else (network drops, abnormal 1006, etc.)
        return true
      }),
    })

    this.#activeWebsocketManager = wsManager
    return wsManager
  }

  private subscribeToInAppMessages(wsManager?: WebSocketManager): void {
    const manager = wsManager || this.#websocketManager
    if (!manager) {
      return
    }

    if (!manager.isConnected) {
      return
    }

    const subscribeMessage: WebsocketMessageType = {
      type: WebsocketMessage.SUBSCRIBE,
      data: {
        accountUid: this.#accountUid,
        targetProduct: this.targetProduct,
      },
    }

    manager.send(subscribeMessage)
  }

  private handleWebSocketMessage(_message: WebsocketMessageType): void {
    switch (_message.type) {
      case WebsocketMessage.PING:
        this.logger.log('Ping received')
        break

      case WebsocketMessage.PONG:
        this.logger.log('Pong received')
        break

      case WebsocketMessage.SUBSCRIPTION_SUCCEEDED:
        this.handleChatChannelSubscriptionSucceeded(_message.data.channel)
        break

      case WebsocketMessage.IN_APP_CHAT_MESSAGE:
        this.notifyChatChannelSubscribers(_message.data)
        break

      case WebsocketMessage.IN_APP_MESSAGE:
        // Track that the message was delivered if accountUid is available
        if (this.#accountUid) {
          this.trackMessage({ id: _message.data.id, status: TRACK_MESSAGE_STATUS.DELIVERED })
          // Add to cache for immediate UI update
          this.addInAppMessageToCache(_message.data)
        }
        // Notify all registered callbacks
        this.notifyMessageCallbacks(_message.data)
        break

      default:
        // Message types the SDK doesn't handle internally are forwarded to the
        // consumer via the createWebSocketConnection `onMessage` callback, so
        // there's nothing to do here. Logged at debug level (not `warn`) to
        // avoid noise for application-specific message types.
        this.logger.log('Unhandled WebSocket message type:', _message.type)
    }
  }
}

export default Client
export { WebsocketMessage, isTerminalCloseCode, TERMINAL_CLOSE_CODE_MIN, TERMINAL_CLOSE_CODE_MAX }
export type { ClientParams, InAppMessages, WebsocketMessageType, InAppMessageData, InAppChatMessageData, StartInAppChatConversationArgs, SendInAppChatMessageArgs, FetchInAppChatMessagesArgs, ProductVariantReleaseRule, ProductVariantRelease, AiAgent, AiNotification, AiAgentStarterMessage, AiAgentStarterSuggestion, DashXPushPayload, FirebaseMessaging, SubscribeOptions }
