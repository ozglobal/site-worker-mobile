/**
 * Pure formatting utilities
 */

/** Format timestamp (Unix ms) to HH:MM or HH:MM:SS */
export function formatTimestamp(timestamp: number | undefined, includeSeconds = false): string {
  if (!timestamp) return includeSeconds ? "--:--:--" : "--:--"
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  if (!includeSeconds) return `${hours}:${minutes}`
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

/** Format number as Korean currency (e.g., 150,000원) */
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "no data"
  return amount.toLocaleString("ko-KR") + "원"
}
