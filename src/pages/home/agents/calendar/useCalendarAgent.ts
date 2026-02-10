/**
 * Calendar Agent
 * Manages calendar events and attendance visualization
 *
 * PR 4: Uses React Query (useMonthlyAttendance) for data fetching and caching
 */

import { useState, useCallback, useMemo } from "react"
import type { CalendarEvent, Site } from "../../home.types"
import { useMonthlyAttendance } from "@/lib/queries/useMonthlyAttendance"

import {
  recordsToCalendarEvents,
  recordsToSites,
  hasEventsThisWeek as computeHasEventsThisWeek,
  type AttendanceRecord,
} from "./skills"

// ============================================
// Types
// ============================================

export interface CalendarAgentState {
  events: CalendarEvent[]
  sites: Site[]
  isLoading: boolean
  selectedDate: Date | null
  hasEventsThisWeek: boolean
}

export interface CalendarAgentActions {
  addEvent: (event: CalendarEvent) => void
  selectDate: (date: Date) => void
  refresh: () => Promise<void>
}

// ============================================
// Agent Hook
// ============================================

export function useCalendarAgent(): CalendarAgentState & CalendarAgentActions {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data, isLoading, refetch } = useMonthlyAttendance(year, month)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const records: AttendanceRecord[] = useMemo(() => {
    if (!data) return []
    return data.records
      .filter((r) => r.hasCheckedIn)
      .map((r) => ({
        id: r.id,
        date: r.effectiveDate,
        siteId: r.siteId,
        siteName: r.siteName,
        workEffort: r.workEffort,
      }))
  }, [data])

  const events = useMemo(() => recordsToCalendarEvents(records, []), [records])
  const sites = useMemo(() => recordsToSites(records), [records])

  const hasEventsThisWeek = useMemo(
    () => computeHasEventsThisWeek(events),
    [events]
  )

  const addEvent = useCallback((event: CalendarEvent) => {
    // No-op: with React Query, data comes from server
    void event
  }, [])

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const refresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    events,
    sites,
    isLoading,
    selectedDate,
    hasEventsThisWeek,
    addEvent,
    selectDate,
    refresh,
  }
}
