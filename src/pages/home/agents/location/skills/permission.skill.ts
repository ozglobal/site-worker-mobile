/**
 * Permission Skill
 * Pure async functions for checking geolocation permission status
 */

// ============================================
// Types
// ============================================

export type PermissionState = "granted" | "denied" | "prompt" | "unsupported"

// ============================================
// Skills
// ============================================

/**
 * Check current geolocation permission status via Permissions API
 * Pure async function - no side effects
 */
export async function checkGeolocationPermission(): Promise<PermissionState> {
  if (!navigator.geolocation) {
    return "unsupported"
  }

  if (!navigator.permissions) {
    // Permissions API not supported, assume prompt
    return "prompt"
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" })
    return result.state as PermissionState
  } catch {
    // Some browsers don't support querying geolocation permission
    return "prompt"
  }
}

/**
 * Determine if geolocation error is actually a permission denial
 * Uses Permissions API to verify since PERMISSION_DENIED error can occur
 * even when permission is granted (e.g., system location off, insecure origin)
 */
export async function isActuallyDenied(
  errorReason: string
): Promise<boolean> {
  if (errorReason !== "denied") {
    return false
  }
  const permissionState = await checkGeolocationPermission()
  return permissionState === "denied"
}
