/**
 * Attendance State Skill
 * Pure functions for computing derived attendance state
 */

// ============================================
// Types
// ============================================

export type CheckInStatus = "출근 전" | "근무 중" | "퇴근 완료"

export interface AttendanceStateInput {
  isCheckedIn: boolean
  completedCount: number
  maxCheckInsPerDay: number
}

export interface DerivedAttendanceState {
  checkInStatus: CheckInStatus
  canCheckIn: boolean
  canCheckOut: boolean
}

// ============================================
// Skills
// ============================================

/**
 * Derive attendance state from raw input
 * Pure function - no side effects
 */
export function deriveAttendanceState(
  input: AttendanceStateInput
): DerivedAttendanceState {
  const { isCheckedIn, completedCount, maxCheckInsPerDay } = input

  let checkInStatus: CheckInStatus
  if (isCheckedIn) {
    checkInStatus = "근무 중"
  } else if (completedCount >= maxCheckInsPerDay) {
    checkInStatus = "퇴근 완료"
  } else {
    checkInStatus = "출근 전"
  }

  return {
    checkInStatus,
    canCheckIn: !isCheckedIn && completedCount < maxCheckInsPerDay,
    canCheckOut: isCheckedIn,
  }
}
