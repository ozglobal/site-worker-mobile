/**
 * Unified Location Agent
 * Manages location permission and geolocation state
 * Replaces useLocationPermissionAgent
 */

import { useState, useCallback } from "react"
import {
  getCurrentPosition,
  isActuallyDenied,
} from "./skills"
import type { Location } from "../../home.types"

// ============================================
// Types
// ============================================

export interface LocationAgentState {
  currentLocation: Location | null
  showPermissionPopup: boolean
  isDenied: boolean
}

export interface LocationAgentActions {
  requestLocation: () => Promise<Location | null>
  setLocation: (location: Location) => void
  dismissPopup: () => void
  markDenied: () => void
}

// ============================================
// Agent Hook
// ============================================

export function useLocationAgent(): LocationAgentState & LocationAgentActions {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [showPermissionPopup, setShowPermissionPopup] = useState(false)
  const [isDenied, setIsDenied] = useState(false)

  /**
   * Request location from device
   * Returns location if successful, null otherwise (and shows popup)
   */
  const requestLocation = useCallback(async (): Promise<Location | null> => {
    const result = await getCurrentPosition()

    if (result.success) {
      const location: Location = {
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        accuracy: result.location.accuracy,
      }
      setCurrentLocation(location)
      setIsDenied(false)
      return location
    }

    const actuallyDenied = await isActuallyDenied(result.reason)
    setIsDenied(actuallyDenied)
    setShowPermissionPopup(true)
    return null
  }, [])

  /**
   * Manually set location (e.g., from popup callback)
   */
  const setLocation = useCallback((location: Location) => {
    setCurrentLocation(location)
    setShowPermissionPopup(false)
    setIsDenied(false)
  }, [])

  /**
   * Dismiss the permission popup
   */
  const dismissPopup = useCallback(() => {
    setShowPermissionPopup(false)
    setIsDenied(false)
  }, [])

  /**
   * Mark location as denied (e.g., from popup callback)
   */
  const markDenied = useCallback(() => {
    setIsDenied(true)
  }, [])

  return {
    // State
    currentLocation,
    showPermissionPopup,
    isDenied,
    // Actions
    requestLocation,
    setLocation,
    dismissPopup,
    markDenied,
  }
}
