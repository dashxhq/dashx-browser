type PersistedData = {
  accountAnonymousUid: string,
  accountUid: string | null,
  identityToken: string | null,
  fcmToken: string | null,
}

const LOCAL_STORAGE_KEY = 'dashx-sdk'

function getItem<K extends keyof PersistedData>(key: K): PersistedData[K] | null {
  try {
    const persistedContents = window.localStorage.getItem(LOCAL_STORAGE_KEY)

    if (!persistedContents) {
      return null
    }

    const persistedData = JSON.parse(persistedContents) as PersistedData
    return persistedData[key]
  } catch {
    return null
  }
}

function setItem<K extends keyof PersistedData>(key: K, value: PersistedData[K]): void {
  try {
    const persistedContents = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    const persistedData = persistedContents
      ? JSON.parse(persistedContents) : {} as PersistedData
    persistedData[key] = value
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistedData))
  } catch {
    // localStorage unavailable (SSR, private browsing, quota exceeded)
  }
}

export { getItem, setItem }
