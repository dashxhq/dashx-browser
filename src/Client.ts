import fetch from 'unfetch'
import uuid from 'uuid-random'

import { addContentRequest, editContentRequest, fetchContentRequest, identifyAccountRequest, searchContentRequest, trackEventRequest, addItemToCartRequest, applyCouponToCartRequest, removeCouponFromCartRequest, fetchCartRequest, transferCartRequest, fetchStoredPreferencesRequest, saveStoredPreferencesRequest, fetchContactsRequest, saveContactsRequest } from './graphql'
import generateContext from './context'
import ContentOptionsBuilder from './ContentOptionsBuilder'
import { getItem, setItem } from './storage'
import { parseFilterObject } from './utils'
import type { Context } from './context'
import type { ContentOptions, FetchContentOptions } from './ContentOptionsBuilder'

type ClientParams = {
  publicKey: string,
  baseUri?: string,
  targetInstallation?: string,
  targetEnvironment?: string,
  accountType?: string
}

type IdentifyParams = Record<string, any>

type ContactStubInputType = {
  kind: 'EMAIL' | 'PHONE' | 'IOS' | 'ANDROID' | 'WEB' | 'WHATSAPP',
  value: string,
  tag: string
}

class Client {
  accountAnonymousUid: string | null = null

  accountUid: string | null = null

  targetInstallation?: string

  targetEnvironment?: string

  identityToken?: string

  context: Context

  publicKey: string

  baseUri: string

  constructor({ publicKey, baseUri = 'https://api.dashx.com/graphql', targetEnvironment, targetInstallation }: ClientParams) {
    this.baseUri = baseUri
    this.publicKey = publicKey
    this.targetEnvironment = targetEnvironment
    this.targetInstallation = targetInstallation
    this.context = generateContext()
    this.generateAnonymousUid()
  }

  private generateAnonymousUid(regenerate = false): void {
    const accountAnonymousUid = getItem('accountAnonymousUid')
    if (!regenerate && accountAnonymousUid) {
      this.accountAnonymousUid = accountAnonymousUid
      return
    }

    this.accountAnonymousUid = uuid()
    setItem('accountAnonymousUid', this.accountAnonymousUid)
  }

  private async makeHttpRequest(request: string, params: any): Promise<any> {
    const response = await fetch(this.baseUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Public-Key': this.publicKey,
        ...(this.targetInstallation ? { 'X-Target-Installation': this.targetInstallation } : {}),
        ...(this.targetEnvironment ? { 'X-Target-Environment': this.targetEnvironment } : {}),
        ...(this.identityToken ? { 'X-Identity-Token': this.identityToken } : {})
      },
      body: JSON.stringify({
        query: request,
        variables: { input: params }
      })
    }).then((res) => res.json())

    if (response.data) {
      return Promise.resolve(response.data)
    }

    return Promise.reject(response.errors)
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
      anonymousUid: this.accountAnonymousUid,
      ...options
    }

    return this.makeHttpRequest(identifyAccountRequest, params)
      .then((res) => res?.identifyAccount)
  }

  setIdentity(uid: string, token?: string): void {
    this.accountUid = uid
    this.identityToken = token
  }

  reset(): void {
    this.accountUid = null
    this.generateAnonymousUid(true)
  }

  track(event: string, data?: Record<string, any>): Promise<Response> {
    const params = {
      event,
      data,
      accountUid: this.accountUid,
      accountAnonymousUid: this.accountAnonymousUid
    }

    return this.makeHttpRequest(trackEventRequest, params)
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

    return this.makeHttpRequest(addContentRequest, params)
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

    return this.makeHttpRequest(editContentRequest, params)
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
          { ...wrappedOptions, contentType }
        ).then((response) => response?.searchContent)
      )
    }

    const filter = parseFilterObject(options.filter)

    const result = this.makeHttpRequest(
      searchContentRequest,
      { ...options, contentType, filter }
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

    const response = await this.makeHttpRequest(fetchContentRequest, params)
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
      accountUid: this.accountUid,
      accountAnonymousUid: this.accountAnonymousUid
    }

    const response = await this.makeHttpRequest(addItemToCartRequest, params)
    return response?.addItemToCart
  }

  async applyCouponToCart(options: { couponCode: string }): Promise<any> {
    const params = {
      ...options,
      accountUid: this.accountUid,
      accountAnonymousUid: this.accountAnonymousUid
    }

    const response = await this.makeHttpRequest(applyCouponToCartRequest, params)
    return response?.applyCouponToCart
  }

  async removeCouponFromCart(options: { couponCode: string }): Promise<any> {
    const params = {
      ...options,
      accountUid: this.accountUid,
      accountAnonymousUid: this.accountAnonymousUid
    }

    const response = await this.makeHttpRequest(removeCouponFromCartRequest, params)
    return response?.removeCouponFromCart
  }

  async fetchCart(options: { orderId?: string }): Promise<any> {
    const params = {
      ...options,
      accountUid: this.accountUid,
      accountAnonymousUid: this.accountAnonymousUid
    }

    const response = await this.makeHttpRequest(fetchCartRequest, params)
    return response?.fetchCart
  }

  async transferCart(options: { orderId?: string }): Promise<any> {
    const params = {
      ...options,
      accountUid: this.accountUid,
      accountAnonymousUid: this.accountAnonymousUid
    }

    const response = await this.makeHttpRequest(transferCartRequest, params)
    return response?.transferCart
  }

  async fetchStoredPreferences(uid: string): Promise<any> {
    const params = {
      accountUid: uid
    }

    const response = await this.makeHttpRequest(fetchStoredPreferencesRequest, params)
    return response?.fetchStoredPreferences.preferenceData
  }

  async saveStoredPreferences(uid: string, preferenceData: any): Promise<any> {
    const params = {
      accountUid: uid,
      preferenceData
    }

    const response = await this.makeHttpRequest(saveStoredPreferencesRequest, params)
    return response?.saveStoredPreferences
  }

  async fetchContacts(uid: string): Promise<any> {
    const params = { uid }

    const response = await this.makeHttpRequest(fetchContactsRequest, params)
    return response?.fetchContacts.contacts
  }

  async saveContacts(uid: string, contacts: ContactStubInputType[]): Promise<any> {
    const params = {
      uid,
      contacts
    }

    const response = await this.makeHttpRequest(saveContactsRequest, params)
    return response?.saveContacts
  }
}

export default Client
export type { ClientParams }
