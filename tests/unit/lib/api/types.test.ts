import { describe, it, expect } from 'vitest';
import { getThumbUrl, getCoverUrl, type CourseRow, type ArticleRow } from '@/lib/api/types';

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
    const thumb = {};
    expect(getThumbUrl(thumb as CourseRow['thumb'])).toBeNull();
  });

  it('should return null when thumb object has null url', () => {
    const thumb = { url: null };
    expect(getThumbUrl(thumb)).toBeNull();
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

  it('should return null when first element of thumb array has null url', () => {
    expect(getThumbUrl([{ url: null }])).toBeNull();
  });
});

describe('getCoverUrl', () => {
  it('should return null when cover is null or undefined', () => {
    expect(getCoverUrl(null)).toBeNull();
    expect(getCoverUrl(undefined)).toBeNull();
  });

  it('should return url when cover is an object', () => {
    const cover = { url: 'https://example.com/cover.jpg' };
    expect(getCoverUrl(cover)).toBe('https://example.com/cover.jpg');
  });

  it('should return null when cover object has no url', () => {
    const cover = {};
    expect(getCoverUrl(cover as ArticleRow['cover'])).toBeNull();
  });

  it('should return null when cover object has null url', () => {
    const cover = { url: null };
    expect(getCoverUrl(cover)).toBeNull();
  });

  it('should return first url when cover is an array', () => {
    const cover = [{ url: 'https://example.com/c1.jpg' }, { url: 'https://example.com/c2.jpg' }];
    expect(getCoverUrl(cover)).toBe('https://example.com/c1.jpg');
  });

  it('should return null when cover array is empty', () => {
    expect(getCoverUrl([])).toBeNull();
  });

  it('should return null when first element of cover array has no url', () => {
    expect(getCoverUrl([{}])).toBeNull();
  });

  it('should return null when first element of cover array has null url', () => {
    expect(getCoverUrl([{ url: null }])).toBeNull();
  });
});
