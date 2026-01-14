import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from '@/components/ui/input'
import React from 'react'

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="test input" />)
    const input = screen.getByPlaceholderText('test input')
    expect(input).toBeInTheDocument()
  })

  it('forwards refs', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('applies custom className', () => {
    render(<Input data-testid="input" className="custom-class" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-class')
  })

  it('handles different types', () => {
    render(<Input type="password" data-testid="password-input" />)
    const input = screen.getByTestId('password-input')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveClass('flex', 'rounded-md', 'border')
  })

  it('is disabled when disabled prop is passed', () => {
    render(<Input disabled data-testid="disabled-input" />)
    const input = screen.getByTestId('disabled-input')
    expect(input).toBeDisabled()
  })
})
