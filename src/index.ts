import Client, { WebsocketMessageType } from './Client'
import type { ClientParams, InAppNotificationRecipient, WebsocketMessage } from './Client'

export default (params: ClientParams): Client => new Client(params)
export { WebsocketMessageType }
export type { Client, ClientParams, InAppNotificationRecipient, WebsocketMessage }
