/**
 * QR code parsing logic
 */

import type { ApiResult } from './api-result'
import { reportError } from './errorReporter'

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

/**
 * Parsed QR code data structure
 * QR format: "version|siteId|timestamp"
 * Example: "1|d3ccf9f6-1d61-4cd0-903b-22597c7cb7ac|1736390400000"
 */
export interface QRCodeData {
  version: string
  siteId: string
  issuedAt: Date
  rawValue: string
  scannedAt: Date
  location?: GeoLocation
}

/** Parse QR code value: "version|siteId|timestamp" */
export function parseQRValue(rawValue: string, location?: GeoLocation | null): ApiResult<QRCodeData> {
  const parts = rawValue.split('|')
  if (parts.length !== 3) {
    reportError('QR_PARSE_FAIL', 'Invalid QR format', { level: 'warn' })
    return { success: false, error: 'Invalid QR format. Expected: version|siteId|timestamp' }
  }

  const [version, siteId, timestamp] = parts

  const parsedTimestamp = parseInt(timestamp.trim(), 10)
  if (isNaN(parsedTimestamp)) {
    reportError('QR_PARSE_FAIL', 'Invalid timestamp format', { level: 'warn' })
    return { success: false, error: 'Invalid timestamp format' }
  }

  return {
    success: true,
    data: {
      version: version.trim(),
      siteId: siteId.trim(),
      issuedAt: new Date(parsedTimestamp),
      rawValue,
      scannedAt: new Date(),
      location: location || undefined,
    },
  }
}
