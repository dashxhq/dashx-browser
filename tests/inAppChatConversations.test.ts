import { beforeEach, describe, expect, it, vi } from 'vitest'

import Client from '../src/Client'

// Minimal generic summary row (matches the wire contract's required fields).
type Summary = {
  conversationId: string,
  category: string,
  context: unknown,
  topic: unknown,
  status: string,
  title: string,
  lastMessagePreview: string | null,
  lastMessageAt: string | null,
  lastSenderKind: string | null,
  activityAt: string,
  assignedGroups: { id: string, name: string }[],
}

function summary(id: string, over: Partial<Summary> = {}): Summary {
  return {
    conversationId: id,
    category: 'general',
    context: null,
    topic: null,
    status: 'ACTIVE',
    title: 'Support',
    lastMessagePreview: null,
    lastMessageAt: null,
    lastSenderKind: null,
    activityAt: '2026-01-01T00:00:00Z',
    assignedGroups: [],
    ...over,
  }
}

function opName(document: any): string {
  return document.definitions.find((d: any) => d.kind === 'OperationDefinition').name.value
}

// A client whose graphqlClient.query is backed by ONE in-memory dataset, so
// `fetch` (a paged slice) and `summarize` ({ count }) are answered from the
// same rows — the only way an SDK-level fetch+count parity test is meaningful.
function makeClient(dataset: Summary[] = []) {
  const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
  const query = vi.fn(async (opts: any) => {
    const name = opName(opts.query)
    const v = opts.variables ?? {}
    switch (name) {
      case 'FetchInAppChatConversations': {
        const limit = v.limit ?? 20
        const page = v.page ?? 1
        const start = (page - 1) * limit
        return { data: { fetchInAppChatConversations: dataset.slice(start, start + limit) } }
      }
      case 'SummarizeInAppChatConversations':
        return { data: { summarizeInAppChatConversations: { count: dataset.length } } }
      case 'FetchInAppChatConversation':
        return { data: { fetchInAppChatConversation: dataset.find((s) => s.conversationId === v.conversationId) ?? null } }
      case 'SummarizeInAppChatMessages':
        return { data: { summarizeInAppChatMessages: { count: 7 } } }
      default:
        throw new Error(`unexpected operation ${name}`)
    }
  })
  ;(client as any).graphqlClient = { query }
  return { client, query }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('fetchInAppChatConversations', () => {
  it('forwards identity, limit/page, and every generic filter verbatim', async () => {
    const { client, query } = makeClient([ summary('c1') ])

    await client.fetchInAppChatConversations({
      identityId: 'id-1',
      limit: 10,
      page: 2,
      statuses: [ 'DRAFT', 'ACTIVE' ],
      category: 'contextual',
      contextKind: 'order',
      contextSubtype: 'medicine',
      contextId: 'ord-99',
    })

    expect(query).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[0][0].variables).toEqual({
      identityId: 'id-1',
      limit: 10,
      page: 2,
      statuses: [ 'DRAFT', 'ACTIVE' ],
      category: 'contextual',
      contextKind: 'order',
      contextSubtype: 'medicine',
      contextId: 'ord-99',
    })
    expect(query.mock.calls[0][0].fetchPolicy).toBe('network-only')
  })

  it('returns the summary array, and [] when the field is absent', async () => {
    const { client } = makeClient([ summary('c1'), summary('c2') ])
    const rows = await client.fetchInAppChatConversations({ identityId: 'id-1' })
    expect(rows.map((r) => r.conversationId)).toEqual([ 'c1', 'c2' ])

    // Missing data field → empty array (never throws).
    const bare = makeClient()
    ;(bare.client as any).graphqlClient = { query: vi.fn().mockResolvedValue({ data: {} }) }
    expect(await bare.client.fetchInAppChatConversations({ identityId: 'id-1' })).toEqual([])
  })
})

describe('summarizeInAppChatConversations', () => {
  it('forwards the same filters as the list, minus limit/page, and returns { count }', async () => {
    const { client, query } = makeClient([ summary('c1'), summary('c2'), summary('c3') ])

    const result = await client.summarizeInAppChatConversations({
      identityId: 'id-1',
      statuses: [ 'ACTIVE' ],
      category: 'contextual',
      contextKind: 'order',
      contextSubtype: 'medicine',
      contextId: 'ord-99',
    })

    expect(result).toEqual({ count: 3 })
    const vars = query.mock.calls[0][0].variables
    expect(vars).not.toHaveProperty('limit')
    expect(vars).not.toHaveProperty('page')
    expect(vars).toMatchObject({
      identityId: 'id-1',
      statuses: [ 'ACTIVE' ],
      category: 'contextual',
      contextKind: 'order',
      contextSubtype: 'medicine',
      contextId: 'ord-99',
    })
  })
})

describe('inbox fetch + count parity [C-inboxcount]', () => {
  it('summarized count equals a complete filtered fetch traversal (no gap/dupe)', async () => {
    // 25 rows, fixed client page size 10 → pages 1..3 (10, 10, 5).
    const dataset = Array.from({ length: 25 }, (_v, i) => summary(`c${i}`))
    const { client } = makeClient(dataset)
    const pageSize = 10

    const { count } = await client.summarizeInAppChatConversations({ identityId: 'id-1' })

    // Page using the SDK contract `hasNextPage = page * pageSize < count`.
    const collected: string[] = []
    let page = 1
    while ((page - 1) * pageSize < count) {
      const rows = await client.fetchInAppChatConversations({ identityId: 'id-1', limit: pageSize, page })
      collected.push(...rows.map((r) => r.conversationId))
      page += 1
    }

    expect(count).toBe(25)
    expect(collected).toHaveLength(count)
    expect(new Set(collected).size).toBe(count) // every conversation once, none missed
  })
})

describe('fetchInAppChatConversation (single summary)', () => {
  it('forwards identityId + conversationId and returns the matching summary', async () => {
    const { client, query } = makeClient([ summary('c1'), summary('c2', { status: 'RESOLVED' }) ])

    const result = await client.fetchInAppChatConversation({ identityId: 'id-1', conversationId: 'c2' })

    expect(result.conversationId).toBe('c2')
    expect(result.status).toBe('RESOLVED')
    expect(query.mock.calls[0][0].variables).toEqual({ identityId: 'id-1', conversationId: 'c2' })
  })
})

describe('summarizeInAppChatMessages', () => {
  it('forwards conversationId and returns { count }', async () => {
    const { client, query } = makeClient()

    const result = await client.summarizeInAppChatMessages({ conversationId: 'conv-1' })

    expect(result).toEqual({ count: 7 })
    expect(query.mock.calls[0][0].variables).toEqual({ conversationId: 'conv-1' })
  })
})
