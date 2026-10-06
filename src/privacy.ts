import type { SystemContextInput } from './generated'

// Ad-click and cross-site ids that identify the visitor, not the campaign.
export const PERSONAL_DATA_URL_PARAMS = [
  'gclid',
  'gclsrc',
  'dclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'twclid',
  'li_fat_id',
  'igshid',
  'ttclid',
  'rdt_cid',
  'epik',
  'qclid',
  'sccid',
  'irclid',
  '_kx',
] as const

export const MASKED = '<masked>'

export type CapturedEvent = {
  event: string,
  data?: unknown,
  timestamp?: string,
  accountUid: string | null,
  accountAnonymousUid: string | null,
  systemContext: SystemContextInput,
}

export type BeforeSend = (_event: CapturedEvent) => CapturedEvent | null

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Rewrites only the query string, so the rest of the URL keeps its original encoding.
export function maskQueryParams(url: string, params: readonly string[]): string {
  if (!params.length) return url

  const hashAt = url.indexOf('#')
  const queryEnd = hashAt === -1 ? url.length : hashAt
  const queryStart = url.indexOf('?')
  if (queryStart === -1 || queryStart > queryEnd) return url

  const names = params.map(escapeRegExp).join('|')
  const query = url
    .slice(queryStart, queryEnd)
    .replace(new RegExp(`([?&](?:${names})=)[^&]*`, 'g'), `$1${MASKED}`)
  return url.slice(0, queryStart) + query + url.slice(queryEnd)
}

export function runBeforeSend<T extends CapturedEvent>(event: T, beforeSend?: BeforeSend | BeforeSend[]): T | null {
  let result: T = event
  for (const fn of [ beforeSend ?? [] ].flat()) {
    const next = fn(result)
    if (next == null) return null
    result = next as T
  }
  return result
}
