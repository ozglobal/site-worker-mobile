/**
 * Global error handlers for uncaught errors and unhandled promise rejections.
 * Call installGlobalErrorHandlers() once in main.tsx before React mounts.
 */

import { reportError } from './errorReporter'

export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    reportError('UNHANDLED_ERROR', event.message || 'Unknown error', {
      stack: event.error?.stack,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message = reason instanceof Error
      ? reason.message
      : String(reason ?? 'Unknown rejection')
    reportError('UNHANDLED_REJECTION', message, {
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })
}
