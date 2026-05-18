/**
 * Notification Skill
 * Pure functions for notification management
 */

// ============================================
// Types
// ============================================

export type NotificationType = "success" | "error" | "info"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  createdAt: number
}

// ============================================
// Skills
// ============================================

/**
 * Create a new notification object
 */
export function createNotification(
  type: NotificationType,
  title: string,
  message: string
): Notification {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    title,
    message,
    createdAt: Date.now(),
  }
}

/**
 * Check if a notification should be auto-dismissed based on age
 */
export function shouldAutoDismiss(
  notification: Notification,
  maxAgeMs: number
): boolean {
  return Date.now() - notification.createdAt >= maxAgeMs
}

/**
 * Filter out expired notifications
 */
export function filterExpiredNotifications(
  notifications: Notification[],
  maxAgeMs: number
): Notification[] {
  return notifications.filter((n) => !shouldAutoDismiss(n, maxAgeMs))
}
