import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createMockSupabaseClient,
  type MockSupabaseClient 
} from '@/tests/mocks/supabase';

// Mock do cliente Supabase usando factory
let mockClient: MockSupabaseClient;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockClient,
}));

// Import após o mock
import { listCourses, getCourseDetail } from '@/lib/api/courses';

describe('Courses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
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
          thumb: { url: 'http://img.com/1.jpg' }
        }
      ];

      mockClient.chain.order.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await listCourses();

      expect(mockClient.from).toHaveBeenCalledWith('course');
      expect(mockClient.chain.select).toHaveBeenCalledWith(expect.stringContaining('id, title'));
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
      mockClient.chain.order.mockResolvedValueOnce({ data: null, error: { message: 'Error' } });

      const result = await listCourses();
      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      mockClient.chain.order.mockResolvedValueOnce({ data: null, error: null });

      const result = await listCourses();
      expect(result).toEqual([]);
    });

    it('should handle thumb as array', async () => {
      const mockData = [
        {
          id: '2',
          title: 'Course 2',
          description: 'Desc 2',
          level: 'Advanced',
          status: 'draft',
          thumb: [{ url: 'http://img.com/array.jpg' }]
        }
      ];

      mockClient.chain.order.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await listCourses();

      expect(result[0].thumbUrl).toBe('http://img.com/array.jpg');
    });

    it('should handle null thumb', async () => {
      const mockData = [
        {
          id: '3',
          title: 'Course 3',
          description: null,
          level: null,
          status: null,
          thumb: null
        }
      ];

      mockClient.chain.order.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await listCourses();

      expect(result[0].thumbUrl).toBeNull();
      expect(result[0].description).toBeNull();
    });
  });

  describe('getCourseDetail', () => {
    it('should return mapped course detail on success', async () => {
      // Setup chain for maybeSingle
      mockClient.chain.select.mockReturnValue({
        eq: mockClient.chain.eq
      });
      mockClient.chain.eq.mockReturnValue({
        maybeSingle: mockClient.chain.maybeSingle
      });

      const mockData = {
        id: '1',
        title: 'Course 1',
        description: 'Description',
        level: 'Beginner',
        status: 'published',
        thumb: { url: 'http://img.com/1.jpg' },
        modules: [
          {
            id: 'm1',
            title: 'Module 1',
            order: 1,
            lessons: [
              { 
                id: 'l1', 
                title: 'Lesson 1',
                description: 'Lesson desc',
                duration_minutes: 30,
                content_url: 'http://video.com/1',
                content_type: 'video',
                order: 1,
                is_public: true
              }
            ]
          }
        ]
      };

      mockClient.chain.maybeSingle.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getCourseDetail('1');

      expect(mockClient.chain.eq).toHaveBeenCalledWith('id', '1');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Course 1');
      expect(result?.modules).toHaveLength(1);
      expect(result?.modules[0].lessons).toHaveLength(1);
      expect(result?.modules[0].lessons[0].durationMinutes).toBe(30);
    });

    it('should return null on error', async () => {
      mockClient.chain.select.mockReturnValue({
        eq: mockClient.chain.eq
      });
      mockClient.chain.eq.mockReturnValue({
        maybeSingle: mockClient.chain.maybeSingle
      });

      mockClient.chain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'Error' } });

      const result = await getCourseDetail('999');
      expect(result).toBeNull();
    });

    it('should return null when course not found', async () => {
      mockClient.chain.select.mockReturnValue({
        eq: mockClient.chain.eq
      });
      mockClient.chain.eq.mockReturnValue({
        maybeSingle: mockClient.chain.maybeSingle
      });

      mockClient.chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await getCourseDetail('non-existent');
      expect(result).toBeNull();
    });

    it('should handle course without modules', async () => {
      mockClient.chain.select.mockReturnValue({
        eq: mockClient.chain.eq
      });
      mockClient.chain.eq.mockReturnValue({
        maybeSingle: mockClient.chain.maybeSingle
      });

      const mockData = {
        id: '2',
        title: 'Course Without Modules',
        modules: []
      };

      mockClient.chain.maybeSingle.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getCourseDetail('2');

      expect(result?.modules).toHaveLength(0);
    });

    it('should handle module without lessons', async () => {
      mockClient.chain.select.mockReturnValue({
        eq: mockClient.chain.eq
      });
      mockClient.chain.eq.mockReturnValue({
        maybeSingle: mockClient.chain.maybeSingle
      });

      const mockData = {
        id: '3',
        title: 'Course',
        modules: [
          { id: 'm1', title: 'Empty Module', lessons: [] }
        ]
      };

      mockClient.chain.maybeSingle.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getCourseDetail('3');

      expect(result?.modules[0].lessons).toHaveLength(0);
    });
  });
});
