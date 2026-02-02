/**
 * Calendar Compute Skill
 * Pure functions for calendar calculations and data transformations
 */

import type { CalendarEvent, Site } from "../../../home.types"

// ============================================
// Types
// ============================================

export interface WeekBounds {
  start: Date
  end: Date
}

export interface AttendanceRecord {
  id: string
  date: string
  siteId: string
  siteName?: string
  workEffort?: number
}

// ============================================
// Skills
// ============================================

/**
 * Get the start and end dates of the week containing the given date
 * Week starts on Sunday
 */
export function getWeekBounds(date: Date): WeekBounds {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dayOfWeek = d.getDay()

  const start = new Date(d)
  start.setDate(d.getDate() - dayOfWeek)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

/**
 * Check if any events fall within the given week bounds
 */
export function hasEventsInWeek(
  events: CalendarEvent[],
  weekBounds: WeekBounds
): boolean {
  return events.some((event) => {
    const eventDate = new Date(event.date)
    return eventDate >= weekBounds.start && eventDate <= weekBounds.end
  })
}

/**
 * Check if there are events in the current week
 */
export function hasEventsThisWeek(events: CalendarEvent[]): boolean {
  const weekBounds = getWeekBounds(new Date())
  return hasEventsInWeek(events, weekBounds)
}

// Default color palette for sites
const SITE_COLORS = ["#007DCA", "#F59E0B", "#10B981", "#EF4444"]

/**
 * Map site ID to color
 * Uses sites array if available, otherwise assigns color based on siteId hash
 */
export function getSiteColor(siteId: string, sites: Site[], siteIndex?: number): string {
  const site = sites.find((s) => s.id === siteId)
  if (site?.color) return site.color

  // Assign color based on index if available, otherwise use first color
  const colorIndex = siteIndex ?? 0
  return SITE_COLORS[colorIndex % SITE_COLORS.length]
}

/**
 * Transform attendance records into calendar events
 */
export function recordsToCalendarEvents(
  records: AttendanceRecord[],
  sites: Site[]
): CalendarEvent[] {
  // Build a map of siteId to index for consistent color assignment
  const siteIndexMap = new Map<string, number>()
  records.forEach((record) => {
    if (!siteIndexMap.has(record.siteId)) {
      siteIndexMap.set(record.siteId, siteIndexMap.size)
    }
  })

  return records.map((record) => ({
    date: new Date(record.date),
    color: getSiteColor(record.siteId, sites, siteIndexMap.get(record.siteId)),
    label: record.workEffort != null ? record.workEffort.toFixed(2) : "",
  }))
}

/**
 * Extract unique sites from attendance records
 */
export function recordsToSites(records: AttendanceRecord[]): Site[] {
  const siteIndexMap = new Map<string, number>()
  const seenSites = new Map<string, Site>()

  records.forEach((record) => {
    if (record.siteId && !seenSites.has(record.siteId)) {
      const index = siteIndexMap.size
      siteIndexMap.set(record.siteId, index)
      seenSites.set(record.siteId, {
        id: record.siteId,
        name: record.siteName || "",
        color: SITE_COLORS[index % SITE_COLORS.length],
      })
    }
  })

  return Array.from(seenSites.values())
}

/**
 * Generate array of dates for a week starting from given date
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })
}
