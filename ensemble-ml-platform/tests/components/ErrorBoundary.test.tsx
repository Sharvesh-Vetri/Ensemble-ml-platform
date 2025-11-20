/**
 * Tests for the ErrorBoundary component to ensure graceful handling of runtime errors.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useEffect } from 'react'

describe('ErrorBoundary', () => {
  function ProblemChild() {
    useEffect(() => {
      throw new Error('Boom!')
    }, [])

    return <div>Should not render</div>
  }

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div data-testid="fallback">
            <p data-testid="error-message">{error?.message}</p>
          </div>
        )}
      >
        <ProblemChild />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.getByTestId('error-message').textContent).toContain('Boom!')
  })

  it('calls onReset when reset handler is invoked', () => {
    const onReset = jest.fn()

    render(
      <ErrorBoundary
        onReset={onReset}
        fallbackRender={({ reset }) => (
          <button type="button" onClick={reset} data-testid="reset-btn">
            reset
          </button>
        )}
      >
        <ProblemChild />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByTestId('reset-btn'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
