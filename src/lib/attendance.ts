import { authFetch } from './auth'
import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'
import { profileStorage, todayAttendanceStorage } from './storage'

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

    const data = await response.json()
    devLogApiRaw('/system/attendance/check-in', { status: response.status, data })

    if (!response.ok || data.code === 500) {
      // If data.code is 500, use data.message
      const errorMessage = data.code === 500
        ? data.message
        : (data.message || data.error || data.data?.message || data.result?.message || `Check-in failed (${response.status})`)
      return {
        success: false,
        error: errorMessage,
      }
    }

    // Extract data from response (handle different API response formats)
    const responseData = data.data || data.result || data

    // Ensure serverTimestamp is included (may be at root level or in nested data)
    return {
      success: true,
      data: {
        ...responseData,
        serverTimestamp: responseData.serverTimestamp || data.serverTimestamp,
        siteName: responseData.siteName || data.siteName,
        siteAddress: responseData.siteAddress || data.siteAddress,
      },
    }
  } catch (error) {
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

    const data = await response.json()
    devLogApiRaw('/system/attendance/check-out', { status: response.status, data })

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Check-out failed (${response.status})`,
      }
    }

    return {
      success: true,
      data: data.data || data.result || data,
    }
  } catch (error) {
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
  const workerId = profileStorage.getWorkerId() || ''

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
  const workerId = profileStorage.getWorkerId() || ''

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
 * Today's attendance API response item
 */
export interface TodayAttendanceItem {
  id?: string
  siteId: string
  siteName?: string
  siteAddress?: string
  checkInTime: string
  checkOutTime?: string
}

/**
 * Today's attendance API response
 */
export interface TodayAttendanceResponse {
  success: boolean
  data?: TodayAttendanceItem[]
  error?: string
}

/**
 * Fetch today's attendance records from API and sync to localStorage
 */
export const fetchTodayAttendance = async (workerId?: string): Promise<TodayAttendanceResponse> => {
  const id = workerId || profileStorage.getWorkerId()
  if (!id) {
    return { success: false, error: 'No worker ID' }
  }

  try {
    devLogRequestRaw(`/system/attendance/my/today/${id}`, { method: 'GET' })
    const response = await authFetch(`${API_BASE_URL}/system/attendance/my/today`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'X-Tenant-Id': X_TENANT_ID,
      },
    })

    const data = await response.json()
    devLogApiRaw(`/system/attendance/my/today/${id}`, { status: response.status, data })

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Failed to fetch attendance (${response.status})`,
      }
    }

    // Extract records from response
    const records: TodayAttendanceItem[] = data.data || data.result || data || []

    // Sync to localStorage
    syncTodayAttendanceToStorage(records)

    return { success: true, data: records }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Sync API attendance records to localStorage
 */
function syncTodayAttendanceToStorage(records: TodayAttendanceItem[]): void {
  // Clear existing data and set fresh from API
  todayAttendanceStorage.clear()

  if (!records || records.length === 0) {
    return
  }

  // Initialize storage with today's date
  const attendance = todayAttendanceStorage.init()

  // Add each record from API
  for (const record of records) {
    attendance.records.push({
      siteId: record.siteId,
      siteName: record.siteName,
      siteAddress: record.siteAddress,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
    })
  }

  todayAttendanceStorage.set(attendance)
}
