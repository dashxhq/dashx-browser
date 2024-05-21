import uuid from 'uuid-random'
import { Client as UrqlClient, cacheExchange, fetchExchange } from '@urql/core'

import ContentOptionsBuilder from './ContentOptionsBuilder'
import generateContext from './context'
import { getItem, setItem } from './storage'
import { parseFilterObject } from './utils'
import {
  AddContentDocument,
  AddItemToCartDocument,
  ApplyCouponToCartDocument,
  AssetDocument,
  EditContentDocument,
  FetchCartDocument,
  FetchContactsDocument,
  FetchInAppNotificationsAggregateDocument,
  FetchInAppNotificationsDocument,
  FetchStoredPreferencesDocument,
  IdentifyAccountDocument,
  PrepareAssetDocument,
  RemoveCouponFromCartDocument,
  SaveContactsDocument,
  SaveStoredPreferencesDocument,
  SearchContentDocument,
  TrackEventDocument,
  TrackNotificationDocument,
  TransferCartDocument,
} from './generated'
import type {
  AddContentMutationVariables,
  AddItemToCartMutationVariables,
  ApplyCouponToCartMutationVariables,
  AssetQueryVariables,
  ContactStubInput,
  EditContentMutationVariables,
  FetchCartQueryVariables,
  FetchContactsQueryVariables,
  FetchContentQueryVariables,
  FetchInAppNotificationsAggregateQuery,
  FetchInAppNotificationsAggregateQueryVariables,
  FetchInAppNotificationsQuery,
  FetchInAppNotificationsQueryVariables,
  FetchStoredPreferencesQueryVariables,
  IdentifyAccountMutationVariables,
  PrepareAssetMutationVariables,
  RemoveCouponFromCartMutationVariables,
  SaveContactsMutationVariables,
  SaveStoredPreferencesMutationVariables,
  SearchContentQueryVariables,
  SystemContextInput,
  TrackEventInput,
  TrackEventMutation,
  TrackEventMutationVariables,
  TrackNotificationInput,
  TrackNotificationMutation,
  TrackNotificationMutationVariables,
  TransferCartMutationVariables,
} from './generated'
import type { ContentOptions, FetchContentOptions } from './ContentOptionsBuilder'

const UPLOAD_RETRY_LIMIT = 5
const UPLOAD_RETRY_TIMEOUT = 3000
const UNIDENTIFIED_USER_ERROR = 'This operation can be performed only by an identified user. Ensure `dashx.identify` is run before calling this method.'

type ClientParams = {
  publicKey: string,
  baseUri?: string,
  targetEnvironment?: string,
}

type IdentifyParams = Record<string, any>

type UploadInputType = {
  file: File,
  resource?: string,
  attribute?: string,
}

interface SubscriptionSucceededData {
  channel: string,
}

interface InAppNotificationData {
  body: string,
  notificationId: string,
}

interface SubscribeData {
  accountUid: string,
}

enum WebsocketMessageType {
  SUBSCRIBE = 'SUBSCRIBE',
  SUBSCRIPTION_SUCCEEDED = 'SUBSCRIPTION_SUCCEEDED',
  IN_APP_NOTIFICATION = 'IN_APP_NOTIFICATION',
}

type WebsocketMessage =
  | { type: WebsocketMessageType.SUBSCRIBE, data: SubscribeData }
  | { type: WebsocketMessageType.SUBSCRIPTION_SUCCEEDED, data: SubscriptionSucceededData }
  | { type: WebsocketMessageType.IN_APP_NOTIFICATION, data: InAppNotificationData }

type InAppNotifications = FetchInAppNotificationsQuery['notifications']
type MarkNotificationResponse = TrackNotificationMutation

type OptionalTimestampTrackNotificationInput = Omit<TrackNotificationInput, 'timestamp'> & { timestamp?: Pick<TrackNotificationInput, 'timestamp'> }

class Client {
  #accountAnonymousUid!: string

  #accountUid: string | null = null

  #identityToken: string | null = null

  targetEnvironment?: string

  context: SystemContextInput

  publicKey: string

  baseUri: string

  constructor({ publicKey, baseUri = 'https://api.dashx.com/graphql', targetEnvironment }: ClientParams) {
    this.baseUri = baseUri
    this.publicKey = publicKey
    this.targetEnvironment = targetEnvironment
    this.context = generateContext()
    this.loadIdentity()
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

  private graphqlClient(): UrqlClient {
    return new UrqlClient({
      url: this.baseUri,
      exchanges: [ cacheExchange, fetchExchange ],
      fetchOptions: {
        headers: {
          'X-Public-Key': this.publicKey,
          ...(this.targetEnvironment ? { 'X-Target-Environment': this.targetEnvironment } : {}),
          ...(this.#identityToken ? { 'X-Identity-Token': this.#identityToken } : {}),
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
  identify(uid: string): void
  identify(options: IdentifyParams): Promise<Response>
  identify(options?: string | IdentifyParams): Promise<any> | void {
    if (typeof options === 'string') {
      this.accountUid = options
      return undefined
    }

    this.accountUid = options?.uid as string

    const variables: IdentifyAccountMutationVariables = {
      input: {
        uid: options?.uid,
        anonymousUid: this.#accountAnonymousUid,
        ...options,
      },
    }

    return this.graphqlClient().query(IdentifyAccountDocument, variables)
      .toPromise()
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

  track(event: string, data?: Pick<TrackEventInput, 'data'>): Promise<TrackEventMutation> {
    const variables: TrackEventMutationVariables = {
      input: {
        event,
        data,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
        systemContext: this.context,
      },
    }

    return this.graphqlClient().mutation(TrackEventDocument, variables)
      .toPromise()
      .then((response) => response.data)
      .catch((response) => response.errors)
  }

  trackNotification(
    { timestamp, ...other }: OptionalTimestampTrackNotificationInput,
  ): Promise<TrackNotificationMutation> {
    const variables: TrackNotificationMutationVariables = {
      input: {
        ...other,
        timestamp: timestamp || new Date(),
      },
    }

    return this.graphqlClient().mutation(TrackNotificationDocument, variables)
      .toPromise()
      .then((response) => response.data)
      .catch((response) => response.errors)
  }

  async fetchInAppNotifications(): Promise<FetchInAppNotificationsQuery> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables: FetchInAppNotificationsQueryVariables = {
      input: {
        accountUid: this.#accountUid,
      },
    }

    return this.graphqlClient().query(FetchInAppNotificationsDocument, variables)
      .toPromise()
      .then((response) => response.data)
      .catch((response) => response.errors)
  }

  fetchUnreadInAppNotificationsCount(): Promise<FetchInAppNotificationsAggregateQuery> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables: FetchInAppNotificationsAggregateQueryVariables = {
      input: {
        accountUid: this.#accountUid,
        filter: {
          readAt: 'null',
        },
      },
    }

    return this.graphqlClient().query(FetchInAppNotificationsAggregateDocument, variables)
      .toPromise()
      .then((response) => response.data)
      .catch((response) => response.errors)
  }

  addContent(urn: string, data: Record<string, any>): Promise<Response> {
    let content; let
      contentType

    if (urn.includes('/')) {
      [ contentType, content ] = urn.split('/')
    } else {
      contentType = urn
    }

    const variables: AddContentMutationVariables = {
      input: { content, contentType, data },
    }

    return this.graphqlClient().mutation(AddContentDocument, variables)
      .toPromise()
      .then((response) => response.data)
      .catch((response) => response.errors)
  }

  editContent(urn: string, data: Record<string, any>): Promise<Response> {
    let content; let
      contentType

    if (urn.includes('/')) {
      [ contentType, content ] = urn.split('/')
    } else {
      contentType = urn
    }

    const variables: EditContentMutationVariables = {
      input: { content: content!, contentType, data },
    }

    return this.graphqlClient().mutation(EditContentDocument, variables)
      .toPromise()
      .then((response) => response.data)
      .catch((response) => response.errors)
  }

  searchContent(contentType: string): ContentOptionsBuilder
  searchContent(contentType: string, options: ContentOptions): Promise<any>
  searchContent(
    contentType: string,
    options?: ContentOptions,
  ): ContentOptionsBuilder | Promise<any> {
    if (!options) {
      return new ContentOptionsBuilder(
        (wrappedOptions) => {
          const variables: SearchContentQueryVariables = {
            input: {
              ...wrappedOptions,
              contentType,
            },
          }

          return this.graphqlClient().query(SearchContentDocument, variables)
            .toPromise()
            .then((response) => response.data?.searchContent)
            .catch((response) => response.errors)
        },
      )
    }

    const filter = parseFilterObject(options.filter)
    const variables: SearchContentQueryVariables = {
      input: { ...options, contentType, filter },
    }

    const result = this.graphqlClient().query(SearchContentDocument, variables)
      .toPromise()
      .then((response) => response.data?.searchContent)
      .catch((response) => response.errors)

    if (options.returnType === 'all') {
      return result
    }

    return result.then((data) => (Array.isArray(data) ? data[0] : null))
  }

  async fetchContent(urn: string, options: FetchContentOptions): Promise<any> {
    if (!urn.includes('/')) {
      throw new Error('URN must be of form: {contentType}/{content}')
    }

    const [ contentType, content ] = urn.split('/')
    const variables: FetchContentQueryVariables = {
      input: { content, contentType, ...options },
    }

    const response = await this.graphqlClient().query(FetchContactsDocument, variables).toPromise()
    return response.data?.fetchContent
  }

  async addItemToCart({ custom = {}, ...options }: {
    itemId: string,
    pricingId: string,
    quantity: string,
    reset: boolean,
    custom?: Record<string, any>,
  }): Promise<any> {
    const variables: AddItemToCartMutationVariables = {
      input: {
        custom,
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient().mutation(AddItemToCartDocument, variables)
      .toPromise()
    return response.data?.addItemToCart
  }

  async applyCouponToCart(options: { couponCode: string }): Promise<any> {
    const variables: ApplyCouponToCartMutationVariables = {
      input: {
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient().mutation(ApplyCouponToCartDocument, variables)
      .toPromise()
    return response.data?.applyCouponToCart
  }

  async removeCouponFromCart(options: { couponCode: string }): Promise<any> {
    const variables: RemoveCouponFromCartMutationVariables = {
      input: {
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient().mutation(RemoveCouponFromCartDocument, variables)
      .toPromise()
    return response.data?.removeCouponFromCart
  }

  async fetchCart(options: { orderId?: string }): Promise<any> {
    const variables: FetchCartQueryVariables = {
      input: {
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient().query(FetchCartDocument, variables)
      .toPromise()
    return response.data?.fetchCart
  }

  async transferCart(options: { orderId?: string }): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables: TransferCartMutationVariables = {
      input: {
        ...options,
        accountUid: this.#accountUid,
        accountAnonymousUid: this.#accountAnonymousUid,
      },
    }

    const response = await this.graphqlClient().mutation(TransferCartDocument, variables)
      .toPromise()
    return response.data?.transferCart
  }

  async fetchStoredPreferences(): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables: FetchStoredPreferencesQueryVariables = {
      input: {
        accountUid: this.#accountUid,
      },
    }

    const response = await this.graphqlClient().query(FetchStoredPreferencesDocument, variables)
      .toPromise()
    return response.data?.fetchStoredPreferences.preferenceData
  }

  async saveStoredPreferences(preferenceData: any): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables: SaveStoredPreferencesMutationVariables = {
      input: {
        accountUid: this.#accountUid,
        preferenceData,
      },
    }

    const response = await this.graphqlClient().mutation(SaveStoredPreferencesDocument, variables)
      .toPromise()
    return response?.data.saveStoredPreferences
  }

  async fetchContacts(): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables: FetchContactsQueryVariables = {
      input: { uid: this.#accountUid },
    }

    const response = await this.graphqlClient().query(FetchContactsDocument, variables)
      .toPromise()
    return response?.data?.fetchContacts?.contacts
  }

  async saveContacts(contacts: Pick<ContactStubInput, 'kind' | 'value' | 'tag'>[]): Promise<any> {
    if (!this.#accountUid) {
      throw new Error(UNIDENTIFIED_USER_ERROR)
    }

    const variables: SaveContactsMutationVariables = {
      input: {
        uid: this.#accountUid,
        contacts,
      },
    }

    const response = await this.graphqlClient().mutation(SaveContactsDocument, variables)
      .toPromise()
    return response?.data?.saveContacts
  }

  async upload(options: UploadInputType) {
    const { file, attribute, resource } = options
    const variables: PrepareAssetMutationVariables = {
      input: {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        attribute,
        resource,
        targetEnvironment: this.targetEnvironment,
      },
    }

    const response = await this.graphqlClient().mutation(PrepareAssetDocument, variables)
      .toPromise()

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

    const variables: AssetQueryVariables = { id }
    const response = await this.graphqlClient().query(AssetDocument, variables)
      .toPromise()

    return response?.data?.asset
  }
}

export default Client
export { WebsocketMessageType }
export type { ClientParams, InAppNotifications, MarkNotificationResponse, WebsocketMessage }
