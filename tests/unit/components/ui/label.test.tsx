import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Label } from '@/components/ui/label'
import React from 'react'

describe('Label Component', () => {
  it('renders correctly', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Label className="text-red-500">Test Label</Label>)
    const label = screen.getByText('Test Label')
    expect(label).toHaveClass('text-red-500')
  })
  
  it('forwards refs', () => {
    const ref = React.createRef<HTMLLabelElement>()
    render(<Label ref={ref}>Ref Label</Label>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })
})
