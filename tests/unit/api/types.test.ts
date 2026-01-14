import { describe, it, expect } from 'vitest';
import { getThumbUrl, type CourseRow } from '@/lib/api/types';

describe('getThumbUrl', () => {
  it('should return null when thumb is null or undefined', () => {
    expect(getThumbUrl(null)).toBeNull();
    expect(getThumbUrl(undefined)).toBeNull();
  });

  it('should return url when thumb is an object', () => {
    const thumb = { url: 'https://example.com/image.jpg' };
    expect(getThumbUrl(thumb)).toBe('https://example.com/image.jpg');
  });

  it('should return null when thumb object has no url', () => {
     // @ts-ignore - simulating runtime data from Supabase that might be partial
    const thumb = {}; 
    expect(getThumbUrl(thumb as any)).toBeNull();
  });

  it('should return first url when thumb is an array', () => {
    const thumb = [{ url: 'https://example.com/1.jpg' }, { url: 'https://example.com/2.jpg' }];
    expect(getThumbUrl(thumb)).toBe('https://example.com/1.jpg');
  });

  it('should return null when thumb array is empty', () => {
    expect(getThumbUrl([])).toBeNull();
  });
  
  it('should return null when first element of thumb array has no url', () => {
    expect(getThumbUrl([{}])).toBeNull();
  });
});
