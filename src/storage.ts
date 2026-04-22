type PersistedData = {
  accountAnonymousUid: string,
  accountUid: string | null,
  identityToken: string | null,
  fcmToken: string | null,
}

const LOCAL_STORAGE_KEY = 'dashx-sdk'

// Returns the backing Storage object if safely accessible in this environment,
// otherwise null. Covers:
//   - server-side rendering (Node, Next.js RSC, Deno) — no `window`
//   - sandboxed iframes / Safari private mode — `window.localStorage` throws on
//     access or on first read
function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function getItem<K extends keyof PersistedData>(key: K): PersistedData[K] | null {
  const storage = getLocalStorage()
  if (!storage) return null

  try {
    const persistedContents = storage.getItem(LOCAL_STORAGE_KEY)

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
  const storage = getLocalStorage()
  if (!storage) return

  try {
    const persistedContents = storage.getItem(LOCAL_STORAGE_KEY)
    const persistedData = persistedContents
      ? JSON.parse(persistedContents) : {} as PersistedData
    persistedData[key] = value
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistedData))
  } catch {
    // storage access faulted mid-operation (quota exceeded, sandboxed iframe)
  }
}

export { getItem, setItem }
