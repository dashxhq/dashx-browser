# Changelog

## 0.6.3

### Fixed

- **Notification tap now works in Safari on URL-less pushes.** The service-worker `onNotificationClick` previously skipped navigation entirely when the payload had no `url` field. Chrome users didn't notice because Firebase's own bundled SW handler defaults to opening the app origin; Safari has no such fallback, so the tap was a silent no-op. The handler now reads `self.registration.scope` as a fallback target when the payload has no URL, matching Chrome's behavior and giving Safari parity when "Show on tap = Yes" is set but no explicit URL is configured.

## 0.6.2

### Fixed

- **Foreground push notifications are now visible by default.** Previously, when a push arrived while the app tab was focused, Firebase's `onMessage` fired and the SDK invoked `onPushNotificationReceived` callbacks — but the system banner was not shown unless the consumer explicitly rendered one from their callback. Most apps didn't, so foreground pushes looked "lost." The SDK now calls `registration.showNotification` from the page in foreground using the same shape as the background service-worker path. Consumers that render their own in-app UI can opt out with `subscribe(messaging, { showForegroundNotifications: false })`.
- **Foreground listener no longer silently dies on page reload.** `subscribe()` used to wire Firebase's `messaging.onMessage` listener only on the "new token" path — when a consumer called `subscribe()` with an unchanged FCM token (the common case on every page reload), the method early-returned before installing the listener. Firebase listeners don't survive the JS scope of a prior page load, so after a reload, foreground pushes were dropped with the tab visible (the service-worker path stayed unaffected for background pushes, which is exactly the "tab hidden works, tab active doesn't" symptom). The listener is now always wired, on both the new-token and already-subscribed paths.
- **Tab reuse on notification tap.** `onNotificationClick` now uses the standard `clients.matchAll({ type: 'window', includeUncontrolled: true })` pattern — focuses an existing same-origin tab and `client.navigate`s it to the target URL, falling back to `openWindow` only when no such tab exists. Chrome and Firefox no longer stack new tabs on top of an already-open app; Safari is also more reliable when a same-origin client already exists.

### Added

- **`DashX.attachForegroundMessaging(messaging)`** — standalone method that wires the `messaging.onMessage` listener without prompting for permission, fetching a token, or registering with DashX. Safe to call on every app mount and idempotent. This gives consumers who only call `subscribe()` behind an "Enable notifications" UI a way to keep foreground pushes flowing after a reload without rerunning the subscribe flow.

### Notes

- **Custom audio** is not supported at the SDK level. The Web Notifications API's `sound` option is ignored by Chrome and Safari, so there is no portable way to deliver a custom sound URL through the system notification. If you need a branded sound effect, add a custom field to the push payload's `data` and play it yourself from the focused tab via `new Audio(url).play()` inside your `onPushNotificationReceived` callback.

## 0.6.1

### Fixed

- **SSR-safety for `storage.ts`.** Importing `@dashx/browser` in a server-rendered context (Next.js RSC, `getServerSideProps`, Remix loaders, Deno, plain Node) no longer risks crashing on `window` access. `getItem` / `setItem` now early-bail on `typeof window === 'undefined'` and tolerate `window.localStorage` access faulting (Safari private mode, sandboxed iframes). Client construction is now fully SSR-safe: `DashX.configure(...)` on the server returns a Client that holds identity in memory for the request, then rehydrates from `localStorage` on the client after hydration.

## 0.5.0

### Breaking Changes

- **Default export is now a singleton object.** The default export was a factory function (`DashX({ publicKey: '...' })`). It is now a singleton with `DashX.configure()`.

  **Before:**
  ```js
  import DashX from '@dashx/browser'
  const client = DashX({ publicKey: '...', targetEnvironment: '...' })
  client.track('Event')
  ```

  **After:**
  ```js
  import DashX from '@dashx/browser'
  DashX.configure({ publicKey: '...', targetEnvironment: '...' })
  DashX.track('Event')
  ```

  Use `DashX.createClient()` if you need multiple independent instances.

- **`trackNotification()` renamed to `trackMessage()`.** The method signature is unchanged — only the name changed to align with the backend GraphQL API.

- **`identify()` no longer swallows errors.** Previously, the promise always resolved (returning the error array as data on failure). It now rejects on error, consistent with all other SDK methods.

### Added

- **FCM web push notifications.** New methods: `subscribe()`, `unsubscribe()`, `onPushNotificationReceived()`.
- **Service worker helper** (`@dashx/browser/sw`) for handling background push notifications with automatic delivery, click, and dismiss tracking.
- **Singleton API** (`DashX.configure()` + `DashX.method()`) matching the iOS, Android, and React Native SDKs.
- **`createClient()`** for creating independent client instances.
- Re-exported `ContactKind`, `ContactStatus`, and `TrackMessageStatus` types.

### Fixed

- `localStorage` access now wrapped in try-catch — no more crashes in SSR, Safari private browsing, or when storage quota is exceeded.
- Browser API access (`window`, `navigator`) guarded for SSR/Node compatibility.
- `fetchInAppNotifications()` now properly returns a Promise (was fire-and-forget).
- `watchFetchInAppNotifications()` and `watchFetchInAppNotificationsAggregate()` now return unsubscribe functions to prevent memory leaks.
- `subscribe()` race condition — concurrent calls no longer cause double-registration.
- WebSocket `handleOnline` reconnection race — clears pending reconnect timer before connecting.
- Service worker helper validates URL protocol before opening (prevents `javascript:` / `data:` URLs).

### Changed

- `TrackNotification` GraphQL operation replaced by `TrackMessage` (backend schema change).
- `NotificationFragment` renamed to `MessageFragment` (backend schema change).
- `IdentityAccount.gql` renamed to `IdentifyAccount.gql` (filename now matches operation name).

## 0.4.14

- Improve logging and WebSocket handling.
- Add nonce to PING and PONG message types.
