import { authFetch } from './auth'
import { devLogApiRaw, devLogRequestRaw } from '../utils/devLog'
import { profileStorage, todayAttendanceStorage, monthlyAttendanceStorage } from './storage'

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

    // Ensure all fields are included (may be at root level or in nested data)
    return {
      success: true,
      data: {
        ...responseData,
        attendanceId: responseData.attendanceId || responseData.id || data.attendanceId || data.id,
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
 * Uses localStorage as cache - only calls API if no cached data exists
 * @param year - 4-digit year (e.g. 2026)
 * @param month - 1-based month (1–12)
 * @param forceRefresh - If true, bypass cache and always fetch from API
 */
export const fetchMonthlyAttendance = async (
  year: number,
  month: number,
  forceRefresh: boolean = false
): Promise<MonthlyAttendanceResponse> => {
  const cacheKey = `${year}-${month}`

  // Check localStorage cache first (skip if forceRefresh)
  if (!forceRefresh) {
    const cachedRecords = monthlyAttendanceStorage.get(year, month)
    if (cachedRecords) {
      const summary = monthlyAttendanceStorage.getSummary(year, month)
      return {
        success: true,
        data: {
          records: cachedRecords as WeeklyAttendanceRecord[],
          attendanceDays: summary?.attendanceDays ?? 0,
          totalWorkHours: 0,
          totalWorkEffort: summary?.totalWorkEffort ?? 0,
          startDate: '',
          endDate: '',
        },
      }
    }
  }

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

      const data = await response.json()
      devLogApiRaw(endpoint, { status: response.status, data })

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `Failed to fetch monthly attendance (${response.status})`,
        }
      }

      const payload = data.data || data
      const records = payload.records || []
      const attendanceDays = payload.attendanceDays || 0
      const totalWorkEffort = payload.totalWorkEffort || 0

      // Save to localStorage with year/month context (including summary data)
      monthlyAttendanceStorage.set(year, month, records, attendanceDays, totalWorkEffort)

      // Also sync today's records to todayAttendanceStorage
      syncTodayRecordsFromMonthly(records)

      return {
        success: true,
        data: {
          records,
          attendanceDays: payload.attendanceDays || 0,
          totalWorkHours: payload.totalWorkHours || 0,
          totalWorkEffort: payload.totalWorkEffort || 0,
          startDate: payload.startDate || '',
          endDate: payload.endDate || '',
        },
      }
    } catch (error) {
      console.error('[MONTHLY] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    } finally {
      // Clear from in-flight requests after completion
      monthlyAttendanceRequests.delete(cacheKey)
    }
  })()

  // Store the in-flight request
  monthlyAttendanceRequests.set(cacheKey, request)

  return request
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
      id: record.id,
      siteId: record.siteId,
      siteName: record.siteName,
      siteAddress: record.siteAddress,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
    })
  }

  todayAttendanceStorage.set(attendance)
}

/**
 * Sync today's records from monthly attendance data to todayAttendanceStorage
 * Merges with existing local records to preserve any not-yet-indexed check-ins
 */
function syncTodayRecordsFromMonthly(monthlyRecords: WeeklyAttendanceRecord[]): void {
  // Get today's date in YYYY-MM-DD format for comparison
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Filter records for today from monthly data
  const serverRecords = monthlyRecords.filter((record) => {
    return record.effectiveDate === todayStr
  })

  // Helper to convert timestamp to ISO string safely
  // Handles: number (timestamp), string with Z (ISO), string without Z, undefined
  const toIsoString = (time: number | string | undefined): string | undefined => {
    if (time === undefined || time === null) {
      return undefined
    }
    if (typeof time === 'number') {
      return new Date(time).toISOString()
    }
    // If string already has Z suffix, return as-is
    if (time.endsWith('Z')) {
      return time
    }
    // String without Z - assume it's already in UTC, just add Z
    // This avoids timezone parsing issues
    return time + 'Z'
  }

  // Convert server records to TodayAttendanceItem format
  // Filter out records without checkInTime (invalid attendance records)
  const serverItems: TodayAttendanceItem[] = serverRecords
    .filter((record) => record.checkInTime !== undefined && record.checkInTime !== null)
    .map((record) => ({
      id: record.id,
      siteId: record.siteId,
      siteName: record.siteName,
      checkInTime: toIsoString(record.checkInTime)!,
      checkOutTime: record.checkOutTime ? toIsoString(record.checkOutTime) : undefined,
    }))

  // Get existing local records
  const localRecords = todayAttendanceStorage.getRecords()

  // Build map of local records by ID and siteId for lookup
  const localById = new Map(localRecords.filter(r => r.id).map(r => [r.id, r]))
  const localBySiteId = new Map(localRecords.map(r => [r.siteId, r]))

  // Merge server records with local data, preserving local checkOutTime if server doesn't have it
  // This handles race condition where checkout succeeds locally but server hasn't indexed it yet
  const mergedServerItems = serverItems.map((serverRecord) => {
    const localRecord = serverRecord.id
      ? localById.get(serverRecord.id)
      : localBySiteId.get(serverRecord.siteId)

    // If local has checkOutTime but server doesn't, preserve local checkOutTime
    if (localRecord?.checkOutTime && !serverRecord.checkOutTime) {
      return {
        ...serverRecord,
        checkOutTime: localRecord.checkOutTime,
      }
    }
    return serverRecord
  })

  // Build sets for quick lookup
  const serverIds = new Set(serverItems.map((r) => r.id).filter(Boolean))
  const serverSiteIds = new Set(serverItems.map((r) => r.siteId))

  // Keep local records that don't exist in server response (newly added, not yet indexed)
  const localOnlyRecords = localRecords.filter((local) => {
    // If local has ID and it's in server IDs, it's handled in merge above
    if (local.id && serverIds.has(local.id)) {
      return false
    }
    // If server has a record for the same site, it's handled in merge above
    if (serverSiteIds.has(local.siteId)) {
      return false
    }
    // Keep: truly local-only record (server hasn't indexed it yet)
    return true
  })

  // Merge: server records (with preserved local checkOutTime) + local-only records
  const mergedItems = [...mergedServerItems, ...localOnlyRecords]

  // Sync merged records to storage
  syncTodayAttendanceToStorage(mergedItems)
}
