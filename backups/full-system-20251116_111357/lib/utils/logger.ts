/**
 * Conditional Logger
 * Only logs in development environment
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },

  info: (...args: any[]) => {
    if (isDev) console.info(...args)
  },

  warn: (...args: any[]) => {
    // Always show warnings
    console.warn(...args)
  },

  error: (...args: any[]) => {
    // Always show errors
    console.error(...args)
  },

  debug: (label: string, data: any) => {
    if (isDev) {
      console.log(`🔍 [${label}]`, data)
    }
  }
}
