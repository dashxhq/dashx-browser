import { beforeEach, describe, expect, it } from 'vitest'

import { getItem, setItem } from '../src/storage'

const LOCAL_STORAGE_KEY = 'dashx-sdk'

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('getItem', () => {
    it('returns null when nothing has been persisted', () => {
      expect(getItem('accountUid')).toBeNull()
      expect(getItem('identityToken')).toBeNull()
      expect(getItem('accountAnonymousUid')).toBeNull()
      expect(getItem('fcmToken')).toBeNull()
    })

    it('returns null when stored JSON is corrupted', () => {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, 'not-json-at-all')
      expect(getItem('accountUid')).toBeNull()
    })

    it('returns a falsy value for a key missing from the persisted blob', () => {
      setItem('accountUid', 'user-1')
      expect(getItem('identityToken')).toBeFalsy()
    })
  })

  describe('setItem', () => {
    it('persists and retrieves a string value', () => {
      setItem('accountUid', 'user-1')
      expect(getItem('accountUid')).toBe('user-1')
    })

    it('persists a null value and returns it as null', () => {
      setItem('accountUid', 'user-1')
      setItem('accountUid', null)
      expect(getItem('accountUid')).toBeNull()
    })

    it('preserves other keys on subsequent writes', () => {
      setItem('accountUid', 'user-1')
      setItem('identityToken', 'token-a')
      setItem('fcmToken', 'fcm-xyz')

      expect(getItem('accountUid')).toBe('user-1')
      expect(getItem('identityToken')).toBe('token-a')
      expect(getItem('fcmToken')).toBe('fcm-xyz')
    })

    it('overwrites an existing value', () => {
      setItem('identityToken', 'old')
      setItem('identityToken', 'new')
      expect(getItem('identityToken')).toBe('new')
    })

    it('stores all keys under a single localStorage key', () => {
      setItem('accountUid', 'user-1')
      setItem('identityToken', 'token-a')

      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!) as Record<string, unknown>
      expect(parsed).toEqual({ accountUid: 'user-1', identityToken: 'token-a' })
    })
  })
})
