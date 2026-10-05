import uuid from 'uuid-random'

import { getItem, setItem } from './storage'

export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000

// Storage is shared across tabs so one visit spanning tabs stays one session; the in-memory copy
// keeps a stable id where storage is unavailable (SSR, sandboxed iframes).
let current: { id: string, lastActivityAt: number } | null = null

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
  setItem('sessionId', null)
  setItem('sessionLastActivityAt', null)
}
