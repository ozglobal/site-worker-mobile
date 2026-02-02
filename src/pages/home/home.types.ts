// Shared types for Home page

export interface Location {
  latitude: number
  longitude: number
  accuracy: number
}

export interface Site {
  id: string
  name: string
  address?: string
  color?: string
}

export interface CalendarEvent {
  date: Date
  color: "blue" | "orange" | string
  label?: string
}

export type CheckInStatus = "출근 전" | "근무 중" | "퇴근 완료"

export type AttendanceStatus = "checked-in" | "checked-out"

export type PendingAction = "check-in" | "check-out" | null

export interface TodayWorkRecord {
  siteName: string
  checkInTime: string
  checkOutTime?: string
}
