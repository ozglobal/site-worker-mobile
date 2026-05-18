/**
 * Client error reporter
 *
 * Collects errors, deduplicates, batches, and sends to a backend endpoint.
 * Endpoint is configured via configure() — until then, errors are queued
 * and logged to console in development.
 */

import { getWorkerId } from './auth'

export interface ErrorPayload {
  level: 'error' | 'warn'
  code: string
  message: string
  endpoint?: string
  httpStatus?: number
  timestamp: string
  url: string
  workerId?: string
  userAgent: string
  appVersion: string
  stack?: string
  count: number
}

interface ReporterConfig {
  endpoint: string
}

// Module state
let config: ReporterConfig | null = null
const queue: ErrorPayload[] = []
const recentCodes = new Map<string, { timestamp: number; index: number }>()

const MAX_QUEUE_SIZE = 50
const DEDUP_WINDOW_MS = 60_000
const FLUSH_INTERVAL_MS = 10_000
const APP_VERSION = '1.0.0'

let flushTimer: ReturnType<typeof setInterval> | null = null

/**
 * Configure the error reporter with a backend endpoint.
 * Call this in main.tsx once the URL is known.
 */
export function configureErrorReporter(cfg: ReporterConfig): void {
  config = cfg
  startFlushTimer()
}

/**
 * Report an error. This is the main public API.
 *
 * @param code - Error code (e.g. "AUTH_LOGIN_FAIL")
 * @param message - Human-readable description
 * @param extra - Optional additional fields (endpoint, httpStatus, stack, level)
 */
export function reportError(
  code: string,
  message: string,
  extra?: Partial<Pick<ErrorPayload, 'endpoint' | 'httpStatus' | 'stack' | 'level'>>
): void {
  // Dedup: same code within 60 seconds → increment count
  const recent = recentCodes.get(code)
  const now = Date.now()

  if (recent && now - recent.timestamp < DEDUP_WINDOW_MS) {
    const existing = queue[recent.index]
    if (existing) {
      existing.count++
      return
    }
  }

  const payload: ErrorPayload = {
    level: extra?.level ?? 'error',
    code,
    message,
    endpoint: extra?.endpoint,
    httpStatus: extra?.httpStatus,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    workerId: getWorkerId() ?? undefined,
    userAgent: navigator.userAgent,
    appVersion: APP_VERSION,
    stack: extra?.stack,
    count: 1,
  }

  // Enforce max queue size — drop oldest
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift()
  }

  const index = queue.push(payload) - 1
  recentCodes.set(code, { timestamp: now, index })

  // In development, also log to console
  if (import.meta.env.DEV) {
    console.warn(`[ErrorReporter] ${code}: ${message}`, extra)
  }
}

/**
 * Flush queued errors to the backend endpoint.
 */
async function flush(): Promise<void> {
  if (!config || queue.length === 0) return

  const batch = queue.splice(0)
  recentCodes.clear()

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': '0',
    }

    // Try to include auth token if available
    const { getAccessToken } = await import('./auth')
    const token = getAccessToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ errors: batch }),
    })
  } catch {
    // Fail silently — never cause secondary crash
  }
}

function startFlushTimer(): void {
  if (flushTimer) return

  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS)

  // Flush on page hide (tab close, navigation away)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush()
    }
  })
}
