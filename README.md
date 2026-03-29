<p align="center">
    <br />
    <a href="https://dashx.com"><img src="https://raw.githubusercontent.com/dashxhq/brand-book/master/assets/logo-black-text-color-icon@2x.png" alt="DashX" height="40" /></a>
    <br />
    <br />
    <strong>Your All-in-One Product Stack</strong>
</p>

<div align="center">
  <h4>
    <a href="https://dashx.com">Website</a>
    <span> | </span>
    <a href="https://docs.dashx.com/developer">Documentation</a>
  </h4>
</div>

<br />

# @dashx/browser

_DashX SDK for the Browser_

## Install

**npm**
```sh
npm install @dashx/browser
```

**yarn**
```sh
yarn add @dashx/browser
```

## Usage

For detailed usage, refer to the [documentation](https://docs.dashx.com).

### Initialize

```js
import DashX from '@dashx/browser'

const dx = DashX({
  publicKey: 'your-public-key',
  targetEnvironment: 'production',
})
```

### Identify User

```js
dx.identify('user-uid')

// Or with additional attributes
dx.identify({ uid: 'user-uid', firstName: 'John', lastName: 'Doe', email: 'john@example.com' })
```

### Push Notifications (FCM)

The SDK supports Firebase Cloud Messaging (FCM) for web push notifications.

#### Prerequisites

1. A Firebase project with Cloud Messaging enabled
2. Your VAPID key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
3. A service worker file for handling background notifications

#### Subscribe to Push Notifications

```js
import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const firebaseApp = initializeApp({ /* your Firebase config */ })
const messaging = getMessaging(firebaseApp)

// Subscribe — requests notification permission and registers the device with DashX
const contact = await dx.subscribe(messaging, { vapidKey: 'your-vapid-key' })
```

You can optionally pass a `serviceWorkerRegistration` if you manage your own service worker:

```js
const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

await dx.subscribe(messaging, {
  vapidKey: 'your-vapid-key',
  serviceWorkerRegistration: registration,
})
```

#### Handle Foreground Notifications

When the app is in the foreground, push notifications are delivered to your callback instead of being shown as system notifications:

```js
const unsubscribe = dx.onPushNotificationReceived((payload) => {
  console.log('Notification received:', payload)
  // payload: { id, title, body, image, url }
})

// Later, to stop listening:
unsubscribe()
```

#### Handle Background Notifications (Service Worker)

Create a `firebase-messaging-sw.js` file in your public directory:

```js
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  // your Firebase config
})

const messaging = firebase.messaging()

// Option 1: Using the DashX service worker helper
importScripts('./dashx-sw-helper.umd.js') // Copy from node_modules/@dashx/browser/dist/sw-helper.umd.js

const dashx = createDashXServiceWorkerHandler({
  publicKey: 'your-public-key',
  targetEnvironment: 'production',
})

messaging.onBackgroundMessage((payload) => dashx.onBackgroundMessage(payload, self.registration))
self.addEventListener('notificationclick', (event) => dashx.onNotificationClick(event, self.clients))
self.addEventListener('notificationclose', (event) => dashx.onNotificationClose(event))
```

The service worker helper automatically:
- Displays a browser notification with the title, body, and image from the DashX payload
- Tracks `DELIVERED` when the notification arrives
- Tracks `CLICKED` when the user clicks the notification (and opens the URL if provided)
- Tracks `DISMISSED` when the user dismisses the notification

```js
// Option 2: Handle manually without the helper
messaging.onBackgroundMessage((payload) => {
  const data = JSON.parse(payload.data.dashx)
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.image,
    data: { url: data.url },
  })
})
```

#### Unsubscribe

```js
await dx.unsubscribe()
```

This deletes the FCM token and unregisters the device from DashX.

## Contributing

- Make sure all the dependencies are installed:

```sh
yarn install
```

- To start dev server with hot reload:

```sh
yarn start
```

This will run a dev server that logs out errors and warnings and reloads itself on any file save.

- To create production build:

```sh
yarn build
```

- To publish package, make sure to login on npm cli and commit all the changes before running this:

```sh
yarn publish
git push origin main
```
