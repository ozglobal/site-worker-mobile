/**
 * Calendar API Skill
 * Pure async functions for fetching calendar/attendance data
 */

import { fetchWeeklyAttendance } from "@/lib/attendance"
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
 * Fetch weekly attendance records from API
 * @param offset - Week offset (0 = current week, 1 = last week, etc.)
 */
export async function fetchWeeklyAttendanceRecords(offset: number = 0): Promise<FetchWeeklyRecordsResult> {
  try {
    const result = await fetchWeeklyAttendance(offset)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to fetch weekly attendance",
      }
    }

    // Convert API records to calendar AttendanceRecord format
    // Only include records where hasCheckedIn is true
    const records: AttendanceRecord[] = result.data.records
      .filter((record) => record.hasCheckedIn)
      .map((record) => ({
        id: record.id,
        date: record.effectiveDate,
        siteId: record.siteId,
      }))

    return { success: true, records }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch records",
    }
  }
}
