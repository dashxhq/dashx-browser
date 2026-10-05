import uuid from 'uuid-random'

import type { SystemContextCampaignInput } from './generated'
import { getItem, setItem } from './storage'

export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000

const UTM_FIELDS = {
  utm_campaign: 'name',
  utm_source: 'source',
  utm_medium: 'medium',
  utm_term: 'term',
  utm_content: 'content',
} as const satisfies Record<string, keyof SystemContextCampaignInput>

type SessionCampaign = { sessionId: string, campaign: SystemContextCampaignInput }

// Storage is shared across tabs so one visit spanning tabs stays one session; the in-memory copy
// keeps a stable id where storage is unavailable (SSR, sandboxed iframes).
let current: { id: string, lastActivityAt: number } | null = null

let currentCampaign: SessionCampaign | null = null

export function touchSession(now: number = Date.now()): string {
  const id = getItem('sessionId') ?? current?.id
  const lastActivityAt = getItem('sessionLastActivityAt') ?? current?.lastActivityAt
  const isActive = id != null && lastActivityAt != null && now - lastActivityAt < SESSION_IDLE_TIMEOUT_MS
  const sessionId = isActive ? id : uuid()

  current = { id: sessionId, lastActivityAt: now }
  setItem('sessionId', sessionId)
  setItem('sessionLastActivityAt', now)
  return sessionId
}

export function endSession(): void {
  current = null
  currentCampaign = null
  setItem('sessionId', null)
  setItem('sessionLastActivityAt', null)
  setItem('sessionCampaign', null)
}

// The API types every campaign field as a required string, so absent parameters are sent empty.
export function campaignFromUrl(url: string): SystemContextCampaignInput | null {
  let params: URLSearchParams
  try {
    params = new URL(url).searchParams
  } catch {
    return null
  }

  const campaign: SystemContextCampaignInput = { name: '', source: '', medium: '', term: '', content: '' }
  let found = false
  for (const [ param, field ] of Object.entries(UTM_FIELDS)) {
    const value = params.get(param)
    if (value) {
      campaign[field] = value
      found = true
    }
  }
  return found ? campaign : null
}

// Client-side navigation drops the UTM parameters from the URL, so the campaign a session landed
// with is kept for the rest of that session.
export function sessionCampaign(sessionId: string, url: string): SystemContextCampaignInput | null {
  const fromUrl = campaignFromUrl(url)
  if (fromUrl) {
    currentCampaign = { sessionId, campaign: fromUrl }
    setItem('sessionCampaign', currentCampaign)
    return fromUrl
  }

  const stored = getItem('sessionCampaign') ?? currentCampaign
  return stored?.sessionId === sessionId ? stored.campaign : null
}
