export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Solo importar Sentry en producción y si está configurado
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.server.config')
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.edge.config')
    }
  }
}
