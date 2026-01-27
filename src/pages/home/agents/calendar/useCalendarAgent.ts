/**
 * Calendar Agent
 * Manages weekly calendar events and attendance visualization
 * Replaces useWeeklyCalendarAgent with skills-based approach
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import type { CalendarEvent, Site } from "../../home.types"

// Import skills
import {
  fetchWeeklyAttendanceRecords,
  recordsToCalendarEvents,
  hasEventsThisWeek as computeHasEventsThisWeek,
} from "./skills"

// ============================================
// Types
// ============================================

export interface CalendarAgentState {
  events: CalendarEvent[]
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

// Module-level flag to prevent duplicate fetches (persists across StrictMode remounts)
let hasFetchedThisSession = false

export function useCalendarAgent(
  sites: Site[]
): CalendarAgentState & CalendarAgentActions {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  /**
   * Load events from API using skill
   */
  const loadEvents = useCallback(async (force: boolean = false) => {
    // Skip if already fetched this session (prevents duplicate calls from StrictMode)
    if (hasFetchedThisSession && !force) {
      return
    }
    hasFetchedThisSession = true

    setIsLoading(true)
    try {
      const result = await fetchWeeklyAttendanceRecords()

      if (result.success) {
        // Use skill to transform records to calendar events
        const calendarEvents = recordsToCalendarEvents(result.records, sites)
        setEvents(calendarEvents)
      }
    } finally {
      setIsLoading(false)
    }
  }, [sites])

  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Derive hasEventsThisWeek using skill
  const hasEventsThisWeek = useMemo(
    () => computeHasEventsThisWeek(events),
    [events]
  )

  /**
   * Add a new event
   */
  const addEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => [...prev, event])
  }, [])

  /**
   * Select a date
   */
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  /**
   * Force refresh events from API
   */
  const refresh = useCallback(async () => {
    await loadEvents(true)
  }, [loadEvents])

  return {
    // State
    events,
    isLoading,
    selectedDate,
    hasEventsThisWeek,
    // Actions
    addEvent,
    selectDate,
    refresh,
  }
}
