import Client from './Client'
import type { ClientParams } from './Client'

export default (params: ClientParams): Client => new Client(params)
