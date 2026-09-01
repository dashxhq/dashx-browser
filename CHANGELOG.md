# Changelog

## 0.12.0

### Fixed

- **`screen.density` is no longer rounded.** The schema now types it as `Float`, so `generateContext` sends `devicePixelRatio` as the browser reports it (1.25, 1.5, 2.625, …) instead of collapsing every scaled display and zoomed browser onto the nearest integer. `screen.height` and `screen.width` stay `Int` and are still rounded, and a non-finite ratio still falls back to `1`.

  Requires an API that types `SystemContextScreenInput.density` as `Float`; against an older `Int` server a fractional density fails variable coercion for the whole request.

## 0.11.0

### Added

- **Push notifications honour `tag`.** `DashXPushPayload` now carries the `tag` DashX sends in its FCM payload, and both the foreground banner and the service-worker background handler pass it to `showNotification`. Two notifications sharing a tag replace one another instead of stacking — which is how a burst about one subject stays a single entry in the tray. Untagged pushes are unaffected.

  Consumers that also raise their own notifications for the same subject (e.g. `showInAppChatNotification` from a realtime message) should use the **same** tag string, or the two will not replace each other. In-app chat pushes from DashX are tagged `in_app_chat:<conversationId>`.

- **`invokeAiAgent` reports `conversationId`.** The response carries the conversation's id directly, so a caller no longer has to read it off `messages[0].conversationId` to continue the conversation with its next prompt.

### Fixed

- **Fractional screen metrics no longer break the context payload.** `generateContext` rounds `screen.density`, `screen.height` and `screen.width` before sending them. The schema types all three as `Int`, and `devicePixelRatio` is fractional on any scaled display or zoomed browser (1.25, 1.5, 2.625, …), so every call carrying context was rejected for those visitors. A non-finite value falls back to the documented default rather than propagating `NaN`.

  `locale`, `timeZone` and `userAgent` are hardened the same way. All three are non-null `String` in the schema, and a browser that reports one as `undefined` — `Intl.DateTimeFormat().resolvedOptions().timeZone` on older Safari, `navigator.language` in some embedded webviews — previously failed variable coercion for the entire request instead of falling back.

## 0.10.2

### Added

- **`setServiceWorkerRegistration(registration)`** — hand the client a service-worker registration without going through `subscribe()` or `attachForegroundMessaging()`.

  `showInAppChatNotification` prefers `new Notification()` and falls back to `registration.showNotification()` where the constructor is forbidden in the page context (notably Android Chrome). Until now every route to a registration required a Firebase `messaging` instance, so a consumer that only wants chat notifications — no push, no Firebase — had no way to supply one and got a silent no-op on those browsers.

  Pair it with a worker that handles `notificationclick` for `data.dashxInAppChat` and posts `{ source: 'dashx', type: 'IN_APP_CHAT_NOTIFICATION_CLICK', tag }` back to its clients — which is what `createDashXServiceWorkerHandler` from `sw-helper` already does.

## 0.10.0

### Removed

- **BREAKING — `startInAppChatConversation` is gone.** Creating an In-App Chat conversation is now a **server-only** operation and this SDK no longer exposes it. DashX rejects identity-token callers outright (`PermissionDenied`) and requires an `accountUid` naming the visitor — a value a browser has no authority to assert. Anything a browser could send as `data` or `issueProperties` is metadata the agent console trusts, so it must be derived by your backend, not by the client.

  **Migration.** Move creation behind your own endpoint:

  1. your client posts its *intent* (what the user is asking about) to your backend;
  2. your backend validates that intent, derives `data`/`issueProperties` itself, and calls `startInAppChatConversation` with the workspace public/private key pair — for JVM backends, `dashx-java` ≥ 1.5.0 exposes `DashX.startInAppChatConversation(input)`;
  3. it returns the `conversationId` to the client, which then uses the participation methods below.

  There is no client-side replacement, and this is deliberate. Note the old method could not have kept working regardless: `accountUid` is a required input field, so a 0.9.0-shaped request now fails schema validation before authorization is even considered.
- The `StartInAppChatConversationArgs` type is no longer exported.

### Unchanged

- Every participation method still works exactly as before, by `conversationId`: `sendInAppChatMessage`, `fetchInAppChatMessages`, `summarizeInAppChatMessages`, `fetchInAppChatConversations`, `fetchInAppChatConversation`, `summarizeInAppChatConversations`, `summarizeInAppChatUnread`, `markInAppChatConversationRead`, `resolveInAppChatConversation`, and `subscribeToChannel`. Identity tokens retain full read/send/mark-read/resolve/subscribe access — only creation moved.

## 0.9.0

### Added

- **In-App Chat unread + End chat.** Three new client methods, each threading the chat-surface `identityId`:
  - `summarizeInAppChatUnread({ identityId })` → `{ count }` — global visitor-inbound unread across every conversation the visitor owns for that chat identity (the nav badge). Same owner scope as the inbox list, so a *different* valid chat identity yields `0` rather than an error.
  - `markInAppChatConversationRead({ identityId, conversationId, lastMessageId })` → `{ success }` — marks ONE conversation read through `lastMessageId`. **`lastMessageId` is required** (see Changed). Conversation-scoped (marking A never clears B) and idempotent; the cursor only ever advances in message order, so an out-of-order call is a no-op rather than resurrecting read messages as unread.
  - `resolveInAppChatConversation({ identityId, conversationId })` → `ChatConversationSummary` — visitor-initiated "End chat": cancels the conversation's active issues and returns the **updated** summary. `ACTIVE → RESOLVED` is the only supported case; a `DRAFT` or already-terminal conversation is a safe no-op that returns its status **unchanged**, so apply the returned status as-is rather than assuming `RESOLVED`. The conversation stays replyable — a later send reopens it with a fresh issue.
- **`unreadCount` on `ChatConversationSummary`** (additive, non-null) — visitor-inbound messages sorting after the conversation's read cursor. The visitor's own messages never contribute. Returned by `fetchInAppChatConversations`, `fetchInAppChatConversation`, and `resolveInAppChatConversation`.
- **`issueProperties` on `startInAppChatConversation`** — durable, filterable issue properties (`Record<string, string | number | boolean>`), validated and type-coerced against the routed issue type at write. Distinct from `data`, which stays presentation-only metadata for the summary's `category`/`context`/`topic`.
- New exported types: `ChatIssuePropertyValue`, `SummarizeInAppChatUnreadArgs`, `MarkInAppChatConversationReadArgs`, `ResolveInAppChatConversationArgs`.

### Changed

- **BREAKING — inbox metadata filters replaced by a generic `properties` filter.** `fetchInAppChatConversations` and `summarizeInAppChatConversations` no longer accept `category`, `contextKind`, `contextSubtype`, or `contextId`. They take `properties?: Record<string, ChatIssuePropertyValue>` instead — a key→scalar equality filter matched by JSONB containment against the conversation's current non-test issues. Presentation metadata (`data`) is no longer filterable; durable filtering belongs to issue properties. **Migration:** move the four params into `properties` using the keys your `issueProperties` actually writes (e.g. `{ category: 'contextual', orderId: 'ord-99' }`). `null` is not an accepted value — omit the key.
- **BREAKING — `startInAppChatConversation` argument types now encode the first-message requirement.** `data` and `issueProperties` both attach to the conversation's first message, so the backend rejects either without `content` + `clientMessageId`. That combination is now a compile error rather than a runtime rejection: either start empty (`{ identityId, clientIdempotencyKey }`) or start with a first message (`content` + `clientMessageId`, optionally plus `data`/`issueProperties`). Passing `content` without `clientMessageId` is likewise now rejected at compile time.
- **`markInAppChatConversationRead` requires `lastMessageId`.** There is no client timestamp and no server-stamped `read_through = now()` fallback: the server resolves the id to a message it validates belongs to that conversation, then stores it as an **ordered** read cursor, and unread compares `(turnSeq, createdAt, id)` row values against it. A timestamp boundary was abandoned because chat `sentAt` values are application-generated, so a later, never-delivered message can tie or precede the marker and read as already-read. A conversation with nothing rendered yet has nothing to mark — don't call it (omitting the id fails `InvalidArgumentError`).

## 0.8.0

### Added

- **In-App Chat client methods.** Three methods on the `DashX` client for the two-way in-app chat feature, each threading the workspace's chat-surface `identityId`:
  - `startInAppChatConversation(args)` — find-or-create a chat conversation (optionally sending the first message); returns the conversation id (`{ id }`).
  - `sendInAppChatMessage(args)` — append a visitor message to a conversation.
  - `fetchInAppChatMessages(args)` — paginated message history for a conversation.

  All arguments are camelCase (`identityId`, `clientIdempotencyKey`, `conversationId`, `clientMessageId`), and these calls require a visitor identity token to be set (see `setIdentity`). New exported types: `InAppChatMessageData`, `StartInAppChatConversationArgs`, `SendInAppChatMessageArgs`, `FetchInAppChatMessagesArgs`.
- **`subscribeToChannel(channelName, handler, options?)`** — a public channel-subscribe helper. It sends a `SUBSCRIBE` frame, routes inbound `IN_APP_CHAT_MESSAGE` events to `handler` by conversation id, and automatically re-subscribes on reconnect. Returns `{ ready, unsubscribe }` where `ready` resolves on the first server ack. `unsubscribe()` now also sends an `UNSUBSCRIBE` frame so the server stops forwarding the channel (previously the SDK only stopped dispatching locally). `options.onReconnectAck` (marked `@internal`) fires on each re-ack after a reconnect.
- **`WebsocketMessage.IN_APP_CHAT_MESSAGE` and `WebsocketMessage.UNSUBSCRIBE`** added to the WebSocket message enum/type.
- **Identity token on the WebSocket handshake.** When an identity token is set, it is now included in the realtime connect URL (alongside the public key) so the server can identify the visitor for chat ownership. Connections without an identity token build the same URL as before.

### Changed

- **`setIdentity(uid?, token?)` is now arg-count-sensitive and treats an explicitly-passed `undefined` as "leave unchanged".** Semantics are now: zero args `setIdentity()` clears both uid and token (full logout); one arg `setIdentity(uid)` sets the uid and clears the token (so a caller switching identity never keeps the previous visitor's stale token); two args `setIdentity(uid, token)` apply per-argument, where `undefined` leaves that field unchanged and `null` clears it. **Behavior change:** in the two-arg form, `undefined` previously *cleared* the field — it now leaves it unchanged. This is what enables a token-only refresh, `setIdentity(undefined, newToken)`, that updates the token without wiping the account uid (previously this would have cleared the uid). The zero-arg and single-arg forms behave as before. Additionally, when the identity token actually changes while the **client-managed** WebSocket (opened via `connectWebSocket()`) is connected, that socket now reconnects so realtime re-authenticates as the new identity, and tracked chat-channel subscriptions are dropped on a token clear.
- **`reset()` now clears identity through `setIdentity()`**, so chat-channel subscriptions are dropped and the client-managed socket reconnects under the fresh anonymous identity. All prior `reset()` behavior is preserved (new anonymous uid, FCM token cleared, foreground-message listener detached, Firebase messaging reference cleared).

## 0.6.5

### Added

- **`subscribe()` now sends `metadata` in the `SubscribeContact` mutation** The shape is `{ app: { identifier }, library: { name, version } }`. `app.identifier` is `window.location.origin` (analogous to iOS bundle ID and Android package name). `library` carries `@dashx/browser` + the SDK's `package.json` version, matching what `SystemContext.library` already sends on track/identify so the browser SDK is internally consistent.

### Changed

- **`DashX.unsubscribe()` no longer throws when no FCM token is saved locally.** Previously, calling `unsubscribe()` before `subscribe()` (or after a prior `unsubscribe()` had cleared the token) rejected with `Error('No active push subscription found. Call subscribe() first.')`. It now resolves with `{ success: false }`. Promise rejections are now reserved for transport / SDK-state failures (Firebase `deleteToken` failure, GraphQL or network errors). Consumers who relied on the throw to detect "not subscribed" should branch on the `success` field instead.

## 0.6.4

### Fixed

- **`attachForegroundMessaging` now hydrates the service-worker registration.** Previously only `subscribe()` grabbed the registration (from options or `navigator.serviceWorker.ready`) — `attachForegroundMessaging` wired the Firebase listener but left `#serviceWorkerRegistration` null. That meant consumers who wired the listener at app mount (the whole point of `attachForegroundMessaging`) and then received a foreground push *before* calling `subscribe()` got the callback fire but not the system banner. The method now opportunistically resolves `navigator.serviceWorker.ready` when no registration is already cached, so the banner renders on the very first push regardless of subscribe timing.
- **Notification tap no longer force-reloads an already-at-the-target tab.** When `focusOrOpen` found a same-origin client it was calling `client.focus()` (good) followed by `client.navigate(url)` unconditionally, which caused a pointless full-page reload when the existing tab's URL already matched the target (the common case for URL-less pushes where the fallback target is the SW scope and the tab is at the app root). The reload flash made the tab switch feel like "the tab blinked" rather than "the tab became active." `navigate` now fires only when the URL actually changes, leaving pure focus switches clean.

### Added

- **`DashX.getNotificationPermission(): 'default' | 'granted' | 'denied' | 'unsupported'`** — cheap helper for gating `subscribe()` without running its internal prompt. Previously consumers had to call `subscribe` to discover the permission state, which throws if the user previously denied. Now you can call `if (DashX.getNotificationPermission() === 'granted') DashX.subscribe(...)` at mount without ever triggering the prompt or the throw.
- **Descriptive error on invalid messaging argument.** `subscribe` and `attachForegroundMessaging` now validate that the `messaging` argument exposes the expected `getToken` / `onMessage` / `deleteToken` methods and throw a clearly attributed error when it doesn't. Previously this surfaced as an opaque `TypeError: messaging.onMessage is not a function` from deep inside the listener wiring.
- **`registerServiceWorker` option on `subscribe` and `attachForegroundMessaging`.** Pass a SW path (e.g. `'/firebase-messaging-sw.js'`) and the SDK calls `navigator.serviceWorker.register(path)` internally, caches the resulting registration, and reuses it for Firebase's `getToken` and for foreground banner rendering. Previously consumers had to choose between (a) registering the SW manually at app mount before calling `attachForegroundMessaging`, (b) letting Firebase auto-register lazily inside `getToken`'s first call — which meant no SW until Subscribe was clicked, and therefore no foreground banners. The new option makes the registration part of the DashX flow directly. `SubscribeOptions.serviceWorkerRegistration` (an already-registered object) is still supported and takes precedence; `attachForegroundMessaging`'s second argument is a new `AttachForegroundMessagingOptions` object exposing both fields with the same semantics. Non-breaking: omit the new option and the previous lazy behavior is preserved.

### Changed

- **Internal consolidation of the push pipeline.** Registration hydration, payload parsing, callback dispatch, and banner rendering are now split into single-responsibility helpers (`#ensureServiceWorkerRegistration`, `#parsePushPayload`, `#dispatchToPushCallbacks`, `#renderForegroundBanner`) so every entry point (subscribe, attachForegroundMessaging, the inline `onMessage` closure) goes through the same code. Shared defaults (`DEFAULT_BASE_URI`, `TRACK_MESSAGE_STATUS`) and the `DashXPushPayload` type now live in `src/constants.ts` and `src/push-types.ts` respectively — no behavior change, no public API change, just less drift risk between the page-side and service-worker-side handlers. The `SubscribeOptions.tag` field now has an inline doc comment explaining it's forwarded verbatim to the `SubscribeContact` mutation.

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
