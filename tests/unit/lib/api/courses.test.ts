import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listCourses, getCourseDetail } from '@/lib/api/courses';

// Mock types
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

const mockSupabase = {
  from: mockFrom,
};

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Courses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default chain for simple queries
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
        order: mockOrder,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
    });

    mockOrder.mockReturnThis();
    mockEq.mockReturnThis(); // Chainable
  });

  describe('listCourses', () => {
    it('should return mapped courses on success', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Course 1',
          description: 'Desc 1',
          level: 'Beginner',
          status: 'published',
          thumb: { url: 'http://img.com/1.jpg' } // Single object structure per typical Supabase join
        }
      ];

      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await listCourses();

      expect(mockFrom).toHaveBeenCalledWith('course');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id, title'));
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        title: 'Course 1',
        description: 'Desc 1',
        level: 'Beginner',
        status: 'published',
        thumbUrl: 'http://img.com/1.jpg'
      });
    });

    it('should return empty array on error', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'Error' } });

      const result = await listCourses();
      expect(result).toEqual([]);
    });
  });

  describe('getCourseDetail', () => {
    it('should return mapped course detail on success', async () => {
        // Setup chain for maybeSingle
        mockSelect.mockReturnValue({
            eq: mockEq
        });
        mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle
        });

      const mockData = {
        id: '1',
        title: 'Course 1',
        modules: [
          {
            id: 'm1',
            title: 'Module 1',
            lessons: [
              { id: 'l1', title: 'Lesson 1' }
            ]
          }
        ]
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getCourseDetail('1');

      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Course 1');
      expect(result?.modules).toHaveLength(1);
      expect(result?.modules[0].lessons).toHaveLength(1);
    });

    it('should return null on error or not found', async () => {
        // Setup chain
        mockSelect.mockReturnValue({
            eq: mockEq
        });
        mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle
        });

      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'Ex' } });

      const result = await getCourseDetail('999');
      expect(result).toBeNull();
    });
  });
});
