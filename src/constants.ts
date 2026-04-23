// Shared defaults and string unions for the push / tracking contract.
// Both `Client.ts` (the main SDK bundle) and `sw-helper.ts` (the service-worker
// bundle, compiled separately) import from here so the production API base
// and tracking status strings live in one place and can't drift.

export const DEFAULT_BASE_URI = 'https://api.dashx.com/graphql'

// String constants for `trackMessage` status values. Kept as a `const` object
// (not a TS enum) so emitted JS stays minimal and the values are usable as
// plain strings at callsites. Matches the `TrackMessageStatus` union in
// `./generated` verbatim — the generated type is the public, re-exported one
// (see `index.ts`), these constants are the internal typo-safe aliases.
export const TRACK_MESSAGE_STATUS = {
  DELIVERED: 'DELIVERED',
  CLICKED: 'CLICKED',
  DISMISSED: 'DISMISSED',
} as const

export type TrackMessageStatusValue = typeof TRACK_MESSAGE_STATUS[keyof typeof TRACK_MESSAGE_STATUS]
