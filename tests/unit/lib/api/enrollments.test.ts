import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyEnrollment, enrollInCourse, getUserCourses } from '@/lib/api/enrollments';

// Mocks
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockIn = vi.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Enrollments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default User
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } });

    // Chain setup
    mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
    });

    mockSelect.mockReturnValue({
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        in: mockIn,
    });
    
    // For nested selects in getUserCourses or verify
    mockEq.mockReturnValue({
        eq: mockEq, // chaining multiple eqs
        maybeSingle: mockMaybeSingle,
    });

    mockInsert.mockReturnValue({
        select: mockSelect
    });
  });

  describe('verifyEnrollment', () => {
    it('should return enrollment data if exists', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'enr_1' } });
      
      const result = await verifyEnrollment('course_1');
      
      expect(mockFrom).toHaveBeenCalledWith('enrollment');
      expect(mockEq).toHaveBeenCalledWith('course_id', 'course_1');
      expect(result).toEqual({ id: 'enr_1' });
    });

    it('should return null if user not logged in', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await verifyEnrollment('course_1');
      expect(result).toBeNull();
    });
  });

  describe('enrollInCourse', () => {
    it('should insert new enrollment if not exists', async () => {
        // First verify checks
       mockMaybeSingle
         .mockResolvedValueOnce({ data: null }) // verifyEnrollment returns null
         .mockResolvedValueOnce({ data: { id: 'new_enr' }, error: null }); // insert result

       const result = await enrollInCourse('course_1');

       expect(mockInsert).toHaveBeenCalledWith({
           course_id: 'course_1',
           user_id: 'user_123',
           status: 'active'
       });
       expect(result).toEqual({ id: 'new_enr' });
    });

    it('should return existing if already enrolled', async () => {
       mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'existing_enr' } }); // verify found it
       
       const result = await enrollInCourse('course_1');
       
       expect(mockInsert).not.toHaveBeenCalled();
       expect(result).toEqual({ id: 'existing_enr' });
    });
  });

  describe('getUserCourses', () => {
    it('should calc progress and return summaries', async () => {
        // Enrollement query
        mockEq.mockResolvedValueOnce({ 
            data: [
                { 
                    id: 'enr_1', 
                    status: 'active', 
                    course: { id: 'c1', title: 'C1' } 
                }
            ], 
            error: null 
        });

        // Lessons query (in)
        mockIn.mockResolvedValueOnce({
            data: [
                { id: 'l1', course_id: 'c1' },
                { id: 'l2', course_id: 'c1' }
            ]
        });

        // Progress query (in)
        mockIn.mockResolvedValueOnce({
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
  });
});
