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

export function useCalendarAgent(
  sites: Site[]
): CalendarAgentState & CalendarAgentActions {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  /**
   * Load events from API using skill
   */
  const loadEvents = useCallback(async () => {
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

  return {
    // State
    events,
    isLoading,
    selectedDate,
    hasEventsThisWeek,
    // Actions
    addEvent,
    selectDate,
    refresh: loadEvents,
  }
}
