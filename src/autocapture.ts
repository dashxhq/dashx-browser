import { describeClick, describeSubmit } from './elements'
import type { ElementData } from './elements'
import type { PageContext } from './EventQueue'

export type AutocaptureOptions = {
  pageviews?: boolean,
  pageleave?: boolean,
  clicks?: boolean,
}

export type Capture = (_event: string, _data: Record<string, unknown>, _page: PageContext) => void

export type RunningAutocapture = {
  stop: () => void,
  // The current location with autocapture's referrer: after client-side navigation that is the
  // previous route, which `document.referrer` never reflects.
  currentPage: () => PageContext,
}

export const PAGEVIEW_EVENT = '$pageview'

export const PAGELEAVE_EVENT = '$pageleave'

export const AUTOCAPTURE_EVENT = '$autocapture'

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

const keepUrl = (url: string) => url

export function pageContext(referrer: string | null, maskUrl: (_url: string) => string = keepUrl): PageContext {
  return {
    url: maskUrl(window.location.href),
    path: window.location.pathname,
    referrer: referrer ? maskUrl(referrer) : null,
    title: document.title || null,
  }
}

export function startAutocapture(
  options: AutocaptureOptions,
  capture: Capture,
  flush: () => void,
  maskUrl: (_url: string) => string = keepUrl,
): RunningAutocapture {
  const pageviews = options.pageviews ?? true
  const pageleave = options.pageleave ?? true
  const clicks = options.clicks ?? false

  let page = pageContext(document.referrer, maskUrl)
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
    page = pageContext(page.url, maskUrl)
    view()
  }

  // A query-string change is not a new page, so `page` still holds the URL from before it.
  const currentPage = (): PageContext => ({
    ...page,
    url: maskUrl(window.location.href),
    path: window.location.pathname,
    title: document.title || null,
  })

  // A click right after a navigation must not land before that page's view.
  const captureElement = (element: ElementData | null) => {
    if (!element) return
    flushPendingView()
    const current = currentPage()
    capture(AUTOCAPTURE_EVENT, { ...element, path: current.path }, current)
  }

  const onClick = (event: MouseEvent) => captureElement(describeClick(event, maskUrl))

  const onSubmit = (event: SubmitEvent) => captureElement(describeSubmit(event, maskUrl))

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
  if (clicks) {
    document.addEventListener('click', onClick, { capture: true, passive: true })
    document.addEventListener('submit', onSubmit, { capture: true, passive: true })
  }

  view()

  return {
    // A view still waiting for its title is dropped: a stop and restart inside that wait
    // (StrictMode, a remount) would otherwise record the page twice.
    stop: () => {
      if (pendingView) clearTimeout(pendingView)
      pendingView = null
      window.removeEventListener(LOCATION_CHANGE_EVENT, onLocationChange)
      window.removeEventListener('popstate', onLocationChange)
      window.removeEventListener('hashchange', onLocationChange)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('click', onClick, { capture: true })
      document.removeEventListener('submit', onSubmit, { capture: true })
    },
    currentPage,
  }
}
