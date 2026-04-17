/**
 * Time utility functions
 */

/** Parse a timestamp (string/number/Date) into a KST Date (UTC+9) */
function toSeoulDate(timestamp: string | number | Date): Date | null {
  if (timestamp instanceof Date) {
    return new Date(timestamp.getTime() + 9 * 60 * 60 * 1000)
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp + 9 * 60 * 60 * 1000)
  }
  if (typeof timestamp !== 'string') return null

  if (timestamp.includes('T')) {
    // LocalDateTime (no Z/offset) → backend sends KST wall-clock already.
    // Parse as UTC so getUTC* reads the original hours without a +9h double-shift.
    const hasOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(timestamp)
    if (!hasOffset) {
      // JS Date only accepts up to 3 fractional digits; truncate if longer.
      const cleaned = timestamp.replace(/(\.\d{3})\d+$/, '$1')
      const d = new Date(cleaned + 'Z')
      return isNaN(d.getTime()) ? null : d
    }
    const d = new Date(timestamp)
    return isNaN(d.getTime()) ? null : new Date(d.getTime() + 9 * 60 * 60 * 1000)
  }

  const ms = Number(timestamp)
  if (!Number.isFinite(ms)) return null
  return new Date(ms + 9 * 60 * 60 * 1000)
}

/**
 * Convert serverTimestamp (UTC) to KST time string (HH:MM:SS)
 * Handles string (ISO format), number (Unix ms), or Date object
 */
export const formatKstTime = (timestamp: string | number | Date | null | undefined): string => {
  if (!timestamp) return ''
  const seoulDate = toSeoulDate(timestamp)
  if (!seoulDate) return typeof timestamp === 'string' ? timestamp : ''

  const hours = String(seoulDate.getUTCHours()).padStart(2, '0')
  const minutes = String(seoulDate.getUTCMinutes()).padStart(2, '0')
  const seconds = String(seoulDate.getUTCSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

/**
 * Convert serverTimestamp (UTC) to KST date-time string (YYYY-MM-DD HH:MM)
 */
export const formatKstDateTime = (timestamp: string | number | Date | null | undefined): string => {
  if (!timestamp) return ''
  const seoulDate = toSeoulDate(timestamp)
  if (!seoulDate) return typeof timestamp === 'string' ? timestamp : ''

  const year = seoulDate.getUTCFullYear()
  const month = String(seoulDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(seoulDate.getUTCDate()).padStart(2, '0')
  const hours = String(seoulDate.getUTCHours()).padStart(2, '0')
  const minutes = String(seoulDate.getUTCMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * Format date to Korean style (1월 15일 (수))
 */
export const formatDateKorean = (date: Date): string => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
  const dayOfWeek = dayNames[date.getDay()]
  return `${month}월 ${day}일 (${dayOfWeek})`
}

/**
 * Format full date (2026년 1월 15일 (수))
 */
export const formatFullDateKorean = (date: Date): string => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
  const dayOfWeek = dayNames[date.getDay()]
  return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`
}
