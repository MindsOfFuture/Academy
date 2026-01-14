import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('c-1', 'c-2')).toBe('c-1 c-2');
  });

  it('should handle conditional classes', () => {
    expect(cn('c-1', true && 'c-2', false && 'c-3')).toBe('c-1 c-2');
  });

  it('should handle undefined and null', () => {
    expect(cn('c-1', undefined, null, 'c-2')).toBe('c-1 c-2');
  });

  it('should merge tailwind classes using tailwind-merge', () => {
    expect(cn('p-4 p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
