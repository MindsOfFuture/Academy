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
    expect(input).toHaveClass('flex', 'h-9', 'w-full', 'rounded-md', 'border', 'border-input', 'bg-transparent', 'px-3', 'py-1', 'text-base', 'shadow-sm', 'transition-colors', 'file:border-0', 'file:bg-transparent', 'file:text-sm', 'file:font-medium', 'file:text-foreground', 'placeholder:text-muted-foreground', 'focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-ring', 'disabled:cursor-not-allowed', 'disabled:opacity-50', 'md:text-sm')
  })

  it('is disabled when disabled prop is passed', () => {
    render(<Input disabled data-testid="disabled-input" />)
    const input = screen.getByTestId('disabled-input')
    expect(input).toBeDisabled()
  })
})
