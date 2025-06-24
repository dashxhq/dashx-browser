import { useEffect, useState } from "react"
import toast from 'react-hot-toast'
import { WebsocketMessage, DASHX_CLOSE_CODES } from '@dashx/browser'
import type { InAppNotifications, WebsocketMessageType } from '@dashx/browser'

import useDashXProvider from "./use-dashx-provider"

type UseInAppHookResponse = {
  notifications: InAppNotifications,
  unreadNotificationsCount: number | null,
  fetchInAppNotifications: () => void,
  markNotificationAsRead: (id: string) => Promise<any>,
  markNotificationAsUnread: (id: string) => Promise<any>,
}

const useInApp = (): UseInAppHookResponse => {
  let dashX = useDashXProvider()
  const [notifications, setNotifications] = useState<InAppNotifications>([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number | null>(null)

  const markNotificationAsRead = (id: string) => dashX.trackNotification({ id, status: 'READ' })

  const markNotificationAsUnread = async (id: string) => dashX.trackNotification({ id, status: 'UNREAD' })

  const fetchInAppNotifications = () => dashX.fetchInAppNotifications()

  useEffect(() =>{
    dashX.watchFetchInAppNotifications(setNotifications)
    dashX.watchFetchInAppNotificationsAggregate(setUnreadNotificationsCount)
  }, [])

  useEffect(() => {
    // Create WebSocket connection using the new dashx-browser WebSocketManager
    const wsManager = dashX.createWebSocketConnection({
      queryParams: {
        publicKey: dashX.publicKey,
        ...(dashX.identityToken && { 'identityToken': dashX.identityToken }),
        ...(dashX.targetEnvironment && { 'targetEnvironment': dashX.targetEnvironment })
      },
      shouldReconnect: (closeEvent) => {
        // Use the close codes from the SDK
        if (DASHX_CLOSE_CODES.includes(closeEvent.code)) {
          return false
        }
        return true
      },
      onError: errorEvent => console.error({ errorEvent }),
      onClose: closeEvent => console.log({ closeEvent }),
      onMessage: async (message: WebsocketMessageType) => {
        switch (message?.type) {
          case WebsocketMessage.SUBSCRIBE:
            break;
          case WebsocketMessage.IN_APP_NOTIFICATION:
            dashX.trackNotification({ id: message.data.id, status: 'DELIVERED' })
            dashX.addInAppNotificationToCache(message.data)
            toast(message.data.renderedContent.body)
            break;
          case WebsocketMessage.SUBSCRIPTION_SUCCEEDED:
            fetchInAppNotifications()
            break;
          default:
            throw new Error(`Unknown message type ${message}`);
        }
      },
      onOpen: () => {
        // Subscription is automatically handled by dashx-browser
        console.log('WebSocket connected and subscribed to notifications')
      },
    })

    // Connect to WebSocket
    wsManager.connect()

    // Cleanup on unmount
    return () => {
      wsManager.disconnect()
    }
  }, [])

  return {
    notifications,
    unreadNotificationsCount,
    fetchInAppNotifications,
    markNotificationAsRead,
    markNotificationAsUnread
  }
}

export default useInApp
