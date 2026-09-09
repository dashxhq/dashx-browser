import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Client, WebsocketMessage } from '../src/index'

// Rejections that escape the SDK land in the host app's error reporter as
// "unhandled promise rejection" noise, which is what these paths exist to prevent.
let unhandled: unknown[] = []
const recordUnhandled = (_event: PromiseRejectionEvent | unknown) => {
  unhandled.push(_event)
}

function makeClient() {
  const client = new Client({ publicKey: 'pk_test', targetEnvironment: 'test' })
  client.setIdentity('user-1', 'token-1')
  return client
}

// Drain microtasks so a rejection handled one tick later still counts as handled.
const flush = () => new Promise((resolve) => { setTimeout(resolve, 0) })

beforeEach(() => {
  window.localStorage.clear()
  unhandled = []
  window.addEventListener('unhandledrejection', recordUnhandled)
})

afterEach(() => {
  window.removeEventListener('unhandledrejection', recordUnhandled)
  vi.restoreAllMocks()
})

describe('refetchWatchedQueries', () => {
  it('logs a rejected refetch instead of letting it escape', async () => {
    const client = makeClient()
    const logged = vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})

    client.registerWatchedQuery(() => Promise.reject(new Error('Failed to fetch')), 'aggregate')
    ;(client as any).refetchWatchedQueries()
    await flush()

    expect(unhandled).toEqual([])
    expect(logged).toHaveBeenCalledWith('Error refetching aggregate:', expect.any(Error))
  })

  it('logs a refetch that throws synchronously', async () => {
    const client = makeClient()
    const logged = vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})

    client.registerWatchedQuery(() => { throw new Error('boom') }, 'sync-thrower')
    expect(() => (client as any).refetchWatchedQueries()).not.toThrow()
    await flush()

    expect(unhandled).toEqual([])
    expect(logged).toHaveBeenCalledWith('Error refetching sync-thrower:', expect.any(Error))
  })

  it('still accepts a void-returning callback', async () => {
    const client = makeClient()
    const refetch = vi.fn()

    client.registerWatchedQuery(refetch, 'void-callback')
    ;(client as any).refetchWatchedQueries()
    await flush()

    expect(refetch).toHaveBeenCalledTimes(1)
    expect(unhandled).toEqual([])
  })

  it('invokes the callback synchronously so pre-refetch state resets in the same tick', () => {
    const client = makeClient()
    let calledDuring = false

    client.registerWatchedQuery(() => { calledDuring = true }, 'ordering')
    ;(client as any).refetchWatchedQueries()

    expect(calledDuring).toBe(true)
  })

  it('one rejecting query does not stop the others from refetching', async () => {
    const client = makeClient()
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    const second = vi.fn()

    client.registerWatchedQuery(() => Promise.reject(new Error('nope')), 'first')
    client.registerWatchedQuery(second, 'second')
    ;(client as any).refetchWatchedQueries()
    await flush()

    expect(second).toHaveBeenCalledTimes(1)
    expect(unhandled).toEqual([])
  })

  it('unregisterWatchedQuery stops the query being refetched', async () => {
    const client = makeClient()
    const refetch = vi.fn()

    client.registerWatchedQuery(refetch, 'removed')
    client.unregisterWatchedQuery('removed')
    ;(client as any).refetchWatchedQueries()
    await flush()

    expect(refetch).not.toHaveBeenCalled()
  })
})

describe('watchFetchInAppMessagesAggregate', () => {
  function stubWatchQuery(client: Client) {
    let emit: (_response: any) => void = () => {}
    let fail: (_error: any) => void = () => {}
    const refetch = vi.fn().mockResolvedValue(undefined)
    ;(client as any).graphqlClient = {
      watchQuery: vi.fn(() => ({
        refetch,
        subscribe: ({ next, error }: any) => {
          emit = next
          fail = error
          return { unsubscribe: vi.fn() }
        },
      })),
    }
    return { emit: (_r: any) => emit(_r), fail: (_e: any) => fail(_e), refetch }
  }

  it('reports a real count', () => {
    const client = makeClient()
    const harness = stubWatchQuery(client)
    const callback = vi.fn()

    client.watchFetchInAppMessagesAggregate(callback)
    harness.emit({ data: { messagesAggregate: { count: 4 } } })

    expect(callback).toHaveBeenCalledWith(4)
  })

  it('reports zero when the server genuinely says zero', () => {
    const client = makeClient()
    const harness = stubWatchQuery(client)
    const callback = vi.fn()

    client.watchFetchInAppMessagesAggregate(callback)
    harness.emit({ data: { messagesAggregate: { count: 0 } } })

    expect(callback).toHaveBeenCalledWith(0)
  })

  it('keeps the last known count when a failed refetch emits without data', () => {
    const client = makeClient()
    const harness = stubWatchQuery(client)
    const callback = vi.fn()

    client.watchFetchInAppMessagesAggregate(callback)
    harness.emit({ data: { messagesAggregate: { count: 3 } } })
    callback.mockClear()

    // Shapes a mid-flight failure can produce: no data, and data without the aggregate.
    harness.emit({ data: undefined })
    harness.emit({ data: {} })
    harness.emit({ data: { messagesAggregate: undefined } })

    expect(callback).not.toHaveBeenCalled()
  })

  it('reports zero on a hard subscription error', () => {
    const client = makeClient()
    const harness = stubWatchQuery(client)
    const callback = vi.fn()
    vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})

    client.watchFetchInAppMessagesAggregate(callback)
    harness.fail(new Error('Failed to fetch'))

    expect(callback).toHaveBeenCalledWith(0)
  })
})

describe('delivery tracking on an inbound in-app message', () => {
  function deliver(client: Client) {
    ;(client as any).handleWebSocketMessage({
      type: WebsocketMessage.IN_APP_MESSAGE,
      data: { id: 'msg-1' },
    })
  }

  it('logs a rejected trackMessage instead of letting it escape', async () => {
    const client = makeClient()
    const logged = vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    ;(client as any).trackMessage = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    ;(client as any).addInAppMessageToCache = vi.fn()

    deliver(client)
    await flush()

    expect(unhandled).toEqual([])
    expect(logged).toHaveBeenCalledWith('Failed to track in-app message delivery:', expect.any(Error))
  })

  it('logs a trackMessage that throws synchronously', async () => {
    const client = makeClient()
    const logged = vi.spyOn((client as any).logger, 'error').mockImplementation(() => {})
    ;(client as any).trackMessage = vi.fn(() => { throw new Error('not identified') })
    ;(client as any).addInAppMessageToCache = vi.fn()

    expect(() => deliver(client)).not.toThrow()
    await flush()

    expect(unhandled).toEqual([])
    expect(logged).toHaveBeenCalledWith('Failed to track in-app message delivery:', expect.any(Error))
  })

  it('tolerates a trackMessage stub that returns nothing', async () => {
    const client = makeClient()
    ;(client as any).trackMessage = vi.fn()
    ;(client as any).addInAppMessageToCache = vi.fn()

    expect(() => deliver(client)).not.toThrow()
    await flush()

    expect(unhandled).toEqual([])
  })
})
