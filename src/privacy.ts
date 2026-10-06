import type { SystemContextInput } from './generated'
import { createLogger } from './logging'

const logger = createLogger('PRIVACY')

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

// Also covers a hash router's query (`#/route?gclid=...`). Only the masked values change, so the
// rest of the URL keeps its original encoding.
export function maskQueryParams(url: string, params: readonly string[]): string {
  if (!params.length) return url

  const names = params.map(escapeRegExp).join('|')
  return url.replace(new RegExp(`([?&](?:${names})=)[^&#]*`, 'gi'), `$1${MASKED}`)
}

export function runBeforeSend<T extends CapturedEvent>(event: T, beforeSend?: BeforeSend | BeforeSend[]): T | null {
  let result: T = event
  for (const fn of [ beforeSend ?? [] ].flat()) {
    let next: CapturedEvent | null
    try {
      next = fn(result)
    } catch (error) {
      // Sending the unedited event would leak whatever the hook was meant to remove.
      logger.error(`beforeSend threw for '${event.event}'; the event was dropped:`, error)
      return null
    }
    if (next == null) return null
    result = next as T
  }
  return result
}
