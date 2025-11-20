/**
 * Example test file for DatasetCard component
 * 
 * This demonstrates how to test React components.
 * Run with: npm test
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { DatasetCard } from '@/components/DatasetCard'

describe('DatasetCard', () => {
  const mockProps = {
    title: 'Test Dataset',
    description: 'Test description',
    datasetSize: '100 samples',
    factors: 'Factor 1, Factor 2',
    cta: 'Analyze Now',
    onClick: jest.fn(),
    onPreview: jest.fn(),
    accent: 'red' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dataset card with correct content', () => {
    render(<DatasetCard {...mockProps} />)
    
    expect(screen.getByText('Test Dataset')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('100 samples')).toBeInTheDocument()
  })

  it('should call onClick when card is clicked', () => {
    render(<DatasetCard {...mockProps} />)
    
    const card = screen.getByText('Test Dataset').closest('div')
    if (card) {
      fireEvent.click(card)
      expect(mockProps.onClick).toHaveBeenCalledTimes(1)
    }
  })

  it('should call onPreview when preview button is clicked', () => {
    render(<DatasetCard {...mockProps} />)
    
    const previewButton = screen.getByText(/preview/i)
    fireEvent.click(previewButton)
    expect(mockProps.onPreview).toHaveBeenCalledTimes(1)
  })

  // Add more tests for:
  // - Different accent colors
  // - Accessibility (keyboard navigation, ARIA labels)
  // - Visual rendering
})

