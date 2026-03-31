import packageInfo from '../package.json'
import type { SystemContextInput, SystemContextLibraryInput, SystemContextScreenInput } from './generated'

function getScreenDetails(): SystemContextScreenInput {
  if (typeof window === 'undefined') {
    return { density: 1, height: 0, width: 0 }
  }
  return {
    density: window.devicePixelRatio,
    height: window.screen.height,
    width: window.screen.width,
  }
}

function getLibrary(): SystemContextLibraryInput {
  return { name: packageInfo.name, version: packageInfo.version }
}

function getLocale(): string {
  if (typeof navigator === 'undefined') return 'en-US'
  return navigator.language
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

function getUserAgent(): string {
  if (typeof navigator === 'undefined') return ''
  return navigator.userAgent
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
