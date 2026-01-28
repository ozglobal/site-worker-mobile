/**
 * Geolocation Skill
 * Pure async functions for getting device location
 */

// ============================================
// Types
// ============================================

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy: number
}

export type GeolocationErrorReason =
  | "unsupported"
  | "denied"
  | "timeout"
  | "unavailable"

export type GeolocationResult =
  | { success: true; location: GeoLocation }
  | { success: false; reason: GeolocationErrorReason }

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

// ============================================
// Skills
// ============================================

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 30000,
}

/**
 * Get current device position
 * Pure async function - wraps browser Geolocation API
 */
export function getCurrentPosition(
  options?: GeolocationOptions
): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ success: false, reason: "unsupported" })
      return
    }

    const opts = { ...DEFAULT_OPTIONS, ...options }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        })
      },
      (error) => {
        let reason: GeolocationErrorReason
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reason = "denied"
            break
          case error.TIMEOUT:
            reason = "timeout"
            break
          case error.POSITION_UNAVAILABLE:
          default:
            reason = "unavailable"
            break
        }
        resolve({ success: false, reason })
      },
      opts
    )
  })
}

/**
 * Map geolocation error reason to user-friendly message
 */
export function getErrorMessage(reason: GeolocationErrorReason): string {
  switch (reason) {
    case "unsupported":
      return "이 브라우저에서는 위치 서비스를 지원하지 않습니다."
    case "denied":
      return "위치 권한이 거부되었습니다."
    case "timeout":
      return "위치 정보 요청 시간이 초과되었습니다."
    case "unavailable":
      return "위치 정보를 사용할 수 없습니다."
  }
}
