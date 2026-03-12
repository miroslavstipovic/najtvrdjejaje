/**
 * Re-export from the main error handler in src/lib
 * This ensures scripts use the same error handling utilities as the application
 */

export { 
  ErrorInfo, 
  getErrorInfo, 
  logError, 
  formatErrorDetails 
} from '../src/lib/error-handler'
