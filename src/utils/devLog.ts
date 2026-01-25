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
    console.log(`[DEBUG] ${message}:`, data)
  } else {
    console.log(`[DEBUG] ${message}`)
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
 * ⚠️ DEV-ONLY: logs raw API data (tokens, PII, etc.)
 * MUST be removed before production
 */
export const devLogApiRaw = (
  endpoint: string,
  data: unknown
) => {
  devLog("warn", `[DEV-ONLY][API RAW] ${endpoint}`, data)
}

/**
 * ⚠️ DEV-ONLY: logs raw request params
 */
export const devLogRequestRaw = (
  endpoint: string,
  params?: unknown
) => {
  devLog("warn", `[DEV-ONLY][REQUEST RAW] ${endpoint}`, params)
}
