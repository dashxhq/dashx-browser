import Client from './Client'
import type { ClientParams } from './Client'
import type { InAppNotificationRecipient } from './Client'

export default (params: ClientParams): Client => new Client(params)
export type { Client, ClientParams, InAppNotificationRecipient }
