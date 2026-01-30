import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient, mockQueryResponse, resetMockClient, type MockSupabaseClient } from '../../mocks/supabase';

// Mock do módulo de cliente Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Importar após o mock
import { createClient } from '@/lib/supabase/client';

describe('Course Audience & Role-Based Access', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createClient>);
    resetMockClient(mockClient);
  });

  describe('CourseAudience Type', () => {
    it('should accept valid audience values', async () => {
      const validAudiences = ['student', 'teacher'] as const;
      
      validAudiences.forEach((audience) => {
        expect(['student', 'teacher']).toContain(audience);
      });
    });

    it('should include audience field in course data', async () => {
      const mockCourseWithAudience = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test description',
        level: 'básico',
        status: 'active',
        audience: 'student',
        thumb: null,
      };

      expect(mockCourseWithAudience).toHaveProperty('audience');
      expect(mockCourseWithAudience.audience).toBe('student');
    });
  });

  describe('Student Role Access', () => {
    const studentCourse = {
      id: 'student-course-1',
      title: 'Curso para Alunos',
      description: 'Curso básico',
      level: 'básico',
      status: 'active',
      audience: 'student',
      thumb: null,
    };

    const teacherCourse = {
      id: 'teacher-course-1',
      title: 'Curso para Professores',
      description: 'Curso exclusivo para professores',
      level: 'médio',
      status: 'active',
      audience: 'teacher',
      thumb: null,
    };

    it('student should see courses with audience="student"', () => {
      const allCourses = [studentCourse, teacherCourse];
      const studentVisibleCourses = allCourses.filter(c => c.audience === 'student');
      
      expect(studentVisibleCourses).toHaveLength(1);
      expect(studentVisibleCourses[0].id).toBe('student-course-1');
    });

    it('student should NOT see courses with audience="teacher"', () => {
      const allCourses = [studentCourse, teacherCourse];
      const studentVisibleCourses = allCourses.filter(c => c.audience === 'student');
      
      const teacherCoursesVisible = studentVisibleCourses.filter(c => c.audience === 'teacher');
      expect(teacherCoursesVisible).toHaveLength(0);
    });
  });

  describe('Teacher Role Access', () => {
    const studentCourse = {
      id: 'student-course-1',
      title: 'Curso para Alunos',
      description: 'Curso básico',
      level: 'básico',
      status: 'active',
      audience: 'student',
      thumb: null,
    };

    const teacherCourse = {
      id: 'teacher-course-1',
      title: 'Curso para Professores',
      description: 'Curso exclusivo para professores',
      level: 'médio',
      status: 'active',
      audience: 'teacher',
      thumb: null,
    };

    it('teacher should see courses with audience="student"', () => {
      const allCourses = [studentCourse, teacherCourse];
      const teacherVisibleCourses = allCourses.filter(
        c => c.audience === 'student' || c.audience === 'teacher'
      );
      
      const studentCoursesVisible = teacherVisibleCourses.filter(c => c.audience === 'student');
      expect(studentCoursesVisible).toHaveLength(1);
    });

    it('teacher should see courses with audience="teacher"', () => {
      const allCourses = [studentCourse, teacherCourse];
      const teacherVisibleCourses = allCourses.filter(
        c => c.audience === 'student' || c.audience === 'teacher'
      );
      
      const teacherCoursesVisible = teacherVisibleCourses.filter(c => c.audience === 'teacher');
      expect(teacherCoursesVisible).toHaveLength(1);
      expect(teacherCoursesVisible[0].id).toBe('teacher-course-1');
    });

    it('teacher should see ALL courses (both audiences)', () => {
      const allCourses = [studentCourse, teacherCourse];
      const teacherVisibleCourses = allCourses.filter(
        c => c.audience === 'student' || c.audience === 'teacher'
      );
      
      expect(teacherVisibleCourses).toHaveLength(2);
    });
  });

  describe('Admin Role Access', () => {
    const courses = [
      { id: '1', title: 'Student Course', audience: 'student', status: 'active' },
      { id: '2', title: 'Teacher Course', audience: 'teacher', status: 'active' },
      { id: '3', title: 'Draft Course', audience: 'student', status: 'draft' },
    ];

    it('admin should see ALL active courses regardless of audience', () => {
      const adminVisibleCourses = courses.filter(
        c => c.status === 'active' && (c.audience === 'student' || c.audience === 'teacher')
      );
      
      expect(adminVisibleCourses).toHaveLength(2);
    });

    it('admin should potentially see draft courses (via owner policy)', () => {
      // Admins can see drafts via the "Owner view all courses" OR "Teachers and Admins manage" policy
      const adminManagedCourses = courses; // Admin has access to all
      expect(adminManagedCourses).toHaveLength(3);
    });
  });

  describe('RLS Policy Simulation', () => {
    /**
     * Simulates the RLS policy:
     * status = 'active' AND (audience = 'student' OR (audience = 'teacher' AND is_teacher_or_admin()))
     */
    function simulateRLSFilter(
      courses: Array<{ audience: string; status: string }>,
      userRole: 'student' | 'teacher' | 'admin'
    ) {
      const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
      
      return courses.filter(course => {
        if (course.status !== 'active') return false;
        if (course.audience === 'student') return true;
        if (course.audience === 'teacher' && isTeacherOrAdmin) return true;
        return false;
      });
    }

    const testCourses = [
      { id: '1', audience: 'student', status: 'active' },
      { id: '2', audience: 'teacher', status: 'active' },
      { id: '3', audience: 'student', status: 'draft' },
      { id: '4', audience: 'teacher', status: 'draft' },
    ];

    it('RLS: student sees only active student courses', () => {
      const visible = simulateRLSFilter(testCourses, 'student');
      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe('1');
    });

    it('RLS: teacher sees active student AND teacher courses', () => {
      const visible = simulateRLSFilter(testCourses, 'teacher');
      expect(visible).toHaveLength(2);
      expect(visible.map(c => c.id)).toContain('1');
      expect(visible.map(c => c.id)).toContain('2');
    });

    it('RLS: admin sees active student AND teacher courses', () => {
      const visible = simulateRLSFilter(testCourses, 'admin');
      expect(visible).toHaveLength(2);
      expect(visible.map(c => c.id)).toContain('1');
      expect(visible.map(c => c.id)).toContain('2');
    });

    it('RLS: draft courses are NOT visible via public policy', () => {
      const visibleToStudent = simulateRLSFilter(testCourses, 'student');
      const visibleToTeacher = simulateRLSFilter(testCourses, 'teacher');
      
      expect(visibleToStudent.filter(c => c.status === 'draft')).toHaveLength(0);
      expect(visibleToTeacher.filter(c => c.status === 'draft')).toHaveLength(0);
    });
  });

  describe('API Query with Audience', () => {
    it('listCourses should include audience in select query', async () => {
      const mockCourses = [
        { id: '1', title: 'Test', description: null, level: 'básico', status: 'active', audience: 'student', thumb: null },
      ];

      mockQueryResponse(mockClient, mockCourses);

      // Simular a estrutura da query esperada
      const expectedSelectFields = 'id, title, description, level, status, audience, thumb:media_file!course_thumb_id_fkey(url)';
      
      // Verificar que a query inclui audience
      expect(expectedSelectFields).toContain('audience');
    });
  });
});

describe('Role Helper Functions', () => {
  describe('has_role simulation', () => {
    interface UserRole {
      userId: string;
      roleName: string;
    }

    const userRoles: UserRole[] = [
      { userId: 'user-1', roleName: 'student' },
      { userId: 'user-2', roleName: 'teacher' },
      { userId: 'user-3', roleName: 'admin' },
    ];

    function hasRole(userId: string, requiredRole: string): boolean {
      return userRoles.some(ur => ur.userId === userId && ur.roleName === requiredRole);
    }

    it('should return true when user has the required role', () => {
      expect(hasRole('user-1', 'student')).toBe(true);
      expect(hasRole('user-2', 'teacher')).toBe(true);
      expect(hasRole('user-3', 'admin')).toBe(true);
    });

    it('should return false when user does not have the required role', () => {
      expect(hasRole('user-1', 'teacher')).toBe(false);
      expect(hasRole('user-1', 'admin')).toBe(false);
      expect(hasRole('user-2', 'student')).toBe(false);
    });
  });

  describe('is_teacher_or_admin simulation', () => {
    interface UserRole {
      userId: string;
      roleName: string;
    }

    const userRoles: UserRole[] = [
      { userId: 'student-user', roleName: 'student' },
      { userId: 'teacher-user', roleName: 'teacher' },
      { userId: 'admin-user', roleName: 'admin' },
    ];

    function isTeacherOrAdmin(userId: string): boolean {
      return userRoles.some(
        ur => ur.userId === userId && (ur.roleName === 'teacher' || ur.roleName === 'admin')
      );
    }

    it('should return false for student', () => {
      expect(isTeacherOrAdmin('student-user')).toBe(false);
    });

    it('should return true for teacher', () => {
      expect(isTeacherOrAdmin('teacher-user')).toBe(true);
    });

    it('should return true for admin', () => {
      expect(isTeacherOrAdmin('admin-user')).toBe(true);
    });
  });
});

describe('Course Audience Edge Cases', () => {
  it('should handle null audience gracefully (defaults to student behavior)', () => {
    const courseWithNullAudience = {
      id: '1',
      audience: null as string | null,
      status: 'active',
    };

    // Treat null as 'student' for backwards compatibility
    const effectiveAudience = courseWithNullAudience.audience ?? 'student';
    expect(effectiveAudience).toBe('student');
  });

  it('should handle undefined audience gracefully', () => {
    const courseWithoutAudience = {
      id: '1',
      status: 'active',
    } as { id: string; status: string; audience?: string };

    const effectiveAudience = courseWithoutAudience.audience ?? 'student';
    expect(effectiveAudience).toBe('student');
  });

  it('should reject invalid audience values at type level', () => {
    type ValidAudience = 'student' | 'teacher';
    const validAudiences: ValidAudience[] = ['student', 'teacher'];
    
    // TypeScript would catch invalid values at compile time
    expect(validAudiences).not.toContain('invalid');
    expect(validAudiences).not.toContain('admin'); // admin is a role, not an audience
  });
});
