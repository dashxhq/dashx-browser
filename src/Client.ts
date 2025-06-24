import uuid from 'uuid-random'
import { ApolloCache, ApolloClient, ApolloLink, HttpLink, InMemoryCache, NormalizedCacheObject, gql } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

import SearchRecordsInputBuilder, { FetchRecordsOptions, SearchRecordsOptions } from './SearchRecordsInputBuilder'
import generateContext from './context'
import WebSocketManager from './WebSocketManager'
import { getItem, setItem } from './storage'
import {
  AddItemToCartDocument,
  ApplyCouponToCartDocument,
  AssetDocument,
  FetchCartDocument,
  FetchContactsDocument,
  FetchInAppNotificationsAggregateDocument,
  FetchInAppNotificationsDocument,
  FetchRecordDocument,
  FetchStoredPreferencesDocument,
  IdentifyAccountDocument,
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
  SystemContextInput,
  TrackEventInput,
  TrackNotificationInput,
} from './generated'

const UPLOAD_RETRY_LIMIT = 5
const UPLOAD_RETRY_TIMEOUT = 3000
const UNIDENTIFIED_USER_ERROR = 'This operation can be performed only by an identified user. Ensure `dashx.identify` is run before calling this method.'

type ClientParams = {
  baseUri?: string,
  realtimeBaseUri?: string,
  publicKey: string,
  targetEnvironment: string,
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

type SubscribeData = {
  accountUid: string,
}

enum WebsocketMessage {
  SUBSCRIBE = 'SUBSCRIBE',
  SUBSCRIPTION_SUCCEEDED = 'SUBSCRIPTION_SUCCEEDED',
  IN_APP_NOTIFICATION = 'IN_APP_NOTIFICATION',
}

type WebsocketMessageType =
  | { type: WebsocketMessage.SUBSCRIBE, data: SubscribeData }
  | { type: WebsocketMessage.SUBSCRIPTION_SUCCEEDED, data: SubscriptionSucceededData }
  | { type: WebsocketMessage.IN_APP_NOTIFICATION, data: InAppNotificationData }

type OptionalTimestampTrackNotificationInput = Omit<TrackNotificationInput, 'timestamp'> & { timestamp?: Pick<TrackNotificationInput, 'timestamp'> }

class Client {
  #accountAnonymousUid!: string

  #accountUid: string | null = null

  #identityToken: string | null = null

  #websocketManager: WebSocketManager | null = null

  graphqlClient!: ApolloClient<NormalizedCacheObject>

  baseUri: string

  realtimeBaseUri: string

  publicKey: string

  targetEnvironment: string

  context: SystemContextInput

  constructor({
    publicKey,
    baseUri = 'https://api.dashx.com/graphql',
    realtimeBaseUri = 'wss://realtime.dashx.com',
    targetEnvironment,
  }: ClientParams) {
    this.baseUri = baseUri
    this.realtimeBaseUri = realtimeBaseUri
    this.publicKey = publicKey
    this.targetEnvironment = targetEnvironment
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

  identify(): Promise<Response>
  identify(uid: string): Promise<Response>
  identify(options: IdentifyParams): Promise<Response>
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

  watchFetchInAppNotifications(callback: (data: InAppNotifications) => void): void {
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

    observableQuery.subscribe({
      next(response) {
        callback(response.data.notifications)
      },
      error(err) {
        // eslint-disable-next-line no-console
        console.error(err)
        callback([])
      },
    })
  }

  watchFetchInAppNotificationsAggregate(callback: (data: number) => void): void {
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

    observableQuery.subscribe({
      next(response) {
        callback(response.data.notificationsAggregate.count || 0)
      },
      error(err) {
        // eslint-disable-next-line no-console
        console.error(err)
        callback(0)
      },
    })
  }

  searchRecords(resource: string): SearchRecordsInputBuilder
  searchRecords(resource: string, options: SearchRecordsOptions): Promise<any>
  searchRecords(
    resource: string,
    options?: SearchRecordsOptions,
  ): SearchRecordsInputBuilder | Promise<any> {
    if (!options) {
      return new SearchRecordsInputBuilder(
        resource,
        async (wrappedOptions) => {
          const variables = {
            input: {
              ...wrappedOptions,
              resource,
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
      input: { ...options, resource },
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

  // WebSocket methods for real-time functionality
  connectWebSocket(): void {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

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

  // Flexible WebSocket connection method for different frameworks
  createWebSocketConnection(options?: {
    onMessage?: (message: WebsocketMessageType) => void
    onOpen?: () => void
    onClose?: (event: CloseEvent) => void
    onError?: (error: Event) => void
    onReconnect?: (attempt: number) => void
    onReconnectFailed?: () => void
    queryParams?: Record<string, string>
    shouldReconnect?: (closeEvent: CloseEvent) => boolean
  }): WebSocketManager {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    // Build URL with query parameters
    let url = this.realtimeBaseUri
    if (options?.queryParams) {
      const params = new URLSearchParams()
      Object.entries(options.queryParams).forEach(([key, value]) => {
        params.append(key, value)
      })
      url += `?${params.toString()}`
    }

    const wsManager = new WebSocketManager({
      url,
      onOpen: () => {
        // Automatically subscribe to notifications
        this.subscribeToNotifications(wsManager)
        options?.onOpen?.()
      },
      onMessage: (event: MessageEvent) => {
        try {
          const message: WebsocketMessageType = JSON.parse(event.data)
          this.handleWebSocketMessage(message)
          options?.onMessage?.(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      },
      onClose: (event: CloseEvent) => {
        options?.onClose?.(event)
      },
      onError: (error) => {
        console.error('WebSocket error:', error)
        options?.onError?.(error)
      },
      onReconnect: (attempt) => {
        console.log(`WebSocket reconnecting... attempt ${attempt}`)
        options?.onReconnect?.(attempt)
      },
      onReconnectFailed: () => {
        console.error('WebSocket reconnection failed')
        options?.onReconnectFailed?.()
      },
      shouldReconnect: options?.shouldReconnect,
    })

    return wsManager
  }

  private subscribeToNotifications(wsManager?: WebSocketManager): void {
    const manager = wsManager || this.#websocketManager
    if (!manager || !this.#accountUid) return

    const subscribeMessage: WebsocketMessageType = {
      type: WebsocketMessage.SUBSCRIBE,
      data: {
        accountUid: this.#accountUid,
      },
    }

    manager.send(subscribeMessage)
  }

  private handleWebSocketMessage(message: WebsocketMessageType): void {
    switch (message.type) {
      case WebsocketMessage.SUBSCRIPTION_SUCCEEDED:
        console.log('Successfully subscribed to notifications')
        break

      case WebsocketMessage.IN_APP_NOTIFICATION:
        this.addInAppNotificationToCache(message.data)
        break

      default:
        console.warn('Unknown WebSocket message type:', message.type)
    }
  }
}

export default Client
export { WebsocketMessage }
export type { ClientParams, InAppNotifications, WebsocketMessageType }
