import uuid from 'uuid-random'
import { ApolloCache, ApolloClient, ApolloLink, HttpLink, InMemoryCache, NormalizedCacheObject, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

import SearchRecordsInputBuilder, { FetchRecordsOptions, SearchRecordsOptions } from './SearchRecordsInputBuilder'
import generateContext from './context'
import WebSocketManager from './WebSocketManager'
import { createLogger } from './logging'
import { getItem, setItem } from './storage'
import {
  AddItemToCartDocument,
  ApplyCouponToCartDocument,
  AssetDocument,
  ConversationFragmentFragment,
  FetchCartDocument,
  FetchContactsDocument,
  FetchInAppNotificationsAggregateDocument,
  FetchInAppNotificationsDocument,
  FetchProductVariantReleaseDocument,
  FetchProductVariantReleaseRuleDocument,
  FetchRecordDocument,
  FetchStoredPreferencesDocument,
  IdentifyAccountDocument,
  InvokeAiAgentDocument,
  LoadAiAgentDocument,
  NotificationFragmentFragment,
  PrepareAssetDocument,
  RemoveCouponFromCartDocument,
  SaveContactsDocument,
  SaveStoredPreferencesDocument,
  SearchRecordsDocument,
  TrackEventDocument,
  TrackNotificationDocument,
  TransferCartDocument,
} from './generated'
import type {
  ContactStubInput,
  FetchInAppNotificationsQuery,
  FetchProductVariantReleaseQuery,
  FetchProductVariantReleaseRuleQuery,
  InvokeAiAgentInput,
  InvokeAiAgentQuery,
  LoadAiAgentInput,
  LoadAiAgentQuery,
  SystemContextInput,
  TrackEventInput,
  TrackNotificationInput,
} from './generated'

const UPLOAD_RETRY_LIMIT = 5
const UPLOAD_RETRY_TIMEOUT = 3000
const UNIDENTIFIED_USER_ERROR = 'This operation can be performed only by an identified user. Ensure `dashx.identify` is run before calling this method.'

// DashX WebSocket close codes
const DASHX_CLOSE_CODES = [
  40000, // Bad request
  40001, // Invalid Data
  50000  // Internal server error
] as const

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

type InAppNotifications = FetchInAppNotificationsQuery['notifications']

type InAppNotificationData = Pick<FetchInAppNotificationsQuery['notifications'][0], 'id' | 'readAt' | 'renderedContent' | 'sentAt'>

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
  SUBSCRIPTION_SUCCEEDED = 'SUBSCRIPTION_SUCCEEDED',
  IN_APP_NOTIFICATION = 'IN_APP_NOTIFICATION',
  PRODUCT_VARIANT_RELEASE_RULE_UPDATED = 'PRODUCT_VARIANT_RELEASE_RULE_UPDATED',
  PLANNER_INBOX_CONVERSATION_CREATED = 'PLANNER_INBOX_CONVERSATION_CREATED',
  PLANNER_INBOX_MESSAGE_RECEIVED = 'PLANNER_INBOX_MESSAGE_RECEIVED'
}
/* eslint-enable no-unused-vars */

type WebsocketMessageType =
  | { type: WebsocketMessage.PING }
  | { type: WebsocketMessage.PONG }
  | { type: WebsocketMessage.CONNECTED, data: ConnectionData }
  | { type: WebsocketMessage.SUBSCRIBE, data: SubscribeData }
  | { type: WebsocketMessage.SUBSCRIPTION_SUCCEEDED, data: SubscriptionSucceededData }
  | { type: WebsocketMessage.IN_APP_NOTIFICATION, data: InAppNotificationData }
  | { type: WebsocketMessage.PRODUCT_VARIANT_RELEASE_RULE_UPDATED, data: ProductVariantReleaseRule }
  | { type: WebsocketMessage.PLANNER_INBOX_CONVERSATION_CREATED, data: ConversationFragmentFragment }
  | { type: WebsocketMessage.PLANNER_INBOX_MESSAGE_RECEIVED, data: NotificationFragmentFragment }

type OptionalTimestampTrackNotificationInput = Omit<TrackNotificationInput, 'timestamp'> & { timestamp?: Pick<TrackNotificationInput, 'timestamp'> }

class Client {
  #accountAnonymousUid!: string

  #accountUid: string | null = null

  #identityToken: string | null = null

  #websocketManager: WebSocketManager | null = null

  #notificationCallbacks: Set<(_notification: InAppNotificationData) => void> = new Set()

  #watchedQueries: Set<{ refetch: () => void; name: string }> = new Set()

  graphqlClient!: ApolloClient<NormalizedCacheObject>

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
    baseUri = 'https://api.dashx.com/graphql',
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

    // If WebSocket is connected and we just set an accountUid, subscribe to notifications
    if (this.#accountUid && this.#websocketManager?.isConnected) {
      this.subscribeToNotifications()
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
      connectToDevTools: true,
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
      .catch((response) => response.errors)
  }

  setIdentity(uid: string, token: string): void {
    this.accountUid = uid
    this.identityToken = token
  }

  setAnonymousIdentity(uid: string): void {
    this.accountAnonymousUid = uid
  }

  reset(): void {
    this.accountAnonymousUid = uuid()
    this.accountUid = null
    this.identityToken = null
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

  trackNotification({ id, status, timestamp }: OptionalTimestampTrackNotificationInput) {
    const variables = {
      input: {
        id,
        status,
        timestamp: timestamp || new Date(),
      },
    }

    let update
    if (status === 'READ' || status === 'UNREAD') {
      if (!this.#accountUid) {
        throw new Error(UNIDENTIFIED_USER_ERROR)
      }

      update = (cache: ApolloCache<InMemoryCache>) => {
        cache.writeFragment({
          data: {
            id,
            readAt: status === 'UNREAD' ? null : new Date(),
            __typename: 'Notification',
          },
          fragment: gql`
            fragment UpdateNotification on Notification {
              id
              readAt
            }
          `,
        })

        const fetchInAppNotificationsAggregateVariables = {
          input: {
            accountUid: this.#accountUid!,
            filter: {
              readAt: 'null',
            },
          },
        }

        const unreadNotificationsAggregate = cache.readQuery({
          query: FetchInAppNotificationsAggregateDocument,
          variables: fetchInAppNotificationsAggregateVariables,
        })

        let counter = 0
        if (status === 'READ') {
          counter = -1
        } else if (status === 'UNREAD') {
          counter = 1
        }

        cache.writeQuery({
          query: FetchInAppNotificationsAggregateDocument,
          data: {
            notificationsAggregate: {
              __typename: 'FetchInAppNotificationsAggregateResponse',
              count: (unreadNotificationsAggregate?.notificationsAggregate.count || 0) + counter,
            },
          },
          variables: fetchInAppNotificationsAggregateVariables,
        })
      }
    }

    return this.graphqlClient.mutate({
      mutation: TrackNotificationDocument,
      variables,
      update,
    })
  }

  fetchInAppNotifications() {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const fetchInAppNotificationsVariables = {
      input: {
        accountUid: this.#accountUid,
      },
    }
    this.graphqlClient.query({
      query: FetchInAppNotificationsDocument,
      variables: fetchInAppNotificationsVariables,
    })

    const fetchInAppNotificationsAggregateVariables = {
      input: {
        ...fetchInAppNotificationsVariables.input,
        filter: {
          readAt: 'null',
        },
      },
    }
    this.graphqlClient.query({
      query: FetchInAppNotificationsAggregateDocument,
      variables: fetchInAppNotificationsAggregateVariables,
    })
  }

  addInAppNotificationToCache(notification: InAppNotificationData): void {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const fetchInAppNotificationsVariables = {
      input: {
        accountUid: this.#accountUid,
      },
    }

    const existingNotifications = this.graphqlClient.readQuery({
      query: FetchInAppNotificationsDocument,
      variables: fetchInAppNotificationsVariables,
    })

    this.graphqlClient.writeQuery({
      query: FetchInAppNotificationsDocument,
      data: {
        notifications: [
          { ...notification, __typename: 'Notification' },
          ...existingNotifications?.notifications || [],
        ],
      },
      variables: fetchInAppNotificationsVariables,
    })

    const fetchInAppNotificationsAggregateVariables = {
      input: {
        ...fetchInAppNotificationsVariables.input,
        filter: {
          readAt: 'null',
        },
      },
    }

    const unreadNotificationsAggregate = this.graphqlClient.readQuery({
      query: FetchInAppNotificationsAggregateDocument,
      variables: fetchInAppNotificationsAggregateVariables,
    })

    this.graphqlClient.writeQuery({
      query: FetchInAppNotificationsAggregateDocument,
      data: {
        notificationsAggregate: {
          __typename: 'FetchInAppNotificationsAggregateResponse',
          count: (unreadNotificationsAggregate?.notificationsAggregate.count || 0) + 1,
        },
      },
      variables: fetchInAppNotificationsAggregateVariables,
    })
  }

  watchFetchInAppNotifications(callback: (_data: InAppNotifications) => void): void {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables = {
      input: {
        accountUid: this.#accountUid,
      },
    }

    const observableQuery = this.graphqlClient.watchQuery({
      query: FetchInAppNotificationsDocument,
      variables,
    })

    // Register this query for automatic refetch on WebSocket reconnection
    this.registerWatchedQuery(() => {
      observableQuery.refetch()
    }, 'watchFetchInAppNotifications')

    observableQuery.subscribe({
      next(_response) {
        callback(_response.data?.notifications)
      },
      error: (_err) => {
        this.logger.error(_err)
        callback([])
      },
    })
  }

  watchFetchInAppNotificationsAggregate(callback: (_data: number) => void): void {
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
      query: FetchInAppNotificationsAggregateDocument,
      variables,
    })

    // Register this query for automatic refetch on WebSocket reconnection
    this.registerWatchedQuery(() => {
      observableQuery.refetch()
    }, 'watchFetchInAppNotificationsAggregate')

    observableQuery.subscribe({
      next(_response) {
        callback(_response.data?.notificationsAggregate.count || 0)
      },
      error: (_err) => {
        this.logger.error(_err)
        callback(0)
      },
    })
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

    return response?.data?.productVariantRelease
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

    if (response?.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message || 'Failed to load AI agent')
    }

    return response?.data?.loadAiAgent
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

    if (response?.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message || 'Failed to invoke AI agent')
    }

    return response?.data?.invokeAiAgent
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

    return response?.data?.productVariantReleaseRule
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
      next(_response) {
        callback(_response.data?.productVariantReleaseRule)
      },
      error: (_err) => {
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

  // Notification callback management
  onNotification(callback: (_notification: InAppNotificationData) => void): () => void {
    this.#notificationCallbacks.add(callback)

    // Return unsubscribe function
    return () => {
      this.#notificationCallbacks.delete(callback)
    }
  }

  private notifyCallbacks(notification: InAppNotificationData): void {
    this.#notificationCallbacks.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        this.logger.error('Error in notification callback:', error)
      }
    })
  }

  // Flexible WebSocket connection method for different frameworks
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
    // Build URL with query parameters
    let url = this.realtimeBaseUri
    if (options?.queryParams) {
      const params = new URLSearchParams()
      Object.entries(options.queryParams).forEach(([ key, value ]) => {
        params.append(key, value)
      })
      url += `?${params.toString()}`
    }

    const wsManager = new WebSocketManager({
      url,
      onOpen: () => {
        // Automatically subscribe to notifications
        this.subscribeToNotifications(wsManager)
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
        // Don't retry on DashX-specific error codes
        if (DASHX_CLOSE_CODES.includes(closeEvent.code as any)) {
          this.logger.warn(`WebSocket closed with DashX error code ${closeEvent.code}, not retrying`)
          return false
        }
        // Retry for other close codes (network issues, etc.)
        return true
      }),
    })

    return wsManager
  }

  private subscribeToNotifications(wsManager?: WebSocketManager): void {
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
        this.logger.log('Successfully subscribed to notifications')
        break

      case WebsocketMessage.IN_APP_NOTIFICATION:
        // Track that the notification was delivered if accountUid is available
        if (this.#accountUid) {
          this.trackNotification({ id: _message.data.id, status: 'DELIVERED' })
          // Add to cache for immediate UI update
          this.addInAppNotificationToCache(_message.data)
        }
        // Notify all registered callbacks
        this.notifyCallbacks(_message.data)
        break

      case WebsocketMessage.PLANNER_INBOX_CONVERSATION_CREATED:
      case WebsocketMessage.PRODUCT_VARIANT_RELEASE_RULE_UPDATED:
        break

      default:
        this.logger.warn('Unknown WebSocket message type:', _message.type)
    }
  }
}

export default Client
export { WebsocketMessage, DASHX_CLOSE_CODES }
export type { ClientParams, InAppNotifications, WebsocketMessageType, InAppNotificationData, ProductVariantReleaseRule, ProductVariantRelease, AiAgent, AiNotification, AiAgentStarterMessage, AiAgentStarterSuggestion }
