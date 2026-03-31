# Changelog

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
