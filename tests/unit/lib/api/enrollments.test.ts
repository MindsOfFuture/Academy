import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createMockSupabaseClient,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  type MockSupabaseClient 
} from '@/tests/mocks/supabase';

// Mock do cliente Supabase usando factory
let mockClient: MockSupabaseClient;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockClient,
}));

// Import após o mock
import { verifyEnrollment, enrollInCourse, getUserCourses } from '@/lib/api/enrollments';

describe('Enrollments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    // Default: usuário autenticado
    mockAuthenticatedUser(mockClient, 'user_123');
  });

  describe('verifyEnrollment', () => {
    it('should return enrollment data if exists', async () => {
      mockClient.chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'enr_1' } });
      
      const result = await verifyEnrollment('course_1');
      
      expect(mockClient.from).toHaveBeenCalledWith('enrollment');
      expect(mockClient.chain.eq).toHaveBeenCalledWith('course_id', 'course_1');
      expect(result).toEqual({ id: 'enr_1' });
    });

    it('should return null if user not logged in', async () => {
      mockUnauthenticatedUser(mockClient);
      const result = await verifyEnrollment('course_1');
      expect(result).toBeNull();
    });

    it('should return null if no enrollment found', async () => {
      mockClient.chain.maybeSingle.mockResolvedValueOnce({ data: null });
      
      const result = await verifyEnrollment('course_1');
      expect(result).toBeNull();
    });
  });

  describe('enrollInCourse', () => {
    it('should insert new enrollment if not exists', async () => {
      // First verify checks - not enrolled
      mockClient.chain.maybeSingle
        .mockResolvedValueOnce({ data: null }) // verifyEnrollment returns null
        .mockResolvedValueOnce({ data: { id: 'new_enr' }, error: null }); // insert result

      const result = await enrollInCourse('course_1');

      expect(mockClient.chain.insert).toHaveBeenCalledWith({
        course_id: 'course_1',
        user_id: 'user_123',
        status: 'active'
      });
      expect(result).toEqual({ id: 'new_enr' });
    });

    it('should return existing if already enrolled', async () => {
      mockClient.chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'existing_enr' } });
      
      const result = await enrollInCourse('course_1');
      
      expect(mockClient.chain.insert).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'existing_enr' });
    });

    it('should throw error if user not authenticated', async () => {
      mockUnauthenticatedUser(mockClient);
      
      await expect(enrollInCourse('course_1')).rejects.toThrow('Usuário não autenticado.');
    });

    it('should throw error if insert fails', async () => {
      mockClient.chain.maybeSingle
        .mockResolvedValueOnce({ data: null }) // not enrolled
        .mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });

      await expect(enrollInCourse('course_1')).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('getUserCourses', () => {
    it('should return empty array if user not authenticated', async () => {
      mockUnauthenticatedUser(mockClient);
      
      const result = await getUserCourses();
      expect(result).toEqual([]);
    });

    it('should calc progress and return summaries', async () => {
      // Enrollment query
      mockClient.chain.eq.mockResolvedValueOnce({ 
        data: [
          { 
            id: 'enr_1', 
            status: 'active', 
            course: { id: 'c1', title: 'C1', description: 'Desc' } 
          }
        ], 
        error: null 
      });

      // Lessons query (in)
      mockClient.chain.in.mockResolvedValueOnce({
        data: [
          { id: 'l1', course_id: 'c1' },
          { id: 'l2', course_id: 'c1' }
        ]
      });

      // Progress query (in)
      mockClient.chain.in.mockResolvedValueOnce({
        data: [
          { enrollment_id: 'enr_1', lesson_id: 'l1', is_completed: true }
        ]
      });

      const result = await getUserCourses();

      expect(result).toHaveLength(1);
      const enr = result[0];
      expect(enr.totalLessons).toBe(2);
      expect(enr.completedLessons).toBe(1);
      expect(enr.progressPercent).toBe(50);
      expect(enr.course.title).toBe('C1');
    });

    it('should return 0 progress when no lessons', async () => {
      mockClient.chain.eq.mockResolvedValueOnce({ 
        data: [
          { id: 'enr_1', status: 'active', course: { id: 'c1', title: 'C1' } }
        ], 
        error: null 
      });

      mockClient.chain.in.mockResolvedValueOnce({ data: [] }); // no lessons
      mockClient.chain.in.mockResolvedValueOnce({ data: [] }); // no progress

      const result = await getUserCourses();

      expect(result[0].progressPercent).toBe(0);
      expect(result[0].totalLessons).toBe(0);
    });

    it('should return empty array on error', async () => {
      mockClient.chain.eq.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Error' } 
      });

      const result = await getUserCourses();
      expect(result).toEqual([]);
    });

    it('should handle 100% progress correctly', async () => {
      mockClient.chain.eq.mockResolvedValueOnce({ 
        data: [{ id: 'enr_1', status: 'active', course: { id: 'c1', title: 'C1' } }], 
        error: null 
      });

      mockClient.chain.in.mockResolvedValueOnce({
        data: [{ id: 'l1', course_id: 'c1' }]
      });

      mockClient.chain.in.mockResolvedValueOnce({
        data: [{ enrollment_id: 'enr_1', lesson_id: 'l1', is_completed: true }]
      });

      const result = await getUserCourses();

      expect(result[0].progressPercent).toBe(100);
      expect(result[0].completedLessons).toBe(1);
    });
  });
});
