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
    <a href="https://docs.dashx.com">Documentation</a>
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

For detailed documentation, visit [JavaScript documentation](https://docs.dashx.com/sdks/client-side/javascript-sdk).

### Autocapture

Page view autocapture is opt-in. Turn it on when configuring the SDK:

```js
import DashX from '@dashx/browser'

DashX.configure({
  publicKey: 'YOUR_PUBLIC_KEY',
  targetEnvironment: 'production',
  autocapture: true,
})
```

or start and stop it at runtime:

```js
DashX.startAutocapture()
DashX.stopAutocapture()
```

Two events are captured:

| Event | When | Data |
| --- | --- | --- |
| `$pageview` | On load and on every client-side navigation (`pushState`, `replaceState`, back/forward, `#/` hash-router routes) | `url`, `path`, `referrer`, `title` |
| `$pageleave` | When the visitor navigates to another page or the tab is hidden or closed | `url`, `path`, `referrer`, `title`, `durationMs` |

A change to only the query string or an in-page anchor is not a new page. A page view is recorded 300ms after the navigation, so `title` is the new route's. Pass `{ pageviews: false }` or `{ pageleave: false }` instead of `true` to turn either event off:

```js
DashX.configure({ ..., autocapture: { pageleave: false } })
```

Events are sent in batches every 5 seconds or 20 events, and the last batch is flushed with `fetch(..., { keepalive: true })` when the page is hidden.

#### Sessions and campaigns

Every event sent from the browser, autocaptured or with `DashX.track()`, carries `systemContext.page` and a `systemContext.sessionId`. A session ends after 30 minutes without a tracked event, and on `DashX.reset()`. It is shared across tabs of the same site.

`utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `utm_content` on the landing URL fill `systemContext.campaign` for every event in that session, including after client-side navigation drops them from the URL.

#### Privacy

URLs and referrers are sent in full, query string included. To keep personal data out of them:

```js
DashX.configure({
  ...,
  // Replaces ad-click ids (gclid, fbclid, msclkid and similar) with `<masked>`.
  maskPersonalDataProperties: true,
  // Masks these query parameters too; only applies with maskPersonalDataProperties.
  customPersonalDataProperties: ['token', 'email'],
  // Runs on every event before it is sent. Return the event, edited as needed, or null to drop it.
  beforeSend: (event) => {
    if (event.event === '$pageleave') return null
    return event
  },
})
```

`beforeSend` also accepts an array of functions, run in order; the first to return `null` drops the event, and a function that throws drops it too. It applies to `DashX.track()` too, where a dropped call resolves to `undefined`.

## Contributing

- Make sure all the dependencies are installed:

```sh
yarn install
```

- To start dev server with hot reload:

```sh
yarn dev
```

- To create production build:

```sh
yarn build
```

- To publish package, make sure to login on npm cli and commit all the changes before running this:

```sh
yarn publish
git push origin main
```
