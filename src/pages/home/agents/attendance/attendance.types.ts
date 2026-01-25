// Attendance-specific types

import type { Location } from "../../home.types"

export interface AttendanceState {
  checkedInSiteId: string | null
  checkInTime: string | null
  siteName: string
  siteAddress: string
  checkOutCount: number
  isProcessing: boolean
}

export interface AttendanceActions {
  setCheckedIn: (siteId: string, siteName: string, siteAddress: string, serverTimestamp: string) => void
  setCheckedOut: () => void
  setProcessing: (processing: boolean) => void
}

export interface CheckInParams {
  siteId: string
  qrTimestamp: string
  location?: Location
}

export interface CheckOutParams {
  siteId: string
  checkInTime?: string
  location?: Location
}

export interface WorkflowResult {
  success: boolean
  error?: string
}

export interface CheckInSuccessData {
  siteId: string
  siteName: string
  siteAddress: string
  serverTimestamp: string
}
