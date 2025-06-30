import type { FetchRecordInput, SearchRecordsInput } from './generated'

export type SearchRecordsOptions = Omit<SearchRecordsInput, 'resource' | 'order'> & {
  order?: Record<string, 'ASC' | 'DESC'>[],
}

export type FetchRecordsOptions = Omit<FetchRecordInput, 'resource' | 'recordId'>

class SearchRecordsInputBuilder {
  private options: SearchRecordsOptions

  private callback: (_options: SearchRecordsOptions) => Promise<any>

  constructor(
    _resource: string,
    _callback: (_options: any) => Promise<any>,
  ) {
    // @ts-ignore
    this.options = { resource: _resource }
    this.callback = _callback
  }

  limit(by: SearchRecordsOptions['limit']) {
    this.options.limit = by
    return this
  }

  filter(by: SearchRecordsOptions['filter']) {
    this.options.filter = by || {}
    return this
  }

  order(by: SearchRecordsOptions['order']) {
    this.options.order = by
    return this
  }

  language(to: SearchRecordsOptions['language']) {
    this.options.language = to
    return this
  }

  fields(identifiers: SearchRecordsOptions['fields']) {
    this.options.fields = identifiers
    return this
  }

  include(identifiers: SearchRecordsOptions['include']) {
    this.options.include = identifiers
    return this
  }

  exclude(identifiers: SearchRecordsOptions['exclude']) {
    this.options.exclude = identifiers
    return this
  }

  preview(value = true) {
    this.options.preview = value
    return this
  }

  async all(_withOptions?: SearchRecordsOptions) {
    this.options = { ...this.options, ..._withOptions }
    const data = await this.callback(this.options)
    return data
  }

  async one(withOptions?: SearchRecordsOptions) {
    this.options = { ...this.options, ...withOptions }
    const data = await this.callback(this.options)

    if (Array.isArray(data) && data.length) {
      return data[0]
    }

    return null
  }

  withOptions(_options: any) {
    // ... existing code ...
  }
}

export default SearchRecordsInputBuilder
