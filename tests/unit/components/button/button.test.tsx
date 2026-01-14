import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import Button from '@/components/button/button'

describe('Custom Button Component', () => {
    const originalLocation = window.location;

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
    });

    it('renders with correct text', () => {
        render(<Button Texto="Click Me" Link="/test-link" />)
        expect(screen.getByText('Click Me')).toBeInTheDocument()
    })

    it('navigates to link on click', () => {
        // We need to mock window.location behavior
        // Since window.location is read-only in some environments, we use defineProperty
        // However, in JSDOM it might be configurable.
        
        const mockLocation = { href: '' };
        
        // Try to delete/overwrite location
        try {
             delete (window as any).location;
             window.location = mockLocation as any;
        } catch (e) {
             // If delete fails, try defineProperty
             Object.defineProperty(window, 'location', {
                 configurable: true,
                 value: mockLocation
             })
        }

        render(<Button Texto="Navigate" Link="/new-url" />)
        const button = screen.getByRole('button', { name: /navigate/i })
        
        fireEvent.click(button)
        
        expect(window.location.href).toBe('/new-url')
    })
})
