/**
 * Development logging utility
 * ⚠️ Logs are DEV-ONLY and MUST NOT ship to production
 */

const isDev = import.meta.env.DEV

/* ---------------------------------- */
/* Low-level DEV logger                */
/* ---------------------------------- */

const devLog = (level: "log" | "warn" | "error", message: string, data?: unknown) => {
  if (!isDev) return

  if (data !== undefined) {
    console[level](message, data)
  } else {
    console[level](message)
  }
}

/* ---------------------------------- */
/* SAFE helpers (preferred)            */
/* ---------------------------------- */

/**
 * Safe API summary (NO payload)
 */
export const logApiSummary = (
  endpoint: string,
  status?: number,
  durationMs?: number
) => {
  devLog(
    "log",
    `[API] ${endpoint}`,
    { status, durationMs }
  )
}

/**
 * Safe debug message
 */
export const logDebug = (message: string, data?: unknown) => {
  if (!isDev) return
  if (data !== undefined) {
    console.log(`${message}:`, data)
  } else {
    console.log(message)
  }
}

/**
 * Safe error summary
 */
export const logError = (
  message: string,
  info?: { status?: number; code?: string }
) => {
  devLog("error", `[ERROR] ${message}`, info)
}

/* ---------------------------------- */
/* UNSAFE helpers (EXPLICIT)           */
/* ---------------------------------- */

/**
 * Logs raw API response data (always enabled, including production)
 */
export const devLogApiRaw = (
  endpoint: string,
  data: unknown
) => {
  console.log(`[RESPONSE] ${endpoint}`, data)
}

/**
 * Logs raw request params (always enabled, including production)
 */
export const devLogRequestRaw = (
  endpoint: string,
  params?: unknown
) => {
  if (params !== undefined) {
    console.log(`[request] ${endpoint}`, params)
  } else {
    console.log(`[request] ${endpoint}`)
  }
}

/* ---------------------------------- */
/* Paired request/response logger      */
/* ---------------------------------- */

export interface ApiLogHandle {
  end(result: { status: number; data?: unknown } | Error): void
}

// Endpoints to silence in the API log (high-volume / low-signal polls).
const SILENCED_ENDPOINT_PATTERNS: RegExp[] = [
  /\/notices\/inbox(\b|\?|$)/,
]

const shouldSilence = (endpoint: string): boolean =>
  SILENCED_ENDPOINT_PATTERNS.some((re) => re.test(endpoint))

/**
 * Pairs a request log with its response so concurrent calls don't interleave.
 * Output is emitted as a single collapsed console group when `end` is called.
 */
export const devLogApiPair = (
  endpoint: string,
  params?: unknown
): ApiLogHandle => {
  if (shouldSilence(endpoint)) {
    return { end() { /* silenced */ } }
  }
  const startedAt = performance.now()
  return {
    end(result) {
      const duration = Math.round(performance.now() - startedAt)
      const isError = result instanceof Error
      const status = isError ? 'ERR' : result.status
      console.groupCollapsed(`[api] ${endpoint}  ${status}  ${duration}ms`)
      if (params !== undefined) console.log('[request]', params)
      if (isError) {
        console.error('[error]', result)
      } else {
        console.log('[RESPONSE]', { status: result.status, data: result.data })
      }
      console.groupEnd()
    },
  }
}
