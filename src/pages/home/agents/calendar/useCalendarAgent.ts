/**
 * Calendar Agent
 * Manages calendar events and attendance visualization
 *
 * Data flow:
 * - On mount: Read from localStorage cache → if empty, fetch from API → fill calendar
 * - On check-in/check-out: Call refresh() → fetch fresh data from API → update calendar
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { monthlyAttendanceStorage } from "@/lib/storage"
import type { CalendarEvent, Site } from "../../home.types"

import {
  recordsToCalendarEvents,
  recordsToSites,
  hasEventsThisWeek as computeHasEventsThisWeek,
  fetchMonthlyAttendanceRecords,
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
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [derivedSites, setDerivedSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  /**
   * Load calendar events
   * @param forceRefresh - If true, bypass cache and fetch from API
   */
  const loadEvents = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true)
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      let records: AttendanceRecord[] | null = null

      // If not force refreshing, try localStorage first
      if (!forceRefresh) {
        const rawRecords = monthlyAttendanceStorage.get(year, month) as Array<{
          id: string
          effectiveDate?: string
          date?: string
          siteId: string
          siteName?: string
          hasCheckedIn?: boolean
          workEffort?: number
        }> | null

        if (rawRecords && rawRecords.length > 0) {
          // Transform localStorage records to AttendanceRecord format
          records = rawRecords
            .filter((r) => r.hasCheckedIn !== false)
            .map((r) => ({
              id: r.id,
              date: r.effectiveDate || r.date || "",
              siteId: r.siteId,
              siteName: r.siteName,
              workEffort: r.workEffort,
            }))
        }
      }

      // Fetch from API if no cached data or force refresh
      if (!records || records.length === 0 || forceRefresh) {
        const result = await fetchMonthlyAttendanceRecords(year, month, forceRefresh)
        if (result.success) {
          records = result.records
        }
      }

      if (records && records.length > 0) {
        const calendarEvents = recordsToCalendarEvents(records, [])
        setEvents(calendarEvents)
        setDerivedSites(recordsToSites(records))
      } else {
        // Clear events if no records
        setEvents([])
        setDerivedSites([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    loadEvents(false)
  }, [loadEvents])

  const hasEventsThisWeek = useMemo(
    () => computeHasEventsThisWeek(events),
    [events]
  )

  const addEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => [...prev, event])
  }, [])

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  // Refresh from API (force fetch, bypass cache)
  const refresh = useCallback(async () => {
    await loadEvents(true)
  }, [loadEvents])

  return {
    events,
    sites: derivedSites,
    isLoading,
    selectedDate,
    hasEventsThisWeek,
    addEvent,
    selectDate,
    refresh,
  }
}
