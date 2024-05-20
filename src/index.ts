import Client, { WebsocketMessageType } from './Client'
import type { ClientParams, InAppNotification, WebsocketMessage } from './Client'

export default (params: ClientParams): Client => new Client(params)
export { WebsocketMessageType }
export type { Client, ClientParams, InAppNotification, WebsocketMessage }
