import { describe, expect, it, vi } from 'vitest'

import SearchRecordsInputBuilder from '../src/SearchRecordsInputBuilder'

describe('SearchRecordsInputBuilder', () => {
  it('returns itself from every chainable setter', () => {
    const builder = new SearchRecordsInputBuilder('articles', async () => [])

    expect(builder.limit(10)).toBe(builder)
    expect(builder.filter({ status: { equals: 'published' } })).toBe(builder)
    expect(builder.order([{ createdAt: 'DESC' }])).toBe(builder)
    expect(builder.language('en')).toBe(builder)
    expect(builder.fields([ 'title', 'body' ])).toBe(builder)
    expect(builder.include([ 'author' ])).toBe(builder)
    expect(builder.exclude([ 'draft' ])).toBe(builder)
    expect(builder.preview()).toBe(builder)
  })

  it('all() invokes the callback with the accumulated options', async () => {
    const callback = vi.fn(async () => [{ id: 1 }, { id: 2 }])
    const builder = new SearchRecordsInputBuilder('articles', callback)

    const data = await builder.limit(5).language('en').all()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'articles',
      limit: 5,
      language: 'en',
    }))
    expect(data).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('all(withOptions) merges passed options over accumulated ones', async () => {
    const callback = vi.fn(async (opts) => opts)
    const builder = new SearchRecordsInputBuilder('articles', callback)

    await builder.limit(5).all({ limit: 20, preview: true })

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'articles',
      limit: 20,
      preview: true,
    }))
  })

  it('one() returns the first element when callback resolves to a non-empty array', async () => {
    const callback = vi.fn(async () => [{ id: 'first' }, { id: 'second' }])
    const builder = new SearchRecordsInputBuilder('articles', callback)

    const record = await builder.one()
    expect(record).toEqual({ id: 'first' })
  })

  it('one() returns null when the callback resolves to an empty array', async () => {
    const callback = vi.fn(async () => [])
    const builder = new SearchRecordsInputBuilder('articles', callback)

    const record = await builder.one()
    expect(record).toBeNull()
  })

  it('one() returns null when the callback resolves to a non-array value', async () => {
    const callback = vi.fn(async () => null)
    const builder = new SearchRecordsInputBuilder('articles', callback)

    const record = await builder.one()
    expect(record).toBeNull()
  })

  it('preview() defaults to true when called without an argument', async () => {
    const callback = vi.fn(async (opts) => opts)
    const builder = new SearchRecordsInputBuilder('articles', callback)

    await builder.preview().all()
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ preview: true }))
  })

  it('preview(false) disables preview', async () => {
    const callback = vi.fn(async (opts) => opts)
    const builder = new SearchRecordsInputBuilder('articles', callback)

    await builder.preview(false).all()
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ preview: false }))
  })

  it('filter(undefined) resets filters to an empty object', async () => {
    const callback = vi.fn(async (opts) => opts)
    const builder = new SearchRecordsInputBuilder('articles', callback)

    await builder.filter(undefined).all()
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ filter: {} }))
  })
})
