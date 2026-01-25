/**
 * Calendar API Skill
 * Pure async functions for fetching calendar/attendance data
 */

import { todayAttendanceStorage } from "@/lib/storage"
import type { AttendanceRecord } from "./calendar-compute.skill"

// ============================================
// Types
// ============================================

export type FetchWeeklyRecordsResult =
  | { success: true; records: AttendanceRecord[] }
  | { success: false; error: string }

// ============================================
// Skills
// ============================================

/**
 * Fetch weekly attendance records
 * Reads from local storage for today's records
 * TODO: Replace with actual API call to fetch full week's data
 */
export async function fetchWeeklyAttendanceRecords(): Promise<FetchWeeklyRecordsResult> {
  try {
    // Get today's records from local storage
    const todayRecords = todayAttendanceStorage.getRecords()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

    // Convert to calendar AttendanceRecord format
    const records: AttendanceRecord[] = todayRecords.map((record, index) => ({
      id: `today-${index}`,
      date: todayStr,
      siteId: record.siteId,
    }))

    // TODO: Replace with actual API call to fetch full week's data
    // const response = await authFetch('/api/attendance/weekly')
    // const apiRecords = await response.json()

    return { success: true, records }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch records",
    }
  }
}
