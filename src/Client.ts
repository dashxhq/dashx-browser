import fetch from 'unfetch'
import uuid from 'uuid-random'

import { addContentRequest, editContentRequest, fetchContentRequest, identifyAccountRequest, searchContentRequest, trackEventRequest, addItemToCartRequest, applyCouponToCartRequest, removeCouponFromCartRequest, fetchCartRequest, transferCartRequest, fetchStoredPreferencesRequest, saveStoredPreferencesRequest, fetchContactsRequest, saveContactsRequest, prepareExternalAssetRequest, externalAssetRequest } from './graphql'
import generateContext from './context'
import ContentOptionsBuilder from './ContentOptionsBuilder'
import { getItem, setItem } from './storage'
import { parseFilterObject } from './utils'
import type { Context } from './context'
import type { ContentOptions, FetchContentOptions } from './ContentOptionsBuilder'

type ClientParams = {
  publicKey: string,
  baseUri?: string,
  targetEnvironment?: string,
  accountType?: string
}

type IdentifyParams = Record<string, any>

type ContactStubInputType = {
  kind: 'EMAIL' | 'PHONE' | 'IOS' | 'ANDROID' | 'WEB' | 'WHATSAPP',
  value: string,
  tag: string
}

type UploadInputType = {
  file: File,
  externalColumnId: string,
}

class Client {
  #accountAnonymousUid!: string

  #accountUid: string | null = null

  #identityToken: string | null = null

  targetEnvironment?: string

  context: Context

  publicKey: string

  baseUri: string

  constructor({ publicKey, baseUri = 'https://api.dashx.com/graphql', targetEnvironment }: ClientParams) {
    this.baseUri = baseUri
    this.publicKey = publicKey
    this.targetEnvironment = targetEnvironment
    this.context = generateContext()
    this.loadIdentity()
  }

  private set accountAnonymousUid(uid: string) {
    if (!uuid.test(uid)) throw new Error('Anonymous UID must be a valid UUID')
    this.#accountAnonymousUid = uid
    setItem('accountAnonymousUid', this.#accountAnonymousUid)
  }

  private set accountUid(uid: string | number | null) {
    if (uid == null) this.#accountUid = uid
    else this.#accountUid = String(uid)
    setItem('accountUid', this.#accountUid)
  }

  private set identityToken(token: string | null) {
    if (token == null) this.#identityToken = token
    else this.#identityToken = String(token)
    setItem('identityToken', this.#identityToken)
  }

  private async makeHttpRequest(request: string, params: any): Promise<any> {
    const response = await fetch(this.baseUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Public-Key': this.publicKey,
        ...(this.targetEnvironment ? { 'X-Target-Environment': this.targetEnvironment } : {}),
        ...(this.#identityToken ? { 'X-Identity-Token': this.#identityToken } : {})
      },
      body: JSON.stringify({
        query: request,
        variables: params
      })
    }).then((res) => res.json())

    if (response.data) {
      return Promise.resolve(response.data)
    }

    return Promise.reject(response.errors)
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

    const params = {
      uid: options?.uid,
      anonymousUid: this.#accountAnonymousUid,
      ...options
    }

    return this.makeHttpRequest(identifyAccountRequest, { input: params })
      .then((res) => res?.identifyAccount)
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

  track(event: string, data?: Record<string, any>): Promise<Response> {
    const params = {
      event,
      data,
      accountUid: this.#accountUid,
      accountAnonymousUid: this.#accountAnonymousUid
    }

    return this.makeHttpRequest(trackEventRequest, { input: params })
  }

  addContent(urn: string, data: Record<string, any>): Promise<Response> {
    let content; let
      contentType

    if (urn.includes('/')) {
      [ contentType, content ] = urn.split('/')
    } else {
      contentType = urn
    }

    const params = { content, contentType, data }

    return this.makeHttpRequest(addContentRequest, { input: params })
  }

  editContent(urn: string, data: Record<string, any>): Promise<Response> {
    let content; let
      contentType

    if (urn.includes('/')) {
      [ contentType, content ] = urn.split('/')
    } else {
      contentType = urn
    }

    const params = { content, contentType, data }

    return this.makeHttpRequest(editContentRequest, { input: params })
  }

  searchContent(contentType: string): ContentOptionsBuilder
  searchContent(contentType: string, options: ContentOptions): Promise<any>
  searchContent(
    contentType: string, options?: ContentOptions
  ): ContentOptionsBuilder | Promise<any> {
    if (!options) {
      return new ContentOptionsBuilder(
        (wrappedOptions) => this.makeHttpRequest(
          searchContentRequest,
          { input: { ...wrappedOptions, contentType } }
        ).then((response) => response?.searchContent)
      )
    }

    const filter = parseFilterObject(options.filter)

    const result = this.makeHttpRequest(
      searchContentRequest,
      { input: { ...options, contentType, filter } }
    ).then((response) => response?.searchContent)

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
    const params = { content, contentType, ...options }

    const response = await this.makeHttpRequest(fetchContentRequest, { input: params })
    return response?.fetchContent
  }

  async addItemToCart({ custom = {}, ...options }: {
    itemId: string,
    pricingId: string,
    quantity: string,
    reset: boolean,
    custom?: Record<string, any>
  }): Promise<any> {
    const params = {
      custom,
      ...options,
      accountUid: this.#accountUid,
      accountAnonymousUid: this.#accountAnonymousUid
    }

    const response = await this.makeHttpRequest(addItemToCartRequest, { input: params })
    return response?.addItemToCart
  }

  async applyCouponToCart(options: { couponCode: string }): Promise<any> {
    const params = {
      ...options,
      accountUid: this.#accountUid,
      accountAnonymousUid: this.#accountAnonymousUid
    }

    const response = await this.makeHttpRequest(applyCouponToCartRequest, { input: params })
    return response?.applyCouponToCart
  }

  async removeCouponFromCart(options: { couponCode: string }): Promise<any> {
    const params = {
      ...options,
      accountUid: this.#accountUid,
      accountAnonymousUid: this.#accountAnonymousUid
    }

    const response = await this.makeHttpRequest(removeCouponFromCartRequest, { input: params })
    return response?.removeCouponFromCart
  }

  async fetchCart(options: { orderId?: string }): Promise<any> {
    const params = {
      ...options,
      accountUid: this.#accountUid,
      accountAnonymousUid: this.#accountAnonymousUid
    }

    const response = await this.makeHttpRequest(fetchCartRequest, { input: params })
    return response?.fetchCart
  }

  async transferCart(options: { orderId?: string }): Promise<any> {
    const params = {
      ...options,
      accountUid: this.#accountUid,
      accountAnonymousUid: this.#accountAnonymousUid
    }

    const response = await this.makeHttpRequest(transferCartRequest, { input: params })
    return response?.transferCart
  }

  async fetchStoredPreferences(): Promise<any> {
    const params = {
      accountUid: this.#accountUid
    }

    const response = await this.makeHttpRequest(fetchStoredPreferencesRequest, { input: params })
    return response?.fetchStoredPreferences.preferenceData
  }

  async saveStoredPreferences(preferenceData: any): Promise<any> {
    const params = {
      accountUid: this.#accountUid,
      preferenceData
    }

    const response = await this.makeHttpRequest(saveStoredPreferencesRequest, { input: params })
    return response?.saveStoredPreferences
  }

  async fetchContacts(): Promise<any> {
    const params = { uid: this.#accountUid }

    const response = await this.makeHttpRequest(fetchContactsRequest, { input: params })
    return response?.fetchContacts.contacts
  }

  async saveContacts(contacts: ContactStubInputType[]): Promise<any> {
    const params = {
      uid: this.#accountUid,
      contacts
    }

    const response = await this.makeHttpRequest(saveContactsRequest, { input: params })
    return response?.saveContacts
  }

  async upload(options: UploadInputType) {
    const { externalColumnId, file } = options
    const prepareAssetParams = {
      externalColumnId: String(externalColumnId)
    }

    const response = await this.makeHttpRequest(prepareExternalAssetRequest, { input: prepareAssetParams })

    const id = response?.prepareExternalAsset?.id
    const url = response?.prepareExternalAsset?.data?.upload?.url

    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    })

    let tryLefts = 5
    const getExternalAsset = async (): Promise<any> => {
      const response = await this.makeHttpRequest(externalAssetRequest, { id })
      const status = response?.externalAsset?.status
      if (status !== 'ready') {
        await new Promise(resolve => setTimeout(resolve, 2000))
        tryLefts--
        if(!tryLefts) return Promise.reject('Something went wrong.')
        return getExternalAsset()
      }
      return response?.externalAsset?.data?.asset
    }

    return getExternalAsset()
  }
}

export default Client
export type { ClientParams }
