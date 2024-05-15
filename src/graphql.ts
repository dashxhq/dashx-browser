export const trackEventRequest = `
  mutation TrackEvent($input: TrackEventInput!) {
    trackEvent(input: $input) {
        success
    }
  }
`

export const trackNotificationRequest = `
  mutation TrackNotification($input: TrackNotificationInput!) {
    trackNotification(input: $input) {
        success
    }
  }
`

export const inAppNotificationRecipientsListRequest = `
  query NotificationRecipientsList($filter: JSON!) {
    notificationRecipientsList(filter: $filter) {
        id
        notificationId
        contact
        readAt

        notification {
            id
            renderedContent
        }
    }
  }
`

export const identifyAccountRequest = `
  mutation IdentifyAccount($input: IdentifyAccountInput!) {
    identifyAccount(input: $input) {
        id
    }
  }
`

export const addContentRequest = `
  mutation AddContent($input: AddContentInput!) {
    addContent(input: $input) {
        id
        identifier
        position
        data
        createdAt
        updatedAt
    }
  }
`

export const editContentRequest = `
  mutation EditContent($input: EditContentInput!) {
    editContent(input: $input) {
        id
        identifier
        position
        data
        createdAt
        updatedAt
    }
  }
`

export const searchContentRequest = `
  query SearchContent($input: SearchContentInput!) {
    searchContent(input: $input)
  }
`

export const fetchContentRequest = `
  query FetchContent($input: FetchContentInput!) {
    fetchContent(input: $input)
  }
`

const item = `
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
`

const cart = `
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
        ${item}
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
`
export const addItemToCartRequest = `
  mutation AddItemToCart($input: AddItemToCartInput) {
    addItemToCart(input:$input) {
      ${cart}
    }
  }
`

export const applyCouponToCartRequest = `
  mutation ApplyCouponToCart($input: ApplyCouponToCartInput) {
    applyCouponToCart(input:$input) {
      ${cart}
    }
  }
`

export const removeCouponFromCartRequest = `
  mutation RemoveCouponFromCart($input: RemoveCouponFromCartInput) {
    removeCouponFromCart(input:$input) {
      ${cart}
    }
  }
`

export const fetchCartRequest = `
  query FetchCart($input: FetchCartInput!) {
    fetchCart(input: $input) {
      ${cart}
    }
  }
`

export const transferCartRequest = `
  mutation TransferCart($input: TransferCartInput!) {
    transferCart(input: $input) {
      ${cart}
    }
  }
`

export const fetchStoredPreferencesRequest = `
  query FetchStoredPreferences($input: FetchStoredPreferencesInput!) {
    fetchStoredPreferences(input: $input) {
      preferenceData
    }
  }
`

export const saveStoredPreferencesRequest = `
  mutation SaveStoredPreferences($input: SaveStoredPreferencesInput!) {
    saveStoredPreferences(input: $input) {
      success
    }
  }
`

export const fetchContactsRequest = `
  query FetchContacts($input: FetchContactsInput!) {
    fetchContacts(input: $input) {
      contacts {
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
    }
  }
`

export const saveContactsRequest = `
  mutation SaveContacts($input: SaveContactsInput!) {
    saveContacts(input: $input) {
      contacts {
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
    }
  }
`

export const prepareAssetRequest = `
  mutation prepareAsset($input: PrepareAssetInput!) {
    prepareAsset(input: $input) {
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
  }
`

export const assetRequest = `
  query Asset($id: ID!) {
    asset(id: $id) {
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
  }
`
