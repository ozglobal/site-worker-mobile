import { reportError } from './errorReporter'

/**
 * Unified API result type used across all lib/ functions.
 * Replaces inconsistent error shapes (thrown errors, null, bare arrays).
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Safely parse JSON from a Response.
 * Returns null instead of throwing on malformed/empty responses.
 */
export async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    reportError('JSON_PARSE_FAIL', 'Malformed server response', { level: 'warn' })
    return null
  }
}
