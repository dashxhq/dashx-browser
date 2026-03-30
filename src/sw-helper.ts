type DashXServiceWorkerConfig = {
  publicKey: string
  targetEnvironment: string
  baseUri?: string
}

type DashXPushPayload = {
  id: string
  title?: string
  body?: string
  image?: string
  url?: string
}

// Service worker event types — kept minimal to avoid requiring webworker lib
type SWNotificationEvent = {
  notification: { close: () => void; data?: any }
  waitUntil: (_promise: Promise<any>) => void
}

type SWRegistration = {
  showNotification: (_title: string, _options?: any) => Promise<void>
}

type SWClients = {
  openWindow: (_url: string) => Promise<any>
}

function createDashXServiceWorkerHandler(config: DashXServiceWorkerConfig) {
  const baseUri = config.baseUri || 'https://api.dashx.com/graphql'

  function trackMessage(id: string, status: string) {
    return fetch(baseUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Public-Key': config.publicKey,
        'X-Target-Environment': config.targetEnvironment,
      },
      body: JSON.stringify({
        query: 'mutation TrackMessage($input: TrackMessageInput!) { trackMessage(input: $input) { success } }',
        variables: {
          input: {
            id,
            status,
            timestamp: new Date().toISOString(),
          },
        },
      }),
    }).catch(() => {
      // Network error — silently fail so SW doesn't crash
    })
  }

  function onBackgroundMessage(
    payload: any,
    registration: SWRegistration,
  ) {
    const dashxData = payload.data?.dashx
    if (!dashxData) return

    let parsed: DashXPushPayload
    try {
      parsed = JSON.parse(dashxData)
    } catch {
      return
    }

    const trackPromise = trackMessage(parsed.id, 'DELIVERED')
    const notifyPromise = registration.showNotification(parsed.title || '', {
      body: parsed.body || '',
      icon: parsed.image,
      data: { dashxNotificationId: parsed.id, url: parsed.url },
    }).catch(() => {
      // showNotification may fail if permission revoked
    })

    return Promise.all([ trackPromise, notifyPromise ])
  }

  function onNotificationClick(event: SWNotificationEvent, clients: SWClients) {
    event.notification.close()
    const { dashxNotificationId, url } = event.notification.data || {}

    if (dashxNotificationId) {
      event.waitUntil(trackMessage(dashxNotificationId, 'CLICKED') || Promise.resolve())
    }

    if (url) {
      try {
        const parsed = new URL(url)
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
          event.waitUntil(clients.openWindow(url))
        }
      } catch {
        // Invalid URL — ignore
      }
    }
  }

  function onNotificationClose(event: SWNotificationEvent) {
    const { dashxNotificationId } = event.notification.data || {}

    if (dashxNotificationId) {
      event.waitUntil(trackMessage(dashxNotificationId, 'DISMISSED') || Promise.resolve())
    }
  }

  return { onBackgroundMessage, onNotificationClick, onNotificationClose, trackMessage }
}

export default createDashXServiceWorkerHandler
export type { DashXServiceWorkerConfig, DashXPushPayload }
