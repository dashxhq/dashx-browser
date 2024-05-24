import Client, { WebsocketMessage } from './Client'
import type { ClientParams, InAppNotifications, WebsocketMessageType } from './Client'

export default (params: ClientParams): Client => new Client(params)
export { WebsocketMessage }
export type { Client, ClientParams, InAppNotifications, WebsocketMessageType }
