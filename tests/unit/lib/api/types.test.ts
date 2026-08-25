import { describe, it, expect } from 'vitest';
import { getMediaUrl, getMediaUrl, type CourseRow, type ArticleRow } from '@/lib/api/types';

describe('getMediaUrl', () => {
  it('should return null when thumb is null or undefined', () => {
    expect(getMediaUrl(null)).toBeNull();
    expect(getMediaUrl(undefined)).toBeNull();
  });

  it('should return url when thumb is an object', () => {
    const thumb = { url: 'https://example.com/image.jpg' };
    expect(getMediaUrl(thumb)).toBe('https://example.com/image.jpg');
  });

  it('should return null when thumb object has no url', () => {
    const thumb = {};
    expect(getMediaUrl(thumb as CourseRow['thumb'])).toBeNull();
  });

  it('should return null when thumb object has null url', () => {
    const thumb = { url: null };
    expect(getMediaUrl(thumb)).toBeNull();
  });

  it('should return first url when thumb is an array', () => {
    const thumb = [{ url: 'https://example.com/1.jpg' }, { url: 'https://example.com/2.jpg' }];
    expect(getMediaUrl(thumb)).toBe('https://example.com/1.jpg');
  });

  it('should return null when thumb array is empty', () => {
    expect(getMediaUrl([])).toBeNull();
  });

  it('should return null when first element of thumb array has no url', () => {
    expect(getMediaUrl([{}])).toBeNull();
  });

  it('should return null when first element of thumb array has null url', () => {
    expect(getMediaUrl([{ url: null }])).toBeNull();
  });
});

describe('getMediaUrl', () => {
  it('should return null when cover is null or undefined', () => {
    expect(getMediaUrl(null)).toBeNull();
    expect(getMediaUrl(undefined)).toBeNull();
  });

  it('should return url when cover is an object', () => {
    const cover = { url: 'https://example.com/cover.jpg' };
    expect(getMediaUrl(cover)).toBe('https://example.com/cover.jpg');
  });

  it('should return null when cover object has no url', () => {
    const cover = {};
    expect(getMediaUrl(cover as ArticleRow['cover'])).toBeNull();
  });

  it('should return null when cover object has null url', () => {
    const cover = { url: null };
    expect(getMediaUrl(cover)).toBeNull();
  });

  it('should return first url when cover is an array', () => {
    const cover = [{ url: 'https://example.com/c1.jpg' }, { url: 'https://example.com/c2.jpg' }];
    expect(getMediaUrl(cover)).toBe('https://example.com/c1.jpg');
  });

  it('should return null when cover array is empty', () => {
    expect(getMediaUrl([])).toBeNull();
  });

  it('should return null when first element of cover array has no url', () => {
    expect(getMediaUrl([{}])).toBeNull();
  });

  it('should return null when first element of cover array has null url', () => {
    expect(getMediaUrl([{ url: null }])).toBeNull();
  });
});
