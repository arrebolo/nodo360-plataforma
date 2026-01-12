'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

// Helper para reportar errores (Sentry cuando esté instalado)
function captureException(error: Error, context?: Record<string, unknown>) {
  // En producción, Sentry capturará esto automáticamente
  // Por ahora, solo logueamos a consola en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Captured]', error, context)
  }
}

/**
 * ErrorBoundary Component
 *
 * Captura errores en componentes hijos y muestra un fallback.
 * Reporta automáticamente a Sentry si está configurado.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Reportar a Sentry si está disponible
    captureException(error, {
      componentStack: errorInfo.componentStack,
    })

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Error capturado:', error)
      console.error('[ErrorBoundary] Component Stack:', errorInfo.componentStack)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <p className="text-white/80 mb-4">
            Error al cargar esta sección.
          </p>

          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-sm font-medium text-orange-400 hover:text-orange-300 hover:underline transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook wrapper para usar ErrorBoundary de forma más sencilla
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
