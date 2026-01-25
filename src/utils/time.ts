/**
 * Time utility functions
 */

/**
 * Convert serverTimestamp (UTC) to KST formatted string
 * Handles string (ISO format), number (Unix ms), or Date object
 */
export const formatKstTime = (timestamp: string | number | Date | null | undefined): string => {
  if (!timestamp) return ''

  let date: Date

  if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'string') {
    if (timestamp.includes('T')) {
      // Only add 'Z' if it doesn't already end with 'Z'
      date = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z')
    } else {
      const ms = Number(timestamp)
      if (!Number.isFinite(ms)) {
        return timestamp
      }
      date = new Date(ms)
    }
  } else {
    return ''
  }

  const seoulDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)

  const hours = String(seoulDate.getUTCHours()).padStart(2, '0')
  const minutes = String(seoulDate.getUTCMinutes()).padStart(2, '0')
  const seconds = String(seoulDate.getUTCSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
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
