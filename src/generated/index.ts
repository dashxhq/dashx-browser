 
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Decimal: { input: any; output: any; }
  JSON: { input: any; output: any; }
  NaiveDate: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
  UUID: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

export type AddItemToCartInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>;
  accountUid?: InputMaybe<Scalars['String']['input']>;
  custom?: InputMaybe<Scalars['JSON']['input']>;
  itemId: Scalars['UUID']['input'];
  pricingId: Scalars['UUID']['input'];
  quantity: Scalars['Decimal']['input'];
  reset: Scalars['Boolean']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type AiAgentInteractionMode =
  | 'CONVERSATIONAL'
  | 'REALTIME';

export type AiAgentVersionStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'UNPUBLISHING';

export type ApplyCouponToCartInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>;
  accountUid?: InputMaybe<Scalars['String']['input']>;
  couponCode: Scalars['String']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type AssetProcessingStatus =
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING';

export type AssetUploadStatus =
  | 'CANCELED'
  | 'FAILED'
  | 'PENDING'
  | 'TIMED_OUT'
  | 'UPLOADED';

export type ContactKind =
  | 'ANDROID'
  | 'EMAIL'
  | 'IOS'
  | 'PHONE'
  | 'WEB'
  | 'WHATSAPP';

export type ContactStatus =
  | 'BLACKLISTED'
  | 'NOT_SUBSCRIBED'
  | 'REVOKED'
  | 'SUBSCRIBED'
  | 'UNSUBSCRIBED';

export type ContactStubInput = {
  kind: ContactKind;
  shouldDestroy?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<ContactStatus>;
  tag?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['String']['input'];
};

export type CouponDiscountType =
  | 'FIXED'
  | 'PERCENTAGE';

export type FetchCartInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>;
  accountUid?: InputMaybe<Scalars['String']['input']>;
  orderId?: InputMaybe<Scalars['UUID']['input']>;
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type FetchContactsInput = {
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
  uid: Scalars['String']['input'];
};

export type FetchInAppNotificationsAggregateInput = {
  accountUid: Scalars['String']['input'];
  filter?: InputMaybe<Scalars['JSON']['input']>;
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type FetchInAppNotificationsInput = {
  accountUid: Scalars['String']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type FetchProductVariantReleaseInput = {
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
  targetVersion: Scalars['String']['input'];
};

export type FetchProductVariantReleaseRuleInput = {
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
  targetProduct: Scalars['String']['input'];
};

export type FetchRecordInput = {
  exclude?: InputMaybe<Array<Scalars['JSON']['input']>>;
  fields?: InputMaybe<Array<Scalars['JSON']['input']>>;
  include?: InputMaybe<Array<Scalars['JSON']['input']>>;
  language?: InputMaybe<Scalars['String']['input']>;
  preview?: InputMaybe<Scalars['Boolean']['input']>;
  recordId: Scalars['UUID']['input'];
  resource?: InputMaybe<Scalars['String']['input']>;
};

export type FetchStoredPreferencesInput = {
  accountUid: Scalars['String']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type IdentifyAccountInput = {
  anonymousUid?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  systemContext?: InputMaybe<SystemContextInput>;
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
  uid?: InputMaybe<Scalars['String']['input']>;
};

export type InvokeAiAgentInput = {
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
  prompt: Scalars['String']['input'];
  publicEmbedKey: Scalars['String']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type LoadAiAgentInput = {
  publicEmbedKey: Scalars['String']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type OrderStatus =
  | 'CANCELED'
  | 'CHECKED_OUT'
  | 'DRAFT'
  | 'INITIAL'
  | 'PAID';

export type PrepareAssetInput = {
  attribute?: InputMaybe<Scalars['String']['input']>;
  externalMetadata?: InputMaybe<Scalars['JSON']['input']>;
  externalUid?: InputMaybe<Scalars['String']['input']>;
  height?: InputMaybe<Scalars['Int']['input']>;
  mimeType: Scalars['String']['input'];
  name: Scalars['String']['input'];
  operation?: InputMaybe<Scalars['String']['input']>;
  parameter?: InputMaybe<Scalars['String']['input']>;
  resource?: InputMaybe<Scalars['String']['input']>;
  size: Scalars['Int']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type PricingKind =
  | 'IN_APP'
  | 'REGULAR';

export type PricingRecurringIntervalUnit =
  | 'DAY'
  | 'MONTH'
  | 'WEEK'
  | 'YEAR';

export type RemoveCouponFromCartInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>;
  accountUid?: InputMaybe<Scalars['String']['input']>;
  couponCode: Scalars['String']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type SaveContactsInput = {
  contacts: Array<ContactStubInput>;
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
  uid: Scalars['String']['input'];
};

export type SaveStoredPreferencesInput = {
  accountUid: Scalars['String']['input'];
  preferenceData: Scalars['JSON']['input'];
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type SearchRecordsInput = {
  exclude?: InputMaybe<Array<Scalars['JSON']['input']>>;
  fields?: InputMaybe<Array<Scalars['JSON']['input']>>;
  filter?: InputMaybe<Scalars['JSON']['input']>;
  include?: InputMaybe<Array<Scalars['JSON']['input']>>;
  language?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Array<Scalars['JSON']['input']>>;
  page?: InputMaybe<Scalars['Int']['input']>;
  preview?: InputMaybe<Scalars['Boolean']['input']>;
  resource: Scalars['String']['input'];
};

export type SystemContextAppInput = {
  build: Scalars['String']['input'];
  name: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
  version: Scalars['String']['input'];
};

export type SystemContextCampaignInput = {
  content: Scalars['String']['input'];
  medium: Scalars['String']['input'];
  name: Scalars['String']['input'];
  source: Scalars['String']['input'];
  term: Scalars['String']['input'];
};

export type SystemContextDeviceInput = {
  adTrackingEnabled: Scalars['Boolean']['input'];
  advertisingId: Scalars['String']['input'];
  id: Scalars['String']['input'];
  kind: Scalars['String']['input'];
  manufacturer: Scalars['String']['input'];
  model: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type SystemContextInput = {
  app?: InputMaybe<SystemContextAppInput>;
  campaign?: InputMaybe<SystemContextCampaignInput>;
  device?: InputMaybe<SystemContextDeviceInput>;
  ipV4: Scalars['String']['input'];
  ipV6?: InputMaybe<Scalars['String']['input']>;
  library?: InputMaybe<SystemContextLibraryInput>;
  locale: Scalars['String']['input'];
  location?: InputMaybe<SystemContextLocationInput>;
  network?: InputMaybe<SystemContextNetworkInput>;
  os?: InputMaybe<SystemContextOsInput>;
  screen?: InputMaybe<SystemContextScreenInput>;
  timeZone: Scalars['String']['input'];
  userAgent: Scalars['String']['input'];
};

export type SystemContextLibraryInput = {
  name: Scalars['String']['input'];
  version: Scalars['String']['input'];
};

export type SystemContextLocationInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Decimal']['input']>;
  longitude?: InputMaybe<Scalars['Decimal']['input']>;
  speed?: InputMaybe<Scalars['Decimal']['input']>;
};

export type SystemContextNetworkInput = {
  bluetooth: Scalars['Boolean']['input'];
  carrier: Scalars['String']['input'];
  cellular: Scalars['Boolean']['input'];
  wifi: Scalars['Boolean']['input'];
};

export type SystemContextOsInput = {
  name: Scalars['String']['input'];
  version: Scalars['String']['input'];
};

export type SystemContextScreenInput = {
  density: Scalars['Int']['input'];
  height: Scalars['Int']['input'];
  width: Scalars['Int']['input'];
};

export type TrackEventInput = {
  accountAnonymousUid?: InputMaybe<Scalars['String']['input']>;
  accountUid?: InputMaybe<Scalars['String']['input']>;
  data?: InputMaybe<Scalars['JSON']['input']>;
  event: Scalars['String']['input'];
  systemContext?: InputMaybe<SystemContextInput>;
  timestamp?: InputMaybe<Scalars['Timestamp']['input']>;
};

export type TrackNotificationInput = {
  id: Scalars['UUID']['input'];
  status: TrackNotificationStatus;
  timestamp: Scalars['Timestamp']['input'];
};

export type TrackNotificationStatus =
  | 'CLICKED'
  | 'DELIVERED'
  | 'DISMISSED'
  | 'OPENED'
  | 'READ'
  | 'UNREAD';

export type TransferCartInput = {
  accountAnonymousUid: Scalars['String']['input'];
  accountUid: Scalars['String']['input'];
  orderId?: InputMaybe<Scalars['UUID']['input']>;
  targetEnvironment?: InputMaybe<Scalars['String']['input']>;
};

export type AddItemToCartMutationVariables = Exact<{
  input: AddItemToCartInput;
}>;


export type AddItemToCartMutation = { __typename?: 'Mutation', addItemToCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } };

export type ApplyCouponToCartMutationVariables = Exact<{
  input: ApplyCouponToCartInput;
}>;


export type ApplyCouponToCartMutation = { __typename?: 'Mutation', applyCouponToCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } };

export type AssetQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type AssetQuery = { __typename?: 'Query', asset: { __typename?: 'Asset', attributeId?: any | null, createdAt: any, data: any, id: any, mimeType?: string | null, name?: string | null, processingStatus: AssetProcessingStatus, resourceId?: any | null, size?: number | null, storageProviderId?: any | null, updatedAt: any, uploadStatus: AssetUploadStatus, uploaderId?: any | null, url?: string | null, workspaceId: any } };

export type AssetFragmentFragment = { __typename?: 'Asset', attributeId?: any | null, createdAt: any, data: any, id: any, mimeType?: string | null, name?: string | null, processingStatus: AssetProcessingStatus, resourceId?: any | null, size?: number | null, storageProviderId?: any | null, updatedAt: any, uploadStatus: AssetUploadStatus, uploaderId?: any | null, url?: string | null, workspaceId: any };

export type CartFragmentFragment = { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> };

export type ContactFragmentFragment = { __typename?: 'Contact', id: any, accountId: any, name?: string | null, kind: ContactKind, value: string, unverifiedValue?: string | null, verifiedAt?: any | null, status: ContactStatus, tag?: string | null, createdAt: any, updatedAt: any };

export type FetchCartQueryVariables = Exact<{
  input: FetchCartInput;
}>;


export type FetchCartQuery = { __typename?: 'Query', fetchCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } };

export type FetchContactsQueryVariables = Exact<{
  input: FetchContactsInput;
}>;


export type FetchContactsQuery = { __typename?: 'Query', fetchContacts: { __typename?: 'FetchContactsResponse', contacts: Array<{ __typename?: 'Contact', id: any, accountId: any, name?: string | null, kind: ContactKind, value: string, unverifiedValue?: string | null, verifiedAt?: any | null, status: ContactStatus, tag?: string | null, createdAt: any, updatedAt: any }> } };

export type FetchInAppNotificationsQueryVariables = Exact<{
  input: FetchInAppNotificationsInput;
}>;


export type FetchInAppNotificationsQuery = { __typename?: 'Query', notifications: Array<{ __typename?: 'Notification', id: any, sentAt?: any | null, readAt?: any | null, renderedContent: any }> };

export type FetchInAppNotificationsAggregateQueryVariables = Exact<{
  input: FetchInAppNotificationsAggregateInput;
}>;


export type FetchInAppNotificationsAggregateQuery = { __typename?: 'Query', notificationsAggregate: { __typename?: 'FetchInAppNotificationsAggregateResponse', count?: number | null } };

export type FetchProductVariantReleaseQueryVariables = Exact<{
  input: FetchProductVariantReleaseInput;
}>;


export type FetchProductVariantReleaseQuery = { __typename?: 'Query', productVariantRelease: { __typename?: 'ProductVariantRelease', id: any, productVariantId: any, versionName: string, versionNumber: number, releaseNotes?: string | null, createdAt: any, updatedAt: any } };

export type FetchProductVariantReleaseRuleQueryVariables = Exact<{
  input: FetchProductVariantReleaseRuleInput;
}>;


export type FetchProductVariantReleaseRuleQuery = { __typename?: 'Query', productVariantReleaseRule: { __typename?: 'ProductVariantReleaseRule', id: any, productVariantId: any, minimumReleaseId: any, recommendedReleaseId: any, latestReleaseId: any, autoRecommendNewReleases: boolean, createdAt: any, updatedAt: any, minimumRelease: { __typename?: 'ProductVariantRelease', id: any, productVariantId: any, versionName: string, versionNumber: number, releaseNotes?: string | null, createdAt: any, updatedAt: any }, recommendedRelease: { __typename?: 'ProductVariantRelease', id: any, productVariantId: any, versionName: string, versionNumber: number, releaseNotes?: string | null, createdAt: any, updatedAt: any }, latestRelease: { __typename?: 'ProductVariantRelease', id: any, productVariantId: any, versionName: string, versionNumber: number, releaseNotes?: string | null, createdAt: any, updatedAt: any } } };

export type FetchRecordQueryVariables = Exact<{
  input: FetchRecordInput;
}>;


export type FetchRecordQuery = { __typename?: 'Query', fetchRecord: any };

export type FetchStoredPreferencesQueryVariables = Exact<{
  input: FetchStoredPreferencesInput;
}>;


export type FetchStoredPreferencesQuery = { __typename?: 'Query', fetchStoredPreferences: { __typename?: 'FetchStoredPreferencesResponse', preferenceData: any } };

export type IdentifyAccountMutationVariables = Exact<{
  input: IdentifyAccountInput;
}>;


export type IdentifyAccountMutation = { __typename?: 'Mutation', identifyAccount: { __typename?: 'Account', id: any } };

export type InvokeAiAgentQueryVariables = Exact<{
  input: InvokeAiAgentInput;
}>;


export type InvokeAiAgentQuery = { __typename?: 'Query', invokeAiAgent: { __typename?: 'AiMessage', id: any, workspaceId: any, conversationId: any, senderId: any, role: string, content?: string | null, metadata?: any | null, rawBody?: any | null, createdAt: any, updatedAt: any } };

export type ItemFragmentFragment = { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> };

export type LoadAiAgentQueryVariables = Exact<{
  input: LoadAiAgentInput;
}>;


export type LoadAiAgentQuery = { __typename?: 'Query', loadAiAgent: { __typename?: 'LoadAiAgentResponse', id: any, name: string, identifier: string, avatar?: string | null, versionId: any, starterMessages?: Array<any> | null, starterSuggestions?: Array<any> | null, status: AiAgentVersionStatus, interactionMode: AiAgentInteractionMode } };

export type PrepareAssetMutationVariables = Exact<{
  input: PrepareAssetInput;
}>;


export type PrepareAssetMutation = { __typename?: 'Mutation', prepareAsset: { __typename?: 'Asset', attributeId?: any | null, createdAt: any, data: any, id: any, mimeType?: string | null, name?: string | null, processingStatus: AssetProcessingStatus, resourceId?: any | null, size?: number | null, storageProviderId?: any | null, updatedAt: any, uploadStatus: AssetUploadStatus, uploaderId?: any | null, url?: string | null, workspaceId: any } };

export type ProductVariantReleaseFragmentFragment = { __typename?: 'ProductVariantRelease', id: any, productVariantId: any, versionName: string, versionNumber: number, releaseNotes?: string | null, createdAt: any, updatedAt: any };

export type RemoveCouponFromCartMutationVariables = Exact<{
  input: RemoveCouponFromCartInput;
}>;


export type RemoveCouponFromCartMutation = { __typename?: 'Mutation', removeCouponFromCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } };

export type SaveContactsMutationVariables = Exact<{
  input: SaveContactsInput;
}>;


export type SaveContactsMutation = { __typename?: 'Mutation', saveContacts: { __typename?: 'SaveContactsResponse', contacts: Array<{ __typename?: 'Contact', id: any, accountId: any, name?: string | null, kind: ContactKind, value: string, unverifiedValue?: string | null, verifiedAt?: any | null, status: ContactStatus, tag?: string | null, createdAt: any, updatedAt: any }> } };

export type SaveStoredPreferencesMutationVariables = Exact<{
  input: SaveStoredPreferencesInput;
}>;


export type SaveStoredPreferencesMutation = { __typename?: 'Mutation', saveStoredPreferences: { __typename?: 'SaveStoredPreferencesResponse', success: boolean } };

export type SearchRecordsQueryVariables = Exact<{
  input: SearchRecordsInput;
}>;


export type SearchRecordsQuery = { __typename?: 'Query', searchRecords: Array<any> };

export type TrackEventMutationVariables = Exact<{
  input: TrackEventInput;
}>;


export type TrackEventMutation = { __typename?: 'Mutation', trackEvent: { __typename?: 'TrackEventResponse', success: boolean } };

export type TrackNotificationMutationVariables = Exact<{
  input: TrackNotificationInput;
}>;


export type TrackNotificationMutation = { __typename?: 'Mutation', trackNotification: { __typename?: 'TrackNotificationResponse', success: boolean } };

export type TransferCartMutationVariables = Exact<{
  input: TransferCartInput;
}>;


export type TransferCartMutation = { __typename?: 'Mutation', transferCart: { __typename?: 'Order', id: any, status: OrderStatus, subtotal: any, discount: any, tax: any, total: any, gatewayMeta?: any | null, currencyCode: string, orderItems: Array<{ __typename?: 'OrderItem', id: any, quantity: any, unitPrice: any, subtotal: any, discount: any, tax: any, total: any, custom: any, currencyCode: string, item: { __typename?: 'Item', id: any, name: string, identifier: string, description?: string | null, createdAt: any, updatedAt: any, pricings: Array<{ __typename?: 'Pricing', id: any, kind: PricingKind, amount: any, originalAmount?: any | null, isRecurring: boolean, recurringInterval: number, recurringIntervalUnit: PricingRecurringIntervalUnit, appleProductIdentifier?: string | null, googleProductIdentifier?: string | null, currencyCode: string, createdAt: any, updatedAt: any }> } }>, couponRedemptions: Array<{ __typename?: 'CouponRedemption', coupon: { __typename?: 'Coupon', name: string, identifier: string, discountType: CouponDiscountType, discountAmount: any, currencyCode?: string | null, expiresAt?: any | null } }> } };

export const AssetFragmentFragmentDoc = {'kind':'Document','definitions':[ {'kind':'FragmentDefinition','name':{'kind':'Name','value':'AssetFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Asset'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'attributeId'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'data'}},{'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'mimeType'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'processingStatus'}},{'kind':'Field','name':{'kind':'Name','value':'resourceId'}},{'kind':'Field','name':{'kind':'Name','value':'size'}},{'kind':'Field','name':{'kind':'Name','value':'storageProviderId'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'uploadStatus'}},{'kind':'Field','name':{'kind':'Name','value':'uploaderId'}},{'kind':'Field','name':{'kind':'Name','value':'url'}},{'kind':'Field','name':{'kind':'Name','value':'workspaceId'}} ]}} ]} as unknown as DocumentNode<AssetFragmentFragment, unknown>
export const ItemFragmentFragmentDoc = {'kind':'Document','definitions':[ {'kind':'FragmentDefinition','name':{'kind':'Name','value':'ItemFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Item'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'description'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'pricings'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'amount'}},{'kind':'Field','name':{'kind':'Name','value':'originalAmount'}},{'kind':'Field','name':{'kind':'Name','value':'isRecurring'}},{'kind':'Field','name':{'kind':'Name','value':'recurringInterval'}},{'kind':'Field','name':{'kind':'Name','value':'recurringIntervalUnit'}},{'kind':'Field','name':{'kind':'Name','value':'appleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'googleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]}} ]} as unknown as DocumentNode<ItemFragmentFragment, unknown>
export const CartFragmentFragmentDoc = {'kind':'Document','definitions':[ {'kind':'FragmentDefinition','name':{'kind':'Name','value':'CartFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Order'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'gatewayMeta'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'orderItems'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'quantity'}},{'kind':'Field','name':{'kind':'Name','value':'unitPrice'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'custom'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'item'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ItemFragment'}} ]}} ]}},{'kind':'Field','name':{'kind':'Name','value':'couponRedemptions'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'coupon'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'discountType'}},{'kind':'Field','name':{'kind':'Name','value':'discountAmount'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'expiresAt'}} ]}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ItemFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Item'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'description'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'pricings'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'amount'}},{'kind':'Field','name':{'kind':'Name','value':'originalAmount'}},{'kind':'Field','name':{'kind':'Name','value':'isRecurring'}},{'kind':'Field','name':{'kind':'Name','value':'recurringInterval'}},{'kind':'Field','name':{'kind':'Name','value':'recurringIntervalUnit'}},{'kind':'Field','name':{'kind':'Name','value':'appleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'googleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]}} ]} as unknown as DocumentNode<CartFragmentFragment, unknown>
export const ContactFragmentFragmentDoc = {'kind':'Document','definitions':[ {'kind':'FragmentDefinition','name':{'kind':'Name','value':'ContactFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Contact'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'accountId'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'value'}},{'kind':'Field','name':{'kind':'Name','value':'unverifiedValue'}},{'kind':'Field','name':{'kind':'Name','value':'verifiedAt'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'tag'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]} as unknown as DocumentNode<ContactFragmentFragment, unknown>
export const ProductVariantReleaseFragmentFragmentDoc = {'kind':'Document','definitions':[ {'kind':'FragmentDefinition','name':{'kind':'Name','value':'ProductVariantReleaseFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'ProductVariantRelease'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'productVariantId'}},{'kind':'Field','name':{'kind':'Name','value':'versionName'}},{'kind':'Field','name':{'kind':'Name','value':'versionNumber'}},{'kind':'Field','name':{'kind':'Name','value':'releaseNotes'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]} as unknown as DocumentNode<ProductVariantReleaseFragmentFragment, unknown>
export const AddItemToCartDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'AddItemToCart'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'AddItemToCartInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'addItemToCart'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'CartFragment'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ItemFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Item'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'description'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'pricings'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'amount'}},{'kind':'Field','name':{'kind':'Name','value':'originalAmount'}},{'kind':'Field','name':{'kind':'Name','value':'isRecurring'}},{'kind':'Field','name':{'kind':'Name','value':'recurringInterval'}},{'kind':'Field','name':{'kind':'Name','value':'recurringIntervalUnit'}},{'kind':'Field','name':{'kind':'Name','value':'appleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'googleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'CartFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Order'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'gatewayMeta'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'orderItems'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'quantity'}},{'kind':'Field','name':{'kind':'Name','value':'unitPrice'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'custom'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'item'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ItemFragment'}} ]}} ]}},{'kind':'Field','name':{'kind':'Name','value':'couponRedemptions'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'coupon'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'discountType'}},{'kind':'Field','name':{'kind':'Name','value':'discountAmount'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'expiresAt'}} ]}} ]}} ]}} ]} as unknown as DocumentNode<AddItemToCartMutation, AddItemToCartMutationVariables>
export const ApplyCouponToCartDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'ApplyCouponToCart'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'ApplyCouponToCartInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'applyCouponToCart'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'CartFragment'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ItemFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Item'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'description'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'pricings'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'amount'}},{'kind':'Field','name':{'kind':'Name','value':'originalAmount'}},{'kind':'Field','name':{'kind':'Name','value':'isRecurring'}},{'kind':'Field','name':{'kind':'Name','value':'recurringInterval'}},{'kind':'Field','name':{'kind':'Name','value':'recurringIntervalUnit'}},{'kind':'Field','name':{'kind':'Name','value':'appleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'googleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'CartFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Order'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'gatewayMeta'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'orderItems'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'quantity'}},{'kind':'Field','name':{'kind':'Name','value':'unitPrice'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'custom'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'item'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ItemFragment'}} ]}} ]}},{'kind':'Field','name':{'kind':'Name','value':'couponRedemptions'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'coupon'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'discountType'}},{'kind':'Field','name':{'kind':'Name','value':'discountAmount'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'expiresAt'}} ]}} ]}} ]}} ]} as unknown as DocumentNode<ApplyCouponToCartMutation, ApplyCouponToCartMutationVariables>
export const AssetDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'Asset'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'id'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'UUID'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'asset'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'id'},'value':{'kind':'Variable','name':{'kind':'Name','value':'id'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'AssetFragment'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'AssetFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Asset'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'attributeId'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'data'}},{'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'mimeType'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'processingStatus'}},{'kind':'Field','name':{'kind':'Name','value':'resourceId'}},{'kind':'Field','name':{'kind':'Name','value':'size'}},{'kind':'Field','name':{'kind':'Name','value':'storageProviderId'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'uploadStatus'}},{'kind':'Field','name':{'kind':'Name','value':'uploaderId'}},{'kind':'Field','name':{'kind':'Name','value':'url'}},{'kind':'Field','name':{'kind':'Name','value':'workspaceId'}} ]}} ]} as unknown as DocumentNode<AssetQuery, AssetQueryVariables>
export const FetchCartDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'FetchCart'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'FetchCartInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'fetchCart'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'CartFragment'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ItemFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Item'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'description'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'pricings'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'amount'}},{'kind':'Field','name':{'kind':'Name','value':'originalAmount'}},{'kind':'Field','name':{'kind':'Name','value':'isRecurring'}},{'kind':'Field','name':{'kind':'Name','value':'recurringInterval'}},{'kind':'Field','name':{'kind':'Name','value':'recurringIntervalUnit'}},{'kind':'Field','name':{'kind':'Name','value':'appleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'googleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'CartFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Order'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'gatewayMeta'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'orderItems'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'quantity'}},{'kind':'Field','name':{'kind':'Name','value':'unitPrice'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'custom'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'item'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ItemFragment'}} ]}} ]}},{'kind':'Field','name':{'kind':'Name','value':'couponRedemptions'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'coupon'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'discountType'}},{'kind':'Field','name':{'kind':'Name','value':'discountAmount'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'expiresAt'}} ]}} ]}} ]}} ]} as unknown as DocumentNode<FetchCartQuery, FetchCartQueryVariables>
export const FetchContactsDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'FetchContacts'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'FetchContactsInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'fetchContacts'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'contacts'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ContactFragment'}} ]}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ContactFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Contact'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'accountId'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'value'}},{'kind':'Field','name':{'kind':'Name','value':'unverifiedValue'}},{'kind':'Field','name':{'kind':'Name','value':'verifiedAt'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'tag'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]} as unknown as DocumentNode<FetchContactsQuery, FetchContactsQueryVariables>
export const FetchInAppNotificationsDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'FetchInAppNotifications'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'FetchInAppNotificationsInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','alias':{'kind':'Name','value':'notifications'},'name':{'kind':'Name','value':'fetchInAppNotifications'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'sentAt'}},{'kind':'Field','name':{'kind':'Name','value':'readAt'}},{'kind':'Field','name':{'kind':'Name','value':'renderedContent'}} ]}} ]}} ]} as unknown as DocumentNode<FetchInAppNotificationsQuery, FetchInAppNotificationsQueryVariables>
export const FetchInAppNotificationsAggregateDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'FetchInAppNotificationsAggregate'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'FetchInAppNotificationsAggregateInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','alias':{'kind':'Name','value':'notificationsAggregate'},'name':{'kind':'Name','value':'fetchInAppNotificationsAggregate'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'count'}} ]}} ]}} ]} as unknown as DocumentNode<FetchInAppNotificationsAggregateQuery, FetchInAppNotificationsAggregateQueryVariables>
export const FetchProductVariantReleaseDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'FetchProductVariantRelease'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'FetchProductVariantReleaseInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','alias':{'kind':'Name','value':'productVariantRelease'},'name':{'kind':'Name','value':'fetchProductVariantRelease'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ProductVariantReleaseFragment'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ProductVariantReleaseFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'ProductVariantRelease'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'productVariantId'}},{'kind':'Field','name':{'kind':'Name','value':'versionName'}},{'kind':'Field','name':{'kind':'Name','value':'versionNumber'}},{'kind':'Field','name':{'kind':'Name','value':'releaseNotes'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]} as unknown as DocumentNode<FetchProductVariantReleaseQuery, FetchProductVariantReleaseQueryVariables>
export const FetchProductVariantReleaseRuleDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'FetchProductVariantReleaseRule'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'FetchProductVariantReleaseRuleInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','alias':{'kind':'Name','value':'productVariantReleaseRule'},'name':{'kind':'Name','value':'fetchProductVariantReleaseRule'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'productVariantId'}},{'kind':'Field','name':{'kind':'Name','value':'minimumReleaseId'}},{'kind':'Field','name':{'kind':'Name','value':'recommendedReleaseId'}},{'kind':'Field','name':{'kind':'Name','value':'latestReleaseId'}},{'kind':'Field','name':{'kind':'Name','value':'autoRecommendNewReleases'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'minimumRelease'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ProductVariantReleaseFragment'}} ]}},{'kind':'Field','name':{'kind':'Name','value':'recommendedRelease'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ProductVariantReleaseFragment'}} ]}},{'kind':'Field','name':{'kind':'Name','value':'latestRelease'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ProductVariantReleaseFragment'}} ]}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ProductVariantReleaseFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'ProductVariantRelease'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'productVariantId'}},{'kind':'Field','name':{'kind':'Name','value':'versionName'}},{'kind':'Field','name':{'kind':'Name','value':'versionNumber'}},{'kind':'Field','name':{'kind':'Name','value':'releaseNotes'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]} as unknown as DocumentNode<FetchProductVariantReleaseRuleQuery, FetchProductVariantReleaseRuleQueryVariables>
export const FetchRecordDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'FetchRecord'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'FetchRecordInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'fetchRecord'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ]} ]}} ]} as unknown as DocumentNode<FetchRecordQuery, FetchRecordQueryVariables>
export const FetchStoredPreferencesDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'FetchStoredPreferences'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'FetchStoredPreferencesInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'fetchStoredPreferences'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'preferenceData'}} ]}} ]}} ]} as unknown as DocumentNode<FetchStoredPreferencesQuery, FetchStoredPreferencesQueryVariables>
export const IdentifyAccountDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'IdentifyAccount'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'IdentifyAccountInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'identifyAccount'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}} ]}} ]}} ]} as unknown as DocumentNode<IdentifyAccountMutation, IdentifyAccountMutationVariables>
export const InvokeAiAgentDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'InvokeAiAgent'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'InvokeAiAgentInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'invokeAiAgent'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'workspaceId'}},{'kind':'Field','name':{'kind':'Name','value':'conversationId'}},{'kind':'Field','name':{'kind':'Name','value':'senderId'}},{'kind':'Field','name':{'kind':'Name','value':'role'}},{'kind':'Field','name':{'kind':'Name','value':'content'}},{'kind':'Field','name':{'kind':'Name','value':'metadata'}},{'kind':'Field','name':{'kind':'Name','value':'rawBody'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]}} ]} as unknown as DocumentNode<InvokeAiAgentQuery, InvokeAiAgentQueryVariables>
export const LoadAiAgentDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'LoadAiAgent'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'LoadAiAgentInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'loadAiAgent'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'avatar'}},{'kind':'Field','name':{'kind':'Name','value':'versionId'}},{'kind':'Field','name':{'kind':'Name','value':'starterMessages'}},{'kind':'Field','name':{'kind':'Name','value':'starterSuggestions'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'interactionMode'}} ]}} ]}} ]} as unknown as DocumentNode<LoadAiAgentQuery, LoadAiAgentQueryVariables>
export const PrepareAssetDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'prepareAsset'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'PrepareAssetInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'prepareAsset'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'AssetFragment'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'AssetFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Asset'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'attributeId'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'data'}},{'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'mimeType'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'processingStatus'}},{'kind':'Field','name':{'kind':'Name','value':'resourceId'}},{'kind':'Field','name':{'kind':'Name','value':'size'}},{'kind':'Field','name':{'kind':'Name','value':'storageProviderId'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'uploadStatus'}},{'kind':'Field','name':{'kind':'Name','value':'uploaderId'}},{'kind':'Field','name':{'kind':'Name','value':'url'}},{'kind':'Field','name':{'kind':'Name','value':'workspaceId'}} ]}} ]} as unknown as DocumentNode<PrepareAssetMutation, PrepareAssetMutationVariables>
export const RemoveCouponFromCartDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'RemoveCouponFromCart'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'RemoveCouponFromCartInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'removeCouponFromCart'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'CartFragment'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ItemFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Item'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'description'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'pricings'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'amount'}},{'kind':'Field','name':{'kind':'Name','value':'originalAmount'}},{'kind':'Field','name':{'kind':'Name','value':'isRecurring'}},{'kind':'Field','name':{'kind':'Name','value':'recurringInterval'}},{'kind':'Field','name':{'kind':'Name','value':'recurringIntervalUnit'}},{'kind':'Field','name':{'kind':'Name','value':'appleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'googleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'CartFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Order'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'gatewayMeta'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'orderItems'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'quantity'}},{'kind':'Field','name':{'kind':'Name','value':'unitPrice'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'custom'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'item'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ItemFragment'}} ]}} ]}},{'kind':'Field','name':{'kind':'Name','value':'couponRedemptions'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'coupon'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'discountType'}},{'kind':'Field','name':{'kind':'Name','value':'discountAmount'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'expiresAt'}} ]}} ]}} ]}} ]} as unknown as DocumentNode<RemoveCouponFromCartMutation, RemoveCouponFromCartMutationVariables>
export const SaveContactsDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'SaveContacts'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'SaveContactsInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'saveContacts'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'contacts'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ContactFragment'}} ]}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ContactFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Contact'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'accountId'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'value'}},{'kind':'Field','name':{'kind':'Name','value':'unverifiedValue'}},{'kind':'Field','name':{'kind':'Name','value':'verifiedAt'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'tag'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]} as unknown as DocumentNode<SaveContactsMutation, SaveContactsMutationVariables>
export const SaveStoredPreferencesDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'SaveStoredPreferences'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'SaveStoredPreferencesInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'saveStoredPreferences'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'success'}} ]}} ]}} ]} as unknown as DocumentNode<SaveStoredPreferencesMutation, SaveStoredPreferencesMutationVariables>
export const SearchRecordsDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'query','name':{'kind':'Name','value':'SearchRecords'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'SearchRecordsInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'searchRecords'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ]} ]}} ]} as unknown as DocumentNode<SearchRecordsQuery, SearchRecordsQueryVariables>
export const TrackEventDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'TrackEvent'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'TrackEventInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'trackEvent'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'success'}} ]}} ]}} ]} as unknown as DocumentNode<TrackEventMutation, TrackEventMutationVariables>
export const TrackNotificationDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'TrackNotification'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'TrackNotificationInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'trackNotification'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'success'}} ]}} ]}} ]} as unknown as DocumentNode<TrackNotificationMutation, TrackNotificationMutationVariables>
export const TransferCartDocument = {'kind':'Document','definitions':[ {'kind':'OperationDefinition','operation':'mutation','name':{'kind':'Name','value':'TransferCart'},'variableDefinitions':[ {'kind':'VariableDefinition','variable':{'kind':'Variable','name':{'kind':'Name','value':'input'}},'type':{'kind':'NonNullType','type':{'kind':'NamedType','name':{'kind':'Name','value':'TransferCartInput'}}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'transferCart'},'arguments':[ {'kind':'Argument','name':{'kind':'Name','value':'input'},'value':{'kind':'Variable','name':{'kind':'Name','value':'input'}}} ],'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'CartFragment'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'ItemFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Item'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'description'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}},{'kind':'Field','name':{'kind':'Name','value':'pricings'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'kind'}},{'kind':'Field','name':{'kind':'Name','value':'amount'}},{'kind':'Field','name':{'kind':'Name','value':'originalAmount'}},{'kind':'Field','name':{'kind':'Name','value':'isRecurring'}},{'kind':'Field','name':{'kind':'Name','value':'recurringInterval'}},{'kind':'Field','name':{'kind':'Name','value':'recurringIntervalUnit'}},{'kind':'Field','name':{'kind':'Name','value':'appleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'googleProductIdentifier'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'createdAt'}},{'kind':'Field','name':{'kind':'Name','value':'updatedAt'}} ]}} ]}},{'kind':'FragmentDefinition','name':{'kind':'Name','value':'CartFragment'},'typeCondition':{'kind':'NamedType','name':{'kind':'Name','value':'Order'}},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'status'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'gatewayMeta'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'orderItems'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'id'}},{'kind':'Field','name':{'kind':'Name','value':'quantity'}},{'kind':'Field','name':{'kind':'Name','value':'unitPrice'}},{'kind':'Field','name':{'kind':'Name','value':'subtotal'}},{'kind':'Field','name':{'kind':'Name','value':'discount'}},{'kind':'Field','name':{'kind':'Name','value':'tax'}},{'kind':'Field','name':{'kind':'Name','value':'total'}},{'kind':'Field','name':{'kind':'Name','value':'custom'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'item'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'FragmentSpread','name':{'kind':'Name','value':'ItemFragment'}} ]}} ]}},{'kind':'Field','name':{'kind':'Name','value':'couponRedemptions'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'coupon'},'selectionSet':{'kind':'SelectionSet','selections':[ {'kind':'Field','name':{'kind':'Name','value':'name'}},{'kind':'Field','name':{'kind':'Name','value':'identifier'}},{'kind':'Field','name':{'kind':'Name','value':'discountType'}},{'kind':'Field','name':{'kind':'Name','value':'discountAmount'}},{'kind':'Field','name':{'kind':'Name','value':'currencyCode'}},{'kind':'Field','name':{'kind':'Name','value':'expiresAt'}} ]}} ]}} ]}} ]} as unknown as DocumentNode<TransferCartMutation, TransferCartMutationVariables>