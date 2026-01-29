/**
 * Attendance Storage Skill
 * Pure functions for reading/writing attendance data to storage
 */

import type { todayAttendanceStorage } from "@/lib/storage"

// ============================================
// Types
// ============================================

export interface StoredCheckIn {
  id?: string
  siteId: string
  siteName: string
  siteAddress: string
  serverTimestamp: string
}

export interface AttendanceLoadResult {
  currentCheckIn: StoredCheckIn | null
  completedCount: number
}

// ============================================
// Skills
// ============================================

/**
 * Load today's attendance state from storage
 * Pure function - reads from storage passed as dependency
 */
export function loadTodayAttendance(
  storage: typeof todayAttendanceStorage
): AttendanceLoadResult {
  const currentCheckIn = storage.getCurrentCheckIn()
  const records = storage.getRecords()
  const completedRecords = records.filter(r => !!r.checkOutTime)

  return {
    currentCheckIn: currentCheckIn
      ? {
          siteId: currentCheckIn.siteId,
          siteName: currentCheckIn.siteName || "",
          siteAddress: currentCheckIn.siteAddress || "",
          serverTimestamp: currentCheckIn.serverTimestamp || "",
        }
      : null,
    completedCount: completedRecords.length,
  }
}

/**
 * Persist check-in data to storage
 * Returns true if successful, false if blocked (already checked in or limit reached)
 */
export function persistCheckIn(
  storage: typeof todayAttendanceStorage,
  data: StoredCheckIn
): boolean {
  return storage.checkIn({
    id: data.id,
    siteId: data.siteId,
    siteName: data.siteName,
    siteAddress: data.siteAddress,
    serverTimestamp: data.serverTimestamp,
  })
}

/**
 * Persist check-out to storage
 */
export function persistCheckOut(
  storage: typeof todayAttendanceStorage,
  checkOutTime?: string
): void {
  storage.checkOut(checkOutTime)
}
