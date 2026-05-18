/**
 * Pure attendance record transformation utilities
 */

import type { WeeklyAttendanceRecord, MonthlyDay } from '@/lib/attendance'
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

/**
 * Build a site legend from the monthly `days[].entries[]` structure.
 * Colors are assigned in first-encountered order — same scheme
 * `daysToCalendarEvents` uses, so dropdown dots and calendar dots align.
 */
export function daysToSiteLegend(days: MonthlyDay[]): SiteLegendItem[] {
  const seen = new Map<string, SiteLegendItem>()
  days.forEach((d) => {
    d.entries?.forEach((e) => {
      if (!e.siteId || seen.has(e.siteId)) return
      const index = seen.size
      seen.set(e.siteId, {
        id: e.siteId,
        name: e.siteName || "",
        color: SITE_COLORS[index % SITE_COLORS.length],
      })
    })
  })
  return Array.from(seen.values())
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

/**
 * Transform the `days[].entries[]` block from the monthly API directly into
 * calendar events — one dot per (date, siteId), 같은 현장에 공수분할 entry 가 여러개면
 * effort 를 합산하여 단일 dot 으로 표시.
 */
export function daysToCalendarEvents(days: MonthlyDay[]): CalendarEvent[] {
  const siteIndexMap = new Map<string, number>()
  const events: CalendarEvent[] = []
  days.forEach((d) => {
    // (date, siteId) 별로 effort 합산
    const bySite = new Map<string, number>()
    d.entries?.forEach((e) => {
      if (!e.siteId) return
      bySite.set(e.siteId, (bySite.get(e.siteId) ?? 0) + (e.effort ?? 0))
    })
    bySite.forEach((effortSum, siteId) => {
      if (!siteIndexMap.has(siteId)) siteIndexMap.set(siteId, siteIndexMap.size)
      events.push({
        date: new Date(d.date),
        color: SITE_COLORS[(siteIndexMap.get(siteId) ?? 0) % SITE_COLORS.length],
        label: effortSum.toFixed(2),
        siteId,
      })
    })
  })
  return events
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

/**
 * 사이트 → 색 매핑을 안정적으로 만들어 줌. monthly 데이터가 비어있는 달
 * (예: 출근기록이 없는 과거 달) 에도 today's attendances 순서를 우선으로
 * 색을 부여해서, 같은 현장이 달 바뀐다고 색이 바뀌지 않도록 함.
 *
 * 우선순위: today's attendances → monthly days entries (today에 없는 현장).
 */
export function buildSiteColorMap(
  todaySiteIds: Array<string | null | undefined>,
  days: MonthlyDay[],
): Map<string, string> {
  const ordered: string[] = []
  const seen = new Set<string>()
  const add = (id: string | null | undefined) => {
    if (!id || seen.has(id)) return
    seen.add(id)
    ordered.push(id)
  }
  todaySiteIds.forEach(add)
  days.forEach((d) => d.entries?.forEach((e) => add(e.siteId)))
  const map = new Map<string, string>()
  ordered.forEach((id, i) => map.set(id, SITE_COLORS[i % SITE_COLORS.length]))
  return map
}
