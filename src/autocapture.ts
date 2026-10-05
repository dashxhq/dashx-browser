import type { PageContext } from './EventQueue'

export type AutocaptureOptions = {
  pageviews?: boolean,
  pageleave?: boolean,
}

export type Capture = (_event: string, _data: Record<string, unknown>, _page: PageContext) => void

export const PAGEVIEW_EVENT = '$pageview'

export const PAGELEAVE_EVENT = '$pageleave'

const LOCATION_CHANGE_EVENT = 'dashx:locationchange'

let historyPatched = false

// SPA routers navigate through pushState/replaceState, which fire no event of their own. Patched
// once per page and fanned out as a window event, so several clients never stack wrappers.
function patchHistory(): void {
  if (historyPatched) return
  historyPatched = true

  for (const method of [ 'pushState', 'replaceState' ] as const) {
    const original = window.history[method]
    window.history[method] = function patched(this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args)
      window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT))
      return result
    }
  }
}

// A query-string change (filters, pagination) or an in-page anchor is the same page; a `#/` hash
// is a hash router's route.
function pageKey(location: Location): string {
  return location.pathname + (location.hash.startsWith('#/') ? location.hash : '')
}

// Routers change the URL before rendering the route that sets its title.
export const TITLE_SETTLE_MS = 300

export function pageContext(referrer: string | null): PageContext {
  return {
    url: window.location.href,
    path: window.location.pathname,
    referrer: referrer || null,
    title: document.title || null,
  }
}

export function startAutocapture(options: AutocaptureOptions, capture: Capture, flush: () => void): () => void {
  const pageviews = options.pageviews ?? true
  const pageleave = options.pageleave ?? true

  let page = pageContext(document.referrer)
  let key = pageKey(window.location)
  let enteredAt = Date.now()
  let hasLeft = false
  let pendingView: ReturnType<typeof setTimeout> | null = null

  // The title is read when the view is captured, after the new route has had time to set it.
  const captureView = () => {
    pendingView = null
    page = { ...page, title: document.title || null }
    if (pageviews) capture(PAGEVIEW_EVENT, { ...page }, page)
  }

  const flushPendingView = () => {
    if (!pendingView) return
    clearTimeout(pendingView)
    captureView()
  }

  const view = () => {
    enteredAt = Date.now()
    hasLeft = false
    pendingView = setTimeout(captureView, TITLE_SETTLE_MS)
  }

  // `pagehide` can fire more than once for a page restored from the back/forward cache.
  const leave = () => {
    flushPendingView()
    if (!pageleave || hasLeft) return
    hasLeft = true
    capture(PAGELEAVE_EVENT, { ...page, durationMs: Date.now() - enteredAt }, page)
  }

  const onLocationChange = () => {
    const nextKey = pageKey(window.location)
    if (nextKey === key) return
    leave()
    key = nextKey
    page = pageContext(page.url)
    view()
  }

  const onPageHide = () => {
    leave()
    flush()
  }

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) view()
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flushPendingView()
      flush()
    }
  }

  patchHistory()
  window.addEventListener(LOCATION_CHANGE_EVENT, onLocationChange)
  window.addEventListener('popstate', onLocationChange)
  window.addEventListener('hashchange', onLocationChange)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('pageshow', onPageShow)
  document.addEventListener('visibilitychange', onVisibilityChange)

  view()

  return () => {
    flushPendingView()
    window.removeEventListener(LOCATION_CHANGE_EVENT, onLocationChange)
    window.removeEventListener('popstate', onLocationChange)
    window.removeEventListener('hashchange', onLocationChange)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('pageshow', onPageShow)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
