/**
 * Calendar API Skill
 * Pure async functions for fetching calendar/attendance data
 */

import { fetchMonthlyAttendance } from "@/lib/attendance"
import type { AttendanceRecord } from "./calendar-compute.skill"

// ============================================
// Types
// ============================================

export type FetchMonthlyRecordsResult =
  | { success: true; records: AttendanceRecord[] }
  | { success: false; error: string }

// ============================================
// Skills
// ============================================

/**
 * Fetch monthly attendance records from API
 * @param year - 4-digit year (defaults to current year)
 * @param month - 1-based month (defaults to current month)
 */
export async function fetchMonthlyAttendanceRecords(
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
): Promise<FetchMonthlyRecordsResult> {
  try {
    const result = await fetchMonthlyAttendance(year, month)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to fetch monthly attendance",
      }
    }

    const records: AttendanceRecord[] = result.data.records
      .filter((record) => record.hasCheckedIn)
      .map((record) => ({
        id: record.id,
        date: record.effectiveDate,
        siteId: record.siteId,
        siteName: record.siteName,
        workEffort: record.workEffort,
      }))

    return { success: true, records }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch records",
    }
  }
}
