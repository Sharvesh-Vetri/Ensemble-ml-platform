"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { logger } from "@/lib/logger"

type FallbackRenderArgs = {
  error: Error | null
  reset: () => void
}

type ErrorBoundaryProps = {
  children: ReactNode
  onReset?: () => void
  fallbackRender?: (args: FallbackRenderArgs) => ReactNode
  fallback?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Unhandled error captured by ErrorBoundary", {
      error: error.message,
      componentStack: errorInfo.componentStack,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallbackRender, fallback } = this.props

    if (hasError) {
      if (fallbackRender) {
        return fallbackRender({ error, reset: this.handleReset })
      }

      if (fallback) {
        return fallback
      }

      return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 bg-zinc-950/80 px-6 py-12 text-center text-zinc-100">
          <div className="max-w-lg space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
            <p className="text-sm text-zinc-400">
              An unexpected error occurred while rendering this view. Please try again. If the problem persists, check your Python environment and server logs.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center rounded-md bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return children
  }
}
