/**
 * Calendar Agent
 * Manages calendar events and attendance visualization
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import type { CalendarEvent, Site } from "../../home.types"

import {
  fetchMonthlyAttendanceRecords,
  recordsToCalendarEvents,
  recordsToSites,
  hasEventsThisWeek as computeHasEventsThisWeek,
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

export function useCalendarAgent(
  sites: Site[]
): CalendarAgentState & CalendarAgentActions {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [derivedSites, setDerivedSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await fetchMonthlyAttendanceRecords()

      if (result.success) {
        const calendarEvents = recordsToCalendarEvents(result.records, sites)
        setEvents(calendarEvents)
        setDerivedSites(recordsToSites(result.records))
      }
    } finally {
      setIsLoading(false)
    }
  }, [sites])

  useEffect(() => {
    loadEvents()
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

  const refresh = useCallback(async () => {
    await loadEvents()
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
