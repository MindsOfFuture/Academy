// tests/unit/components/ui/card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Component', () => {
    it('should render Card and subcomponents correctly', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>Card Content</CardContent>
                <CardFooter>Card Footer</CardFooter>
            </Card>
        );

        expect(screen.getByText('Card Title')).toBeInTheDocument();
        expect(screen.getByText('Card Description')).toBeInTheDocument();
        expect(screen.getByText('Card Content')).toBeInTheDocument();
        expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });

    it('should apply custom classes', () => {
        render(<Card className="custom-class">Content</Card>);
        // We look for the text to find the element, hopefully it's the card div or inside it. 
        // Best to test simple div render.
        const content = screen.getByText('Content');
        // The card is the parent of the content text if rendered directly
        expect(content.closest('div')).toHaveClass('custom-class');
    });
});
