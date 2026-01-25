/**
 * Notification Agent
 * Manages toast/notification state with auto-dismiss
 */

import { useState, useEffect, useCallback } from "react"
import { createNotification, type Notification } from "./skills"

// ============================================
// Constants
// ============================================

const AUTO_DISMISS_MS = 5000

// ============================================
// Types
// ============================================

export interface NotificationAgentState {
  notifications: Notification[]
}

export interface NotificationAgentActions {
  showSuccess: (title: string, message: string) => void
  showError: (title: string, message: string) => void
  showInfo: (title: string, message: string) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

// ============================================
// Agent Hook
// ============================================

export function useNotificationAgent(): NotificationAgentState &
  NotificationAgentActions {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Auto-dismiss effect
  useEffect(() => {
    if (notifications.length === 0) return

    const timers = notifications.map((n) =>
      setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== n.id))
      }, AUTO_DISMISS_MS)
    )

    return () => timers.forEach(clearTimeout)
  }, [notifications])

  /**
   * Add a notification of specified type
   */
  const addNotification = useCallback(
    (type: Notification["type"], title: string, message: string) => {
      const notification = createNotification(type, title, message)
      setNotifications((prev) => [...prev, notification])
    },
    []
  )

  /**
   * Show a success notification
   */
  const showSuccess = useCallback(
    (title: string, message: string) => {
      addNotification("success", title, message)
    },
    [addNotification]
  )

  /**
   * Show an error notification
   */
  const showError = useCallback(
    (title: string, message: string) => {
      addNotification("error", title, message)
    },
    [addNotification]
  )

  /**
   * Show an info notification
   */
  const showInfo = useCallback(
    (title: string, message: string) => {
      addNotification("info", title, message)
    },
    [addNotification]
  )

  /**
   * Dismiss a specific notification
   */
  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  /**
   * Dismiss all notifications
   */
  const dismissAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    // State
    notifications,
    // Actions
    showSuccess,
    showError,
    showInfo,
    dismiss,
    dismissAll,
  }
}
