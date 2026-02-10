/**
 * Pure attendance record transformation utilities
 */

import type { WeeklyAttendanceRecord } from '@/lib/attendance'
import type { CalendarEvent } from '@/components/ui/calendar'

const SITE_COLORS = ["#007DCA", "#F59E0B", "#10B981", "#EF4444"]
const DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]

export interface SiteLegendItem {
  id: string
  name: string
  color: string
}

export interface DayGroup {
  date: string
  dayOfMonth: number
  dayName: string
  totalExpectedWage: number
  records: WeeklyAttendanceRecord[]
}

/** Extract unique sites with assigned colors from attendance records */
export function recordsToSiteLegend(records: WeeklyAttendanceRecord[]): SiteLegendItem[] {
  const seen = new Map<string, SiteLegendItem>()
  records
    .filter((r) => r.hasCheckedIn && r.siteId)
    .forEach((r) => {
      if (!seen.has(r.siteId)) {
        const index = seen.size
        seen.set(r.siteId, {
          id: r.siteId,
          name: r.siteName || "",
          color: SITE_COLORS[index % SITE_COLORS.length],
        })
      }
    })
  return Array.from(seen.values())
}

/** Transform attendance records into calendar events */
export function recordsToCalendarEvents(records: WeeklyAttendanceRecord[]): CalendarEvent[] {
  const siteIndexMap = new Map<string, number>()
  const checkedIn = records.filter((r) => r.hasCheckedIn)
  checkedIn.forEach((r) => {
    if (!siteIndexMap.has(r.siteId)) siteIndexMap.set(r.siteId, siteIndexMap.size)
  })
  return checkedIn.map((r) => ({
    date: new Date(r.effectiveDate),
    color: SITE_COLORS[(siteIndexMap.get(r.siteId) ?? 0) % SITE_COLORS.length],
    label: r.workEffort != null ? r.workEffort.toFixed(2) : "",
    siteId: r.siteId,
  }))
}

/** Group attendance records by date (sorted descending) */
export function groupRecordsByDate(records: WeeklyAttendanceRecord[]): DayGroup[] {
  const validRecords = records.filter((r) => r.siteId)
  const groupMap = new Map<string, WeeklyAttendanceRecord[]>()

  validRecords.forEach((record) => {
    const date = record.effectiveDate
    if (!groupMap.has(date)) {
      groupMap.set(date, [])
    }
    groupMap.get(date)!.push(record)
  })

  const groups: DayGroup[] = []
  groupMap.forEach((dayRecords, date) => {
    const dateObj = new Date(date)
    groups.push({
      date,
      dayOfMonth: dateObj.getDate(),
      dayName: DAY_NAMES[dateObj.getDay()],
      totalExpectedWage: dayRecords.reduce((sum, r) => sum + (r.expectedWage || 0), 0),
      records: dayRecords,
    })
  })

  groups.sort((a, b) => b.date.localeCompare(a.date))
  return groups
}

/** Get color for a site by looking up its index in the legend */
export function getSiteColor(siteId: string, sites: SiteLegendItem[]): string {
  const site = sites.find((s) => s.id === siteId)
  return site?.color ?? SITE_COLORS[0]
}
