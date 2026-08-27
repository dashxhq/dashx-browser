import packageInfo from '../package.json'
import type { SystemContextInput, SystemContextLibraryInput, SystemContextScreenInput } from './generated'

// The GraphQL schema types every screen dimension as Int, so fractional values
// (devicePixelRatio is 1.25/1.5/2.625/... under display scaling or browser zoom)
// must be rounded before they reach the API.
function toInt(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.round(value) : fallback
}

// Non-null String in the schema. TS types these as `string`, but browsers can report
// undefined (Intl timeZone on older Safari), which fails coercion for the whole request.
function toText(value: string | undefined | null, fallback: string): string {
  return typeof value === 'string' && value !== '' ? value : fallback
}

function getScreenDetails(): SystemContextScreenInput {
  if (typeof window === 'undefined') {
    return { density: 1, height: 0, width: 0 }
  }
  return {
    density: toInt(window.devicePixelRatio, 1),
    height: toInt(window.screen.height, 0),
    width: toInt(window.screen.width, 0),
  }
}

function getLibrary(): SystemContextLibraryInput {
  return { name: packageInfo.name, version: packageInfo.version }
}

function getLocale(): string {
  if (typeof navigator === 'undefined') return 'en-US'
  return toText(navigator.language, 'en-US')
}

function getTimezone(): string {
  try {
    return toText(Intl.DateTimeFormat().resolvedOptions().timeZone, 'UTC')
  } catch {
    return 'UTC'
  }
}

function getUserAgent(): string {
  if (typeof navigator === 'undefined') return ''
  return toText(navigator.userAgent, '')
}

// TODO: This should be filled in by the API server
function getIpV4(): string {
  return 'NA'
}

export default function generateContext(): SystemContextInput {
  return {
    ipV4: getIpV4(),
    userAgent: getUserAgent(),
    screen: getScreenDetails(),
    library: getLibrary(),
    locale: getLocale(),
    timeZone: getTimezone(),
  }
}
