type PersistedData = {
  accountAnonymousUid: string
}

const LOCAL_STORAGE_KEY = 'dashx-sdk'

function getItem<K extends keyof PersistedData>(key: K): PersistedData[K] | null {
  const persistedContents = window.localStorage.getItem(LOCAL_STORAGE_KEY)

  if (!persistedContents) {
    return null
  }

  const persistedData = JSON.parse(persistedContents) as PersistedData
  return persistedData[key]
}

function setItem<K extends keyof PersistedData>(key: K, value: PersistedData[K]): void {
  const persistedContents = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  const persistedData = persistedContents
    ? JSON.parse(persistedContents) : {} as PersistedData
  persistedData[key] = value
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistedData))
}

export { getItem, setItem }
