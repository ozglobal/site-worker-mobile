/**
 * Logging utility — logs in all environments
 */

/* ---------------------------------- */
/* Low-level logger                    */
/* ---------------------------------- */

const devLog = (level: "log" | "warn" | "error", message: string, data?: unknown) => {
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
