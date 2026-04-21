import { authFetch, getWorkerId } from './auth'
import { safeJson, type ApiResult } from './api-result'
import { reportError } from './errorReporter'
import { logError } from '../utils/devLog'

import { API_BASE_URL } from './config'

/**
 * Check-in request payload
 */
export interface CheckInRequest {
  workerId: string
  siteId: string
  teamId?: string
  gateId?: string
  clientTimestamp: string
  gpsLatitude?: number
  gpsLongitude?: number
  gpsAccuracy?: number
  beaconUuid?: string
  beaconMajor?: number
  beaconMinor?: number
  beaconRssi?: number
  deviceId?: string
  deviceFingerprint?: string
  deviceType?: string
  appVersion?: string
  qrNonce?: string
  qrTimestamp?: string
  isProxy?: boolean
  proxyUserId?: string
  proxyReason?: string
  isOffline?: boolean
  remarks?: string
}

/**
 * Check-in API response
 */
export interface CheckInResponse {
  success: boolean
  data?: {
    attendanceId?: string
    checkInTime?: string
    serverTimestamp?: string
    siteName?: string
    siteAddress?: string
  }
  error?: string
}

/**
 * Check-out request payload
 */
export interface CheckOutRequest {
  workerId: string
  siteId: string
  teamId?: string
  gateId?: string
  clientTimestamp: string
  workHours?: number
  gpsLatitude?: number
  gpsLongitude?: number
  gpsAccuracy?: number
  beaconUuid?: string
  beaconMajor?: number
  beaconMinor?: number
  beaconRssi?: number
  deviceId?: string
  deviceFingerprint?: string
  deviceType?: string
  appVersion?: string
  qrNonce?: string
  qrTimestamp?: string
  isProxy?: boolean
  proxyUserId?: string
  proxyReason?: string
  isOffline?: boolean
  remarks?: string
  workEffort?: number
}

/**
 * Check-out API response
 */
export interface CheckOutResponse {
  success: boolean
  data?: {
    attendanceId?: string
    checkOutTime?: string
    workHours?: number
  }
  error?: string
}

/**
 * Send check-in request to backend
 */
export const checkIn = async (request: CheckInRequest): Promise<CheckInResponse> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/system/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
      body: JSON.stringify(request),
    })

    const data = await safeJson(response) as Record<string, unknown> | null

    if (!data) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok || data.code === 500) {
      // If data.code is 500, use data.message
      const errorMessage = data.code === 500
        ? (data.message as string)
        : ((data.message || data.error || (data.data as Record<string, unknown> | undefined)?.message || (data.result as Record<string, unknown> | undefined)?.message || `Check-in failed (${response.status})`) as string)
      return {
        success: false,
        error: errorMessage,
      }
    }

    // Extract data from response (handle different API response formats)
    const responseData = (data.data || data.result || data) as Record<string, unknown>

    // Ensure all fields are included (may be at root level or in nested data)
    return {
      success: true,
      data: {
        attendanceId: (responseData.attendanceId || responseData.id || data.attendanceId || data.id) as string | undefined,
        serverTimestamp: (responseData.serverTimestamp || data.serverTimestamp) as string | undefined,
        siteName: (responseData.siteName || data.siteName) as string | undefined,
        siteAddress: (responseData.siteAddress || data.siteAddress) as string | undefined,
        checkInTime: responseData.checkInTime as string | undefined,
      },
    }
  } catch (error) {
    reportError('CHECKIN_API_FAIL', error instanceof Error ? error.message : 'Network error', { endpoint: '/system/attendance/check-in' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Send check-out request to backend
 */
export const checkOut = async (request: CheckOutRequest): Promise<CheckOutResponse> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/system/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
      body: JSON.stringify(request),
    })

    const data = await safeJson(response) as Record<string, unknown> | null

    if (!data) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return {
        success: false,
        error: (data.message || data.error || `Check-out failed (${response.status})`) as string,
      }
    }

    return {
      success: true,
      data: (data.data || data.result || data) as CheckOutResponse['data'],
    }
  } catch (error) {
    reportError('CHECKOUT_API_FAIL', error instanceof Error ? error.message : 'Network error', { endpoint: '/system/attendance/check-out' })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Build check-out request from site ID and GPS location
 */
export const buildCheckOutRequest = (params: {
  siteId: string
  checkInTime?: string | number | Date
  workEffort?: number | null
  location?: {
    latitude: number
    longitude: number
    accuracy: number
  }
}): CheckOutRequest => {
  const workerId = getWorkerId() || ''

  // Calculate work hours if check-in time is available
  let workHours: number | undefined
  if (params.checkInTime) {
    let checkInDate: Date

    if (params.checkInTime instanceof Date) {
      checkInDate = params.checkInTime
    } else if (typeof params.checkInTime === 'number') {
      checkInDate = new Date(params.checkInTime)
    } else if (typeof params.checkInTime === 'string') {
      // Handle ISO format (2026-01-22T09:00:00Z) or HH:MM format
      if (params.checkInTime.includes('T')) {
        checkInDate = new Date(params.checkInTime)
      } else if (params.checkInTime.includes(':')) {
        const [hours, minutes] = params.checkInTime.split(':').map(Number)
        checkInDate = new Date()
        checkInDate.setHours(hours, minutes, 0, 0)
      } else {
        checkInDate = new Date(params.checkInTime)
      }
    } else {
      checkInDate = new Date()
    }

    const now = new Date()
    workHours = Math.round((now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60) * 10) / 10
  }

  return {
    workerId,
    siteId: params.siteId,
    clientTimestamp: new Date().toISOString(),
    workHours,
    gpsLatitude: params.location?.latitude,
    gpsLongitude: params.location?.longitude,
    gpsAccuracy: params.location?.accuracy,
    deviceType: 'mobile',
    appVersion: '1.0.0',
    workEffort: params.workEffort ?? undefined,
  }
}

/**
 * Build check-in request from QR scan data and GPS location
 */
export const buildCheckInRequest = (params: {
  siteId: string
  qrTimestamp: Date
  location?: {
    latitude: number
    longitude: number
    accuracy: number
  }
}): CheckInRequest => {
  // Get workerId from storage (set during login)
  const workerId = getWorkerId() || ''

  return {
    workerId,
    siteId: params.siteId,
    clientTimestamp: new Date().toISOString(),
    gpsLatitude: params.location?.latitude,
    gpsLongitude: params.location?.longitude,
    gpsAccuracy: params.location?.accuracy,
    qrTimestamp: params.qrTimestamp.toISOString(),
    deviceType: 'mobile',
    appVersion: '1.0.0',
  }
}


/**
 * Weekly attendance record item
 */
export interface WeeklyAttendanceRecord {
  id: string
  effectiveDate: string
  siteId: string
  siteName: string
  checkInTime: number
  checkOutTime?: number
  workHours?: number
  workEffort?: number
  dailyWageSnapshot?: number
  expectedWage?: number
  status: string
  recordType: string
  hasCheckedIn: boolean
  hasCheckedOut: boolean
  complete: boolean
}

// ============================================
// Monthly Attendance API
// ============================================

// In-flight request deduplication for monthly attendance
const monthlyAttendanceRequests = new Map<string, Promise<MonthlyAttendanceResponse>>()

export interface MonthlySiteBreakdown {
  siteId: string
  siteName: string
  effort: number
  expectedWage: number
}

export interface MonthlyDayEntry {
  entryId?: string
  attendanceId?: string
  effort: number
  siteId: string
  siteName?: string
  category?: string
  categoryLabel?: string
  dailyWageSnapshot?: number
  expectedWage?: number
  checkInTime?: number
  checkOutTime?: number
  status?: string
  hasCheckedIn?: boolean
  hasCheckedOut?: boolean
}

export interface MonthlyDay {
  date: string
  entries: MonthlyDayEntry[]
}

/**
 * Monthly attendance API response
 */
export interface MonthlyAttendanceResponse {
  success: boolean
  data?: {
    records: WeeklyAttendanceRecord[]
    totalWorkDays: number
    totalWorkHours: number
    totalEffort: number
    totalExpectedWage: number
    startDate: string
    endDate: string
    siteBreakdown: MonthlySiteBreakdown[]
    days: MonthlyDay[]
  }
  error?: string
}

/**
 * Fetch monthly attendance records from API
 * PR 4: localStorage cache removed — React Query handles caching via useMonthlyAttendance hook
 * @param year - 4-digit year (e.g. 2026)
 * @param month - 1-based month (1–12)
 */
export const fetchMonthlyAttendance = async (
  year: number,
  month: number,
): Promise<MonthlyAttendanceResponse> => {
  const cacheKey = `${year}-${month}`

  // Return existing in-flight request if one exists
  const existingRequest = monthlyAttendanceRequests.get(cacheKey)
  if (existingRequest) {
    return existingRequest
  }

  const request = (async (): Promise<MonthlyAttendanceResponse> => {
    try {
      const mm = String(month).padStart(2, '0')
      const endpoint = `/system/worker/me/attendance/monthly?yearMonth=${year}-${mm}-01`

      const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      })

      const data = await safeJson(response) as Record<string, unknown> | null

      if (!data) {
        return { success: false, error: 'Invalid server response' }
      }

      if (!response.ok) {
        return {
          success: false,
          error: (data.message || data.error || `Failed to fetch monthly attendance (${response.status})`) as string,
        }
      }

      const payload = (data.data || data) as Record<string, unknown>
      const records = (payload.records || []) as WeeklyAttendanceRecord[]

      return {
        success: true,
        data: {
          records,
          totalWorkDays: (payload.totalWorkDays as number) || 0,
          totalWorkHours: (payload.totalWorkHours as number) || 0,
          totalEffort: (payload.totalEffort as number) || 0,
          totalExpectedWage: (payload.totalExpectedWage as number) || 0,
          startDate: (payload.startDate as string) || '',
          endDate: (payload.endDate as string) || '',
          siteBreakdown: (payload.siteBreakdown as MonthlySiteBreakdown[]) || [],
          days: (payload.days as MonthlyDay[]) || [],
        },
      }
    } catch (error) {
      logError('[MONTHLY] Error', { code: String(error) })
      reportError('ATTENDANCE_MONTHLY_FAIL', error instanceof Error ? error.message : 'Network error')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    } finally {
      monthlyAttendanceRequests.delete(cacheKey)
    }
  })()

  monthlyAttendanceRequests.set(cacheKey, request)

  return request
}

// ============================================
// Home bundle API
// GET /system/worker/me/home
// Aggregates everything Home.tsx needs in a single round trip.
// ============================================

export interface HomeAttendanceRecord {
  id?: string
  workerId: string
  effectiveDate: string
  hasCheckedIn: boolean
  hasCheckedOut: boolean
  checkInTime: number | null
  checkOutTime?: number | null
  siteId: string
  siteName: string
  wageSystemSnapshot?: string
  dailyWageSnapshot: number | null
  expectedWage?: number
  workEffort?: number
}

export interface HomeData {
  workerName: string
  currentSiteName: string
  todayAttendance: HomeAttendanceRecord[]
  monthlyWorkDays: number
  monthlyTotalHours: number
  monthlyEstimatedWage: number
  unreadNoticeCount: number
  onboardingCompleted: boolean
  pendingDocuments: number
}

export const fetchHomeData = async (): Promise<ApiResult<HomeData>> => {
  const endpoint = '/system/worker/me/home'
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'accept': '*/*' },
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!json) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return { success: false, error: (json.message as string) || `API error: ${response.status}` }
    }

    const payload = (json.data || json) as Record<string, unknown>
    const data: HomeData = {
      workerName: (payload.workerName as string) || '',
      currentSiteName: (payload.currentSiteName as string) || '',
      todayAttendance: (payload.todayAttendance as HomeAttendanceRecord[]) || [],
      monthlyWorkDays: (payload.monthlyWorkDays as number) || 0,
      monthlyTotalHours: (payload.monthlyTotalHours as number) || 0,
      monthlyEstimatedWage: (payload.monthlyEstimatedWage as number) || 0,
      unreadNoticeCount: (payload.unreadNoticeCount as number) || 0,
      onboardingCompleted: Boolean(payload.onboardingCompleted),
      pendingDocuments: (payload.pendingDocuments as number) || 0,
    }
    return { success: true, data }
  } catch (error) {
    console.error('[HOME] Error:', error)
    reportError('HOME_FETCH_FAIL', error instanceof Error ? error.message : 'Network error', { endpoint })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// ============================================
// Today's attendance API
// GET /system/worker/me/attendance/daily/{yyyy-MM-dd}
// ============================================

export interface DailyAttendanceEntry {
  entryId: string
  category: string
  categoryLabel: string
  effort: number
  dailyWageSnapshot: number
  expectedWage: number
  canRequestCorrection: boolean
  overtime: boolean
}

export interface DailySiteSchedule {
  standardCheckIn?: string
  standardCheckOut?: string
  lunchStartTime?: string
  lunchEndTime?: string
  restStartTime?: string
  restStopTime?: string
}

export interface DailyAttendanceSite {
  attendanceId: string
  siteId: string
  siteName: string
  siteAddress?: string
  siteSchedule?: DailySiteSchedule
  status: string
  checkInTime: string | null
  checkOutTime?: string | null
  totalEffort: number
  totalExpectedWage: number
  canRequestCorrection: boolean
  entries: DailyAttendanceEntry[]
}

export interface DailyAttendanceData {
  date: string
  attendances: DailyAttendanceSite[]
}

export const fetchTodayAttendance = async (
  date: string,
): Promise<ApiResult<DailyAttendanceData>> => {
  const endpoint = `/system/worker/me/attendance/daily/${date}`
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'accept': '*/*' },
    })

    const json = await safeJson(response) as Record<string, unknown> | null

    if (!json) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return { success: false, error: (json.message as string) || `API error: ${response.status}` }
    }

    const payload = (json.data || json) as Record<string, unknown>
    const data: DailyAttendanceData = {
      date: (payload.date as string) || date,
      attendances: (payload.attendances as DailyAttendanceSite[]) || [],
    }
    return { success: true, data }
  } catch (error) {
    console.error('[DAILY] Error:', error)
    reportError('ATTENDANCE_DAILY_FAIL', error instanceof Error ? error.message : 'Network error', { endpoint })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// ============================================
// Correction Request API
// ============================================

export interface CorrectionRequestParams {
  attendanceId: string
  workEntryId: string
  requestType: 'work_effort' | 'daily_wage' | 'work_effort_and_wage'
  /** Used for `work_effort` or `daily_wage` (single-field correction). */
  requestedValue?: string
  /** Used for `work_effort_and_wage` (combined correction). */
  requestedEffort?: string
  requestedWage?: string
  reason: string
}

export interface CorrectionRequest {
  id: string
  attendanceId: string
  workEntryId: string
  requesterId: number
  requestType: string
  originalValue: string
  requestedValue: string
  reason: string
  status: string
  originalEffort: string
  requestedEffort: string
  originalWage: string
  requestedWage: string
}

export const submitCorrectionRequest = async (
  params: CorrectionRequestParams
): Promise<ApiResult<CorrectionRequest>> => {
  const endpoint = '/system/worker/me/attendance/correction-request'
  // Build body with only the fields the spec accepts for this requestType —
  // avoids sending both `requestedValue` and `requestedEffort/Wage` at once.
  const body: Record<string, unknown> = {
    attendanceId: params.attendanceId,
    workEntryId: params.workEntryId,
    requestType: params.requestType,
    reason: params.reason,
  }
  if (params.requestType === 'work_effort_and_wage') {
    if (params.requestedEffort !== undefined) body.requestedEffort = params.requestedEffort
    if (params.requestedWage !== undefined) body.requestedWage = params.requestedWage
  } else {
    if (params.requestedValue !== undefined) body.requestedValue = params.requestedValue
  }
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
      body: JSON.stringify(body),
    })

    const data = await safeJson(response) as Record<string, unknown> | null

    if (!data) {
      return { success: false, error: 'Invalid server response' }
    }

    if (!response.ok) {
      return {
        success: false,
        error: (data.message || data.error || `Correction request failed (${response.status})`) as string,
      }
    }

    const payload = (data.data || data) as Record<string, unknown>
    const correction: CorrectionRequest = {
      id: (payload.id as string) || '',
      attendanceId: (payload.attendanceId as string) || '',
      workEntryId: (payload.workEntryId as string) || '',
      requesterId: (payload.requesterId as number) || 0,
      requestType: (payload.requestType as string) || '',
      originalValue: (payload.originalValue as string) || '',
      requestedValue: (payload.requestedValue as string) || '',
      reason: (payload.reason as string) || '',
      status: (payload.status as string) || '',
      originalEffort: (payload.originalEffort as string) || '',
      requestedEffort: (payload.requestedEffort as string) || '',
      originalWage: (payload.originalWage as string) || '',
      requestedWage: (payload.requestedWage as string) || '',
    }
    return { success: true, data: correction }
  } catch (error) {
    reportError('CORRECTION_REQUEST_FAIL', error instanceof Error ? error.message : 'Network error', { endpoint })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * POST /system/attendance/{id}/overtime-request
 * Flags the attendance as overtime (isOvertime=true) and suppresses the
 * missed-checkout alert for the worker. No request body.
 */
export const requestOvertime = async (attendanceId: string): Promise<ApiResult<void>> => {
  const endpoint = `/system/attendance/${attendanceId}/overtime-request`
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'accept': '*/*' },
    })
    if (!response.ok) {
      const data = await safeJson(response) as Record<string, unknown> | null
      return { success: false, error: (data?.message as string) || `API error: ${response.status}` }
    }
    return { success: true, data: undefined }
  } catch (error) {
    reportError('OVERTIME_REQUEST_FAIL', error instanceof Error ? error.message : 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

export const purgeAttendance = async (id: string): Promise<ApiResult<void>> => {
  const endpoint = `/system/attendance/${id}/purge`
  try {
    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'accept': '*/*' },
    })

    if (!response.ok) {
      const data = await safeJson(response) as Record<string, unknown> | null
      return { success: false, error: (data?.message as string) || `API error: ${response.status}` }
    }

    return { success: true, data: undefined }
  } catch (error) {
    reportError('ATTENDANCE_PURGE_FAIL', error instanceof Error ? error.message : 'Network error', { endpoint })
    return { success: false, error: 'Network error' }
  }
}

