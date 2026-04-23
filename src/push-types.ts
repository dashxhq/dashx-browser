// The decoded DashX push payload, shared between the page-side foreground
// handler (`Client.ts`) and the service-worker-side background handler
// (`sw-helper.ts`). Both decode the same `data.dashx` JSON blob the backend
// sends, so they must agree on shape — duplication here is a silent drift
// risk we'd rather avoid.

export type DashXPushPayload = {
  id: string
  title?: string
  body?: string
  image?: string
  url?: string
}
