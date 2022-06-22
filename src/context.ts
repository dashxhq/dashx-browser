import packageInfo from '../package.json'

type ContextApp = {
  name: string,
  version: string,
  build: string
}

type ContextCampaign = {
  name: string,
  source: string,
  medium: string,
  term: string,
  content: string
}

type ContextDevice = {
  uid: string,
  advertisingUid: string,
  manufacturer: string,
  model: string,
  name: string,
  type: string,
  version: string
}

type ContextLocation = {
  city: string,
  country: string,
  latitude: number,
  longitude: number,
  region: string,
  speed: number,
  direction: string
}

type ContextReferrer = {
  type: string,
  name: string,
  url: string,
  link: string
}

function getDisplayMetrics() {
  return {
    height: window.screen.height,
    width: window.screen.width
  }
}

function getLibrary() {
  return { name: packageInfo.name, version: packageInfo.version }
}

function getLocale() {
  return navigator.language
}

function getPage() {
  return {
    path: window.location.pathname,
    search: window.location.search,
    title: window.document.title,
    url: window.location.href
  }
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export type Context = {
  app?: ContextApp,
  campaign?: ContextCampaign,
  device?: ContextDevice,
  displayMetrics: ReturnType<typeof getDisplayMetrics>,
  ip?: string,
  library: ReturnType<typeof getLibrary>,
  locale: ReturnType<typeof getLocale>,
  location?: ContextLocation,
  network?: Record<string, string | number>,
  page: ReturnType<typeof getPage>,
  referrer?: ContextReferrer,
  timezone: ReturnType<typeof getTimezone>
}

export default function generateContext(): Context {
  return {
    displayMetrics: getDisplayMetrics(),
    library: getLibrary(),
    locale: getLocale(),
    page: getPage(),
    timezone: getTimezone()
  }
}
