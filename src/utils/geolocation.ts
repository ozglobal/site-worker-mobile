/**
 * Geolocation utilities for checking and requesting location permissions
 */

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported'

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

/**
 * Check current geolocation permission status
 */
export const checkLocationPermission = async (): Promise<PermissionStatus> => {
  if (!navigator.geolocation) {
    return 'unsupported'
  }

  if (!navigator.permissions) {
    // Permissions API not supported, assume prompt
    return 'prompt'
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state as PermissionStatus
  } catch {
    // Some browsers don't support querying geolocation permission
    return 'prompt'
  }
}

/**
 * Request location permission and get current position
 * Returns location if granted, null if denied/error
 */
export const requestLocationWithPermission = (): Promise<GeoLocation | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
      },
      () => {
        // Permission denied or error
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Check if location permission is denied (needs settings change)
 */
export const isLocationDenied = async (): Promise<boolean> => {
  const status = await checkLocationPermission()
  return status === 'denied'
}

/**
 * Open device settings (platform-specific, may not work on all browsers)
 */
export const openLocationSettings = () => {
  // For PWA, we can only guide users to browser settings
  // Most browsers don't allow programmatic settings access
  alert('브라우저 설정에서 위치 권한을 허용해주세요.\n\n설정 > 개인정보 보호 > 위치')
}
