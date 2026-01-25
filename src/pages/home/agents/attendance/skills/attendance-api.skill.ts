/**
 * Attendance API Skill
 * Pure async functions for check-in/check-out API calls
 */

import type { Location } from "../../../home.types"

// ============================================
// Types
// ============================================

export interface CheckInParams {
  siteId: string
  qrTimestamp: Date
  location?: Location
}

export interface CheckOutParams {
  siteId: string
  checkInTime?: string
  location?: Location
}

export interface CheckInSuccessData {
  siteId: string
  siteName: string
  siteAddress: string
  serverTimestamp: string
}

export type CheckInApiResult =
  | { success: true; data: CheckInSuccessData }
  | { success: false; error: string }

export type CheckOutApiResult =
  | { success: true }
  | { success: false; error: string }

// Dependencies type for injection
// Uses generic request types to allow any compatible API implementations
export interface AttendanceApiDeps {
  buildCheckInRequest: (params: {
    siteId: string
    qrTimestamp: Date
    location?: Location
  }) => unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkIn: (request: any) => Promise<{
    success: boolean
    data?: {
      serverTimestamp?: string
      checkInTime?: string
      siteName?: string
      siteAddress?: string
    }
    error?: string
  }>
  buildCheckOutRequest: (params: {
    siteId: string
    checkInTime?: string
    location?: Location
  }) => unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkOut: (request: any) => Promise<{
    success: boolean
    data?: unknown
    error?: string
  }>
}

// ============================================
// Skills
// ============================================

/**
 * Execute check-in API call
 * Pure async function - dependencies are injected
 */
export async function executeCheckInApi(
  params: CheckInParams,
  deps: Pick<AttendanceApiDeps, "buildCheckInRequest" | "checkIn">
): Promise<CheckInApiResult> {
  try {
    const request = deps.buildCheckInRequest({
      siteId: params.siteId,
      qrTimestamp: params.qrTimestamp,
      location: params.location,
    })

    const result = await deps.checkIn(request)

    if (result.success) {
      return {
        success: true,
        data: {
          siteId: params.siteId,
          siteName: result.data?.siteName || "",
          siteAddress: result.data?.siteAddress || "",
          serverTimestamp:
            result.data?.serverTimestamp ||
            String(result.data?.checkInTime) ||
            "",
        },
      }
    }

    return {
      success: false,
      error: result.error || "출근 처리에 실패했습니다.",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "네트워크 오류가 발생했습니다.",
    }
  }
}

/**
 * Execute check-out API call
 * Pure async function - dependencies are injected
 */
export async function executeCheckOutApi(
  params: CheckOutParams,
  deps: Pick<AttendanceApiDeps, "buildCheckOutRequest" | "checkOut">
): Promise<CheckOutApiResult> {
  try {
    const request = deps.buildCheckOutRequest({
      siteId: params.siteId,
      checkInTime: params.checkInTime,
      location: params.location,
    })

    const result = await deps.checkOut(request)

    if (result.success) {
      return { success: true }
    }

    return {
      success: false,
      error: result.error || "퇴근 처리에 실패했습니다.",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "네트워크 오류가 발생했습니다.",
    }
  }
}
