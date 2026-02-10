import { authFetch, getWorkerId } from './auth'
import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'
import { safeJson } from './api-result'
import { reportError } from './errorReporter'

import { API_BASE_URL, X_TENANT_ID } from './config'

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
    devLogRequestRaw('/system/attendance/check-in', request)
    const response = await authFetch(`${API_BASE_URL}/system/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
        'X-Tenant-Id': X_TENANT_ID,
      },
      body: JSON.stringify(request),
    })

    const data = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/system/attendance/check-in', { status: response.status, data })

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
    devLogRequestRaw('/system/attendance/check-out', request)
    const response = await authFetch(`${API_BASE_URL}/system/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
        'X-Tenant-Id': X_TENANT_ID,
      },
      body: JSON.stringify(request),
    })

    const data = await safeJson(response) as Record<string, unknown> | null
    devLogApiRaw('/system/attendance/check-out', { status: response.status, data })

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

/**
 * Monthly attendance API response
 */
export interface MonthlyAttendanceResponse {
  success: boolean
  data?: {
    records: WeeklyAttendanceRecord[]
    attendanceDays: number
    totalWorkHours: number
    totalWorkEffort: number
    startDate: string
    endDate: string
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
      const endpoint = `/system/attendance/my/${year}/${mm}`
      devLogRequestRaw(endpoint, { method: 'GET', year, month })

      const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'X-Tenant-Id': X_TENANT_ID,
        },
      })

      const data = await safeJson(response) as Record<string, unknown> | null
      devLogApiRaw(endpoint, { status: response.status, data })

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
          attendanceDays: (payload.attendanceDays as number) || 0,
          totalWorkHours: (payload.totalWorkHours as number) || 0,
          totalWorkEffort: (payload.totalWorkEffort as number) || 0,
          startDate: (payload.startDate as string) || '',
          endDate: (payload.endDate as string) || '',
        },
      }
    } catch (error) {
      console.error('[MONTHLY] Error:', error)
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

