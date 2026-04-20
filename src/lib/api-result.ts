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
 * An empty body (typical for `R<Void>` endpoints) is treated as success
 * with `null` and is NOT reported as a parse failure.
 */
export async function safeJson(response: Response): Promise<unknown> {
  let text: string
  try {
    text = await response.text()
  } catch {
    reportError('JSON_PARSE_FAIL', 'Malformed server response', { level: 'warn' })
    return null
  }
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    reportError('JSON_PARSE_FAIL', 'Malformed server response', { level: 'warn' })
    return null
  }
}
