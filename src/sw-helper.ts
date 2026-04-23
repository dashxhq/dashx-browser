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

type SWWindowClient = {
  url: string
  focused?: boolean
  focus: () => Promise<SWWindowClient>
  navigate?: (_url: string) => Promise<SWWindowClient | null>
}

type SWClients = {
  matchAll?: (_options?: { type?: string; includeUncontrolled?: boolean }) => Promise<SWWindowClient[]>
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

  async function focusOrOpen(url: string, clients: SWClients): Promise<void> {
    // Try to focus an existing same-origin tab and navigate it. This is the
    // pattern every production web push integration uses for two reasons:
    //   1. Safari's SW implementation does not reliably honor
    //      `clients.openWindow` when there's no existing client of the origin
    //      — the call resolves with `null` and nothing visible happens. Focus
    //      + navigate of an already-open tab works consistently.
    //   2. UX — repeat pushes shouldn't stack new tabs on top of an
    //      already-open app (Chrome does this today by default).
    const target = new URL(url)

    if (clients.matchAll) {
      try {
        const windowClients = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        })

        for (const client of windowClients) {
          try {
            if (new URL(client.url).origin === target.origin) {
              await client.focus()
              if (client.navigate) {
                await client.navigate(url)
              }
              return
            }
          } catch {
            // Malformed client.url — skip this client and try the next.
          }
        }
      } catch {
        // matchAll is unavailable or rejected — fall through to openWindow.
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(url)
    }
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
          event.waitUntil(focusOrOpen(url, clients))
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

export { createDashXServiceWorkerHandler }
export type { DashXServiceWorkerConfig, DashXPushPayload }
