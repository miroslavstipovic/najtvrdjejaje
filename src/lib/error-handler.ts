/**
 * Shared error handling utilities for application and deployment scripts
 */

export interface ErrorInfo {
  message: string;
  stack?: string;
}

/**
 * Safely extracts error information from unknown error types
 */
export function getErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    }
  }
  return {
    message: String(error),
    stack: undefined
  }
}

/**
 * Logs error details with timestamp for debugging
 */
export function logError(context: string, error: unknown): void {
  const errorInfo = getErrorInfo(error)
  console.error(`❌ [${context}] Error: ${errorInfo.message}`)
  if (errorInfo.stack) {
    console.error(`Stack: ${errorInfo.stack}`)
  }
  console.error(`Timestamp: ${new Date().toISOString()}`)
}

/**
 * Creates formatted error details for file writing
 */
export function formatErrorDetails(context: string, error: unknown): string {
  const errorInfo = getErrorInfo(error)
  return `Context: ${context}
Error: ${errorInfo.message}
Stack: ${errorInfo.stack || 'No stack trace available'}
Timestamp: ${new Date().toISOString()}`
}
