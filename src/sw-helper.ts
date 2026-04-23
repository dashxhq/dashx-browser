import { DEFAULT_BASE_URI, TRACK_MESSAGE_STATUS, TrackMessageStatusValue } from './constants'
import type { DashXPushPayload } from './push-types'

type DashXServiceWorkerConfig = {
  publicKey: string
  targetEnvironment: string
  baseUri?: string
}

// Service worker event types — kept minimal to avoid requiring the `webworker`
// TypeScript lib in the consumer build.
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

// Decode the DashX payload the backend encodes under `payload.data.dashx` as
// a JSON string. Returns null when the field is missing or malformed so the
// SW doesn't crash on unexpected shapes — silent fail keeps push-receipt
// resilient to backend drift. Shared helper used by both handlers so both
// paths decode the payload identically.
function parseDashXPayload(payload: any): DashXPushPayload | null {
  const raw = payload?.data?.dashx
  if (!raw) return null
  try {
    return JSON.parse(raw) as DashXPushPayload
  } catch {
    return null
  }
}

// When the push payload doesn't specify a `url`, fall back to the service
// worker's registration scope (the app root). Matches Firebase's built-in
// Chrome behavior where tapping a URL-less push opens the origin; Safari has
// no such fallback, so without this the tap is a no-op in Safari when the
// dashboard push has no explicit URL configured.
function getFallbackUrl(): string | null {
  try {
    const swGlobal = (globalThis as unknown) as { registration?: { scope?: string } }
    const scope = swGlobal.registration?.scope
    return typeof scope === 'string' && scope.length > 0 ? scope : null
  } catch {
    return null
  }
}

async function focusOrOpen(url: string, clients: SWClients): Promise<void> {
  // Try to focus an existing same-origin tab and navigate it before falling
  // back to `openWindow`. Two reasons this is the production-standard pattern:
  //   1. UX — repeat pushes shouldn't stack new tabs on top of an
  //      already-open app (Chrome's default behavior otherwise).
  //   2. Reliability on Safari, which can silently no-op `openWindow` in
  //      edge cases — a focused same-origin client succeeds consistently.
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
            // Only navigate when the existing client isn't already at the
            // target URL. Navigating to the current URL causes a pointless
            // full-page reload, which reads as "the tab flashed white" rather
            // than "the tab switched into focus." Skipping the no-op navigate
            // keeps the focus action clean.
            if (client.navigate && client.url !== url) {
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

function createDashXServiceWorkerHandler(config: DashXServiceWorkerConfig) {
  const baseUri = config.baseUri || DEFAULT_BASE_URI

  function trackMessage(id: string, status: TrackMessageStatusValue) {
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

  // Called from the Firebase-messaging `onBackgroundMessage` binding. Returns
  // a Promise so the Firebase SW wrapper can chain it into `event.waitUntil`
  // itself. DELIVERED is tracked here; the foreground path in `Client.ts`
  // tracks it in its own `onMessage` handler. Per the Firebase contract the
  // two paths are mutually exclusive — a single push fires exactly one.
  function onBackgroundMessage(payload: any, registration: SWRegistration) {
    const parsed = parseDashXPayload(payload)
    if (!parsed) return

    const trackPromise = trackMessage(parsed.id, TRACK_MESSAGE_STATUS.DELIVERED)
    const notifyPromise = registration.showNotification(parsed.title || '', {
      body: parsed.body || '',
      icon: parsed.image,
      data: { dashxNotificationId: parsed.id, url: parsed.url },
    }).catch(() => {
      // showNotification may fail if permission revoked
    })

    return Promise.all([ trackPromise, notifyPromise ])
  }

  // Invoked from `self.addEventListener('notificationclick', ...)`. Returns
  // void because tracking + navigation are wrapped internally with
  // `event.waitUntil` — consumers don't need to do anything with the return.
  function onNotificationClick(event: SWNotificationEvent, clients: SWClients) {
    event.notification.close()
    const { dashxNotificationId, url } = event.notification.data || {}

    if (dashxNotificationId) {
      event.waitUntil(trackMessage(dashxNotificationId, TRACK_MESSAGE_STATUS.CLICKED) || Promise.resolve())
    }

    const targetUrl = url || getFallbackUrl()

    if (targetUrl) {
      try {
        const parsed = new URL(targetUrl)
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
          event.waitUntil(focusOrOpen(targetUrl, clients))
        }
      } catch {
        // Invalid URL — ignore
      }
    }
  }

  // Invoked from `self.addEventListener('notificationclose', ...)`. Returns
  // void — the DISMISSED track promise is attached to `event.waitUntil`
  // internally so the SW stays alive until the request flushes.
  function onNotificationClose(event: SWNotificationEvent) {
    const { dashxNotificationId } = event.notification.data || {}

    if (dashxNotificationId) {
      event.waitUntil(trackMessage(dashxNotificationId, TRACK_MESSAGE_STATUS.DISMISSED) || Promise.resolve())
    }
  }

  return { onBackgroundMessage, onNotificationClick, onNotificationClose, trackMessage }
}

export { createDashXServiceWorkerHandler }
export type { DashXServiceWorkerConfig, DashXPushPayload }
