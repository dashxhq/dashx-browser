/* eslint-disable max-len */
import gql from 'graphql-tag'

export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never }
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string, output: string },
  String: { input: string, output: string },
  Boolean: { input: boolean, output: boolean },
  Int: { input: number, output: number },
  Float: { input: number, output: number },
  Decimal: { input: any, output: any },
  JSON: { input: any, output: any },
  NaiveDate: { input: any, output: any },
  Timestamp: { input: any, output: any },
  UUID: { input: any, output: any },
  Upload: { input: any, output: any },
}

export type AddContentInput = {
  content?: InputMaybe<Scalars['String']['input']>,
  contentType: Scalars['String']['input'],
  data: Scalars['JSON']['input'],
}

export type AddItemToCartInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>,
  accountUid?: InputMaybe<Scalars['String']['input']>,
  custom?: InputMaybe<Scalars['JSON']['input']>,
  itemId: Scalars['UUID']['input'],
  pricingId: Scalars['UUID']['input'],
  quantity: Scalars['Decimal']['input'],
  reset: Scalars['Boolean']['input'],
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export type ApplyCouponToCartInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>,
  accountUid?: InputMaybe<Scalars['String']['input']>,
  couponCode: Scalars['String']['input'],
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export enum AssetProcessingStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
}

export enum AssetUploadStatus {
  Canceled = 'CANCELED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  TimedOut = 'TIMED_OUT',
  Uploaded = 'UPLOADED',
}

export enum ContactKind {
  Android = 'ANDROID',
  Email = 'EMAIL',
  Ios = 'IOS',
  Phone = 'PHONE',
  Web = 'WEB',
  Whatsapp = 'WHATSAPP',
}

export enum ContactStatus {
  Blacklisted = 'BLACKLISTED',
  NotSubscribed = 'NOT_SUBSCRIBED',
  Revoked = 'REVOKED',
  Subscribed = 'SUBSCRIBED',
  Unsubscribed = 'UNSUBSCRIBED',
}

export type ContactStubInput = {
  kind: ContactKind,
  shouldDestroy?: InputMaybe<Scalars['Boolean']['input']>,
  status?: InputMaybe<ContactStatus>,
  tag?: InputMaybe<Scalars['String']['input']>,
  value: Scalars['String']['input'],
}

export enum CouponDiscountType {
  Fixed = 'FIXED',
  Percentage = 'PERCENTAGE',
}

export type EditContentInput = {
  content: Scalars['String']['input'],
  contentType: Scalars['String']['input'],
  data: Scalars['JSON']['input'],
}

export type FetchCartInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>,
  accountUid?: InputMaybe<Scalars['String']['input']>,
  orderId?: InputMaybe<Scalars['UUID']['input']>,
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export type FetchContactsInput = {
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
  uid: Scalars['String']['input'],
}

export type FetchContentInput = {
  content?: InputMaybe<Scalars['String']['input']>,
  contentId?: InputMaybe<Scalars['UUID']['input']>,
  contentType?: InputMaybe<Scalars['String']['input']>,
  exclude?: InputMaybe<Array<Scalars['String']['input']>>,
  fields?: InputMaybe<Array<Scalars['String']['input']>>,
  include?: InputMaybe<Array<Scalars['String']['input']>>,
  language?: InputMaybe<Scalars['String']['input']>,
  preview?: InputMaybe<Scalars['Boolean']['input']>,
}

export type FetchInAppNotificationsAggregateInput = {
  accountUid: Scalars['String']['input'],
  filter?: InputMaybe<Scalars['JSON']['input']>,
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export type FetchInAppNotificationsInput = {
  accountUid: Scalars['String']['input'],
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export type FetchStoredPreferencesInput = {
  accountUid: Scalars['String']['input'],
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export type IdentifyAccountInput = {
  anonymousUid?: InputMaybe<Scalars['String']['input']>,
  email?: InputMaybe<Scalars['String']['input']>,
  firstName?: InputMaybe<Scalars['String']['input']>,
  lastName?: InputMaybe<Scalars['String']['input']>,
  name?: InputMaybe<Scalars['String']['input']>,
  phone?: InputMaybe<Scalars['String']['input']>,
  systemContext?: InputMaybe<SystemContextInput>,
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
  uid?: InputMaybe<Scalars['String']['input']>,
}

export enum OrderStatus {
  Canceled = 'CANCELED',
  CheckedOut = 'CHECKED_OUT',
  Draft = 'DRAFT',
  Initial = 'INITIAL',
  Paid = 'PAID',
}

export type PrepareAssetInput = {
  attribute?: InputMaybe<Scalars['String']['input']>,
  mimeType: Scalars['String']['input'],
  name: Scalars['String']['input'],
  resource?: InputMaybe<Scalars['String']['input']>,
  size: Scalars['Int']['input'],
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export enum PricingKind {
  InApp = 'IN_APP',
  Regular = 'REGULAR',
}

export enum PricingRecurringIntervalUnit {
  Day = 'DAY',
  Month = 'MONTH',
  Week = 'WEEK',
  Year = 'YEAR',
}

export type RemoveCouponFromCartInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>,
  accountUid?: InputMaybe<Scalars['String']['input']>,
  couponCode: Scalars['String']['input'],
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export type SaveContactsInput = {
  contacts: Array<ContactStubInput>,
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
  uid: Scalars['String']['input'],
}

export type SaveStoredPreferencesInput = {
  accountUid: Scalars['String']['input'],
  preferenceData: Scalars['JSON']['input'],
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export type SearchContentInput = {
  contentType: Scalars['String']['input'],
  exclude?: InputMaybe<Array<Scalars['String']['input']>>,
  fields?: InputMaybe<Array<Scalars['String']['input']>>,
  filter?: InputMaybe<Scalars['JSON']['input']>,
  include?: InputMaybe<Array<Scalars['String']['input']>>,
  language?: InputMaybe<Scalars['String']['input']>,
  limit?: InputMaybe<Scalars['Int']['input']>,
  order?: InputMaybe<Scalars['JSON']['input']>,
  preview?: InputMaybe<Scalars['Boolean']['input']>,
  returnType: Scalars['String']['input'],
}

export type SystemContextAppInput = {
  build: Scalars['String']['input'],
  name: Scalars['String']['input'],
  namespace: Scalars['String']['input'],
  version: Scalars['String']['input'],
}

export type SystemContextCampaignInput = {
  content: Scalars['String']['input'],
  medium: Scalars['String']['input'],
  name: Scalars['String']['input'],
  source: Scalars['String']['input'],
  term: Scalars['String']['input'],
}

export type SystemContextDeviceInput = {
  adTrackingEnabled: Scalars['Boolean']['input'],
  advertisingId: Scalars['String']['input'],
  id: Scalars['String']['input'],
  kind: Scalars['String']['input'],
  manufacturer: Scalars['String']['input'],
  model: Scalars['String']['input'],
  name: Scalars['String']['input'],
}

export type SystemContextInput = {
  app?: InputMaybe<SystemContextAppInput>,
  campaign?: InputMaybe<SystemContextCampaignInput>,
  device?: InputMaybe<SystemContextDeviceInput>,
  ipV4: Scalars['String']['input'],
  ipV6?: InputMaybe<Scalars['String']['input']>,
  library?: InputMaybe<SystemContextLibraryInput>,
  locale: Scalars['String']['input'],
  location?: InputMaybe<SystemContextLocationInput>,
  network?: InputMaybe<SystemContextNetworkInput>,
  os?: InputMaybe<SystemContextOsInput>,
  screen?: InputMaybe<SystemContextScreenInput>,
  timeZone: Scalars['String']['input'],
  userAgent: Scalars['String']['input'],
}

export type SystemContextLibraryInput = {
  name: Scalars['String']['input'],
  version: Scalars['String']['input'],
}

export type SystemContextLocationInput = {
  city?: InputMaybe<Scalars['String']['input']>,
  country?: InputMaybe<Scalars['String']['input']>,
  latitude?: InputMaybe<Scalars['Decimal']['input']>,
  longitude?: InputMaybe<Scalars['Decimal']['input']>,
  speed?: InputMaybe<Scalars['Decimal']['input']>,
}

export type SystemContextNetworkInput = {
  bluetooth: Scalars['Boolean']['input'],
  carrier: Scalars['String']['input'],
  cellular: Scalars['Boolean']['input'],
  wifi: Scalars['Boolean']['input'],
}

export type SystemContextOsInput = {
  name: Scalars['String']['input'],
  version: Scalars['String']['input'],
}

export type SystemContextScreenInput = {
  density: Scalars['Int']['input'],
  height: Scalars['Int']['input'],
  width: Scalars['Int']['input'],
}

export type TrackEventInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>,
  accountUid?: InputMaybe<Scalars['String']['input']>,
  data?: InputMaybe<Scalars['JSON']['input']>,
  event: Scalars['String']['input'],
  systemContext?: InputMaybe<SystemContextInput>,
  timestamp?: InputMaybe<Scalars['Timestamp']['input']>,
}

export type TrackNotificationInput = {
  id: Scalars['UUID']['input'],
  status: TrackNotificationStatus,
  timestamp: Scalars['Timestamp']['input'],
}

export enum TrackNotificationStatus {
  Clicked = 'CLICKED',
  Delivered = 'DELIVERED',
  Dismissed = 'DISMISSED',
  Opened = 'OPENED',
  Read = 'READ',
  Unread = 'UNREAD',
}

export type TransferCartInput = {
  accountAnonymousUid: Scalars['String']['input'],
  accountUid: Scalars['String']['input'],
  orderId?: InputMaybe<Scalars['UUID']['input']>,
  targetEnvironment?: InputMaybe<Scalars['String']['input']>,
}

export type AddContentMutationVariables = Exact<{
  input: AddContentInput,
}>

export type AddContentMutation = { __typename?: 'Mutation', addContent: { __typename?: 'CustomContent', id: any, identifier: string, position: number, data: any, createdAt: any, updatedAt: any } }

export type AddItemToCartMutationVariables = Exact<{
  input: AddItemToCartInput,
}>

export type AddItemToCartMutation = { __typename?: 'Mutation', addItemToCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } }

export type ApplyCouponToCartMutationVariables = Exact<{
  input: ApplyCouponToCartInput,
}>

export type ApplyCouponToCartMutation = { __typename?: 'Mutation', applyCouponToCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } }

export type AssetQueryVariables = Exact<{
  id: Scalars['UUID']['input'],
}>

export type AssetQuery = { __typename?: 'Query', asset: { __typename?: 'Asset', attributeId?: any | null, createdAt: any, data: any, id: any, mimeType?: string | null, name?: string | null, processingStatus: AssetProcessingStatus, resourceId?: any | null, size?: number | null, storageProviderId?: any | null, updatedAt: any, uploadStatus: AssetUploadStatus, uploaderId?: any | null, url?: string | null, workspaceId: any } }

export type AssetFragmentFragment = { __typename?: 'Asset', attributeId?: any | null, createdAt: any, data: any, id: any, mimeType?: string | null, name?: string | null, processingStatus: AssetProcessingStatus, resourceId?: any | null, size?: number | null, storageProviderId?: any | null, updatedAt: any, uploadStatus: AssetUploadStatus, uploaderId?: any | null, url?: string | null, workspaceId: any }

export type CartFragmentFragment = { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> }

export type ContactFragmentFragment = { __typename?: 'Contact', id: any, accountId: any, name?: string | null, kind: ContactKind, value: string, unverifiedValue?: string | null, verifiedAt?: any | null, status: ContactStatus, tag?: string | null, createdAt: any, updatedAt: any }

export type ContentFragmentFragment = { __typename?: 'CustomContent', id: any, identifier: string, position: number, data: any, createdAt: any, updatedAt: any }

export type EditContentMutationVariables = Exact<{
  input: EditContentInput,
}>

export type EditContentMutation = { __typename?: 'Mutation', editContent: { __typename?: 'CustomContent', id: any, identifier: string, position: number, data: any, createdAt: any, updatedAt: any } }

export type FetchCartQueryVariables = Exact<{
  input: FetchCartInput,
}>

export type FetchCartQuery = { __typename?: 'Query', fetchCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } }

export type FetchContactsQueryVariables = Exact<{
  input: FetchContactsInput,
}>

export type FetchContactsQuery = { __typename?: 'Query', fetchContacts: { __typename?: 'FetchContactsResponse', contacts: Array<{ __typename?: 'Contact', id: any, accountId: any, name?: string | null, kind: ContactKind, value: string, unverifiedValue?: string | null, verifiedAt?: any | null, status: ContactStatus, tag?: string | null, createdAt: any, updatedAt: any }> } }

export type FetchContentQueryVariables = Exact<{
  input: FetchContentInput,
}>

export type FetchContentQuery = { __typename?: 'Query', fetchContent: any }

export type FetchInAppNotificationsQueryVariables = Exact<{
  input: FetchInAppNotificationsInput,
}>

export type FetchInAppNotificationsQuery = { __typename?: 'Query', notifications: Array<{ __typename?: 'Notification', id: any, sentAt?: any | null, readAt?: any | null, renderedContent: any }> }

export type FetchInAppNotificationsAggregateQueryVariables = Exact<{
  input: FetchInAppNotificationsAggregateInput,
}>

export type FetchInAppNotificationsAggregateQuery = { __typename?: 'Query', notificationsAggregate: { __typename?: 'FetchInAppNotificationsAggregateResponse', count?: number | null } }

export type FetchStoredPreferencesQueryVariables = Exact<{
  input: FetchStoredPreferencesInput,
}>

export type FetchStoredPreferencesQuery = { __typename?: 'Query', fetchStoredPreferences: { __typename?: 'FetchStoredPreferencesResponse', preferenceData: any } }

export type IdentifyAccountMutationVariables = Exact<{
  input: IdentifyAccountInput,
}>

export type IdentifyAccountMutation = { __typename?: 'Mutation', identifyAccount: { __typename?: 'Account', id: any } }

export type ItemFragmentFragment = { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> }

export type PrepareAssetMutationVariables = Exact<{
  input: PrepareAssetInput,
}>

export type PrepareAssetMutation = { __typename?: 'Mutation', prepareAsset: { __typename?: 'Asset', attributeId?: any | null, createdAt: any, data: any, id: any, mimeType?: string | null, name?: string | null, processingStatus: AssetProcessingStatus, resourceId?: any | null, size?: number | null, storageProviderId?: any | null, updatedAt: any, uploadStatus: AssetUploadStatus, uploaderId?: any | null, url?: string | null, workspaceId: any } }

export type RemoveCouponFromCartMutationVariables = Exact<{
  input: RemoveCouponFromCartInput,
}>

export type RemoveCouponFromCartMutation = { __typename?: 'Mutation', removeCouponFromCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } }

export type SaveContactsMutationVariables = Exact<{
  input: SaveContactsInput,
}>

export type SaveContactsMutation = { __typename?: 'Mutation', saveContacts: { __typename?: 'SaveContactsResponse', contacts: Array<{ __typename?: 'Contact', id: any, accountId: any, name?: string | null, kind: ContactKind, value: string, unverifiedValue?: string | null, verifiedAt?: any | null, status: ContactStatus, tag?: string | null, createdAt: any, updatedAt: any }> } }

export type SaveStoredPreferencesMutationVariables = Exact<{
  input: SaveStoredPreferencesInput,
}>

export type SaveStoredPreferencesMutation = { __typename?: 'Mutation', saveStoredPreferences: { __typename?: 'SaveStoredPreferencesResponse', success: boolean } }

export type SearchContentQueryVariables = Exact<{
  input: SearchContentInput,
}>

export type SearchContentQuery = { __typename?: 'Query', searchContent: Array<any> }

export type TrackEventMutationVariables = Exact<{
  input: TrackEventInput,
}>

export type TrackEventMutation = { __typename?: 'Mutation', trackEvent: { __typename?: 'TrackEventResponse', success: boolean } }

export type TrackNotificationMutationVariables = Exact<{
  input: TrackNotificationInput,
}>

export type TrackNotificationMutation = { __typename?: 'Mutation', trackNotification: { __typename?: 'TrackNotificationResponse', success: boolean } }

export type TransferCartMutationVariables = Exact<{
  input: TransferCartInput,
}>

export type TransferCartMutation = { __typename?: 'Mutation', transferCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } }

export const AssetFragmentFragmentDoc = gql`
    fragment AssetFragment on Asset {
  attributeId
  createdAt
  data
  id
  mimeType
  name
  processingStatus
  resourceId
  size
  storageProviderId
  updatedAt
  uploadStatus
  uploaderId
  url
  workspaceId
}
    `
export const ItemFragmentFragmentDoc = gql`
    fragment ItemFragment on Item {
  id
  name
  identifier
  description
  createdAt
  updatedAt
  pricings {
    id
    kind
    amount
    originalAmount
    isRecurring
    recurringInterval
    recurringIntervalUnit
    appleProductIdentifier
    googleProductIdentifier
    currencyCode
    createdAt
    updatedAt
  }
}
    `
export const CartFragmentFragmentDoc = gql`
    fragment CartFragment on Order {
  id
  status
  subtotal
  discount
  tax
  total
  gatewayMeta
  currencyCode
  orderItems {
    id
    quantity
    unitPrice
    subtotal
    discount
    tax
    total
    custom
    currencyCode
    item {
      ...ItemFragment
    }
  }
  couponRedemptions {
    coupon {
      name
      identifier
      discountType
      discountAmount
      currencyCode
      expiresAt
    }
  }
}
    ${ItemFragmentFragmentDoc}`
export const ContactFragmentFragmentDoc = gql`
    fragment ContactFragment on Contact {
  id
  accountId
  name
  kind
  value
  unverifiedValue
  verifiedAt
  status
  tag
  createdAt
  updatedAt
}
    `
export const ContentFragmentFragmentDoc = gql`
    fragment ContentFragment on CustomContent {
  id
  identifier
  position
  data
  createdAt
  updatedAt
}
    `
export const AddContentDocument = gql`
    mutation AddContent($input: AddContentInput!) {
  addContent(input: $input) {
    ...ContentFragment
  }
}
    ${ContentFragmentFragmentDoc}`
export const AddItemToCartDocument = gql`
    mutation AddItemToCart($input: AddItemToCartInput!) {
  addItemToCart(input: $input) {
    ...CartFragment
  }
}
    ${CartFragmentFragmentDoc}`
export const ApplyCouponToCartDocument = gql`
    mutation ApplyCouponToCart($input: ApplyCouponToCartInput!) {
  applyCouponToCart(input: $input) {
    ...CartFragment
  }
}
    ${CartFragmentFragmentDoc}`
export const AssetDocument = gql`
    query Asset($id: UUID!) {
  asset(id: $id) {
    ...AssetFragment
  }
}
    ${AssetFragmentFragmentDoc}`
export const EditContentDocument = gql`
    mutation EditContent($input: EditContentInput!) {
  editContent(input: $input) {
    ...ContentFragment
  }
}
    ${ContentFragmentFragmentDoc}`
export const FetchCartDocument = gql`
    query FetchCart($input: FetchCartInput!) {
  fetchCart(input: $input) {
    ...CartFragment
  }
}
    ${CartFragmentFragmentDoc}`
export const FetchContactsDocument = gql`
    query FetchContacts($input: FetchContactsInput!) {
  fetchContacts(input: $input) {
    contacts {
      ...ContactFragment
    }
  }
}
    ${ContactFragmentFragmentDoc}`
export const FetchContentDocument = gql`
    query FetchContent($input: FetchContentInput!) {
  fetchContent(input: $input)
}
    `
export const FetchInAppNotificationsDocument = gql`
    query FetchInAppNotifications($input: FetchInAppNotificationsInput!) {
  notifications: fetchInAppNotifications(input: $input) {
    id
    sentAt
    readAt
    renderedContent
  }
}
    `
export const FetchInAppNotificationsAggregateDocument = gql`
    query FetchInAppNotificationsAggregate($input: FetchInAppNotificationsAggregateInput!) {
  notificationsAggregate: fetchInAppNotificationsAggregate(input: $input) {
    count
  }
}
    `
export const FetchStoredPreferencesDocument = gql`
    query FetchStoredPreferences($input: FetchStoredPreferencesInput!) {
  fetchStoredPreferences(input: $input) {
    preferenceData
  }
}
    `
export const IdentifyAccountDocument = gql`
    mutation IdentifyAccount($input: IdentifyAccountInput!) {
  identifyAccount(input: $input) {
    id
  }
}
    `
export const PrepareAssetDocument = gql`
    mutation prepareAsset($input: PrepareAssetInput!) {
  prepareAsset(input: $input) {
    ...AssetFragment
  }
}
    ${AssetFragmentFragmentDoc}`
export const RemoveCouponFromCartDocument = gql`
    mutation RemoveCouponFromCart($input: RemoveCouponFromCartInput!) {
  removeCouponFromCart(input: $input) {
    ...CartFragment
  }
}
    ${CartFragmentFragmentDoc}`
export const SaveContactsDocument = gql`
    mutation SaveContacts($input: SaveContactsInput!) {
  saveContacts(input: $input) {
    contacts {
      ...ContactFragment
    }
  }
}
    ${ContactFragmentFragmentDoc}`
export const SaveStoredPreferencesDocument = gql`
    mutation SaveStoredPreferences($input: SaveStoredPreferencesInput!) {
  saveStoredPreferences(input: $input) {
    success
  }
}
    `
export const SearchContentDocument = gql`
    query SearchContent($input: SearchContentInput!) {
  searchContent(input: $input)
}
    `
export const TrackEventDocument = gql`
    mutation TrackEvent($input: TrackEventInput!) {
  trackEvent(input: $input) {
    success
  }
}
    `
export const TrackNotificationDocument = gql`
    mutation TrackNotification($input: TrackNotificationInput!) {
  trackNotification(input: $input) {
    success
  }
}
    `
export const TransferCartDocument = gql`
    mutation TransferCart($input: TransferCartInput!) {
  transferCart(input: $input) {
    ...CartFragment
  }
}
    ${CartFragmentFragmentDoc}`
