/**
 * Pure formatting utilities
 */

/** Format timestamp (Unix ms) to HH:MM */
export function formatTimestamp(timestamp: number | undefined): string {
  if (!timestamp) return "--:--"
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

/** Format number as Korean currency (e.g., 150,000원) */
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "0원"
  return amount.toLocaleString("ko-KR") + "원"
}
