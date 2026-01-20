import { describe, it, expect } from 'vitest';
import type { RoleName, CourseAudience } from '@/lib/api/types';

describe('RoleName Type', () => {
  const validRoles: RoleName[] = ['admin', 'teacher', 'student', 'unknown'];

  it('should include admin role', () => {
    expect(validRoles).toContain('admin');
  });

  it('should include teacher role', () => {
    expect(validRoles).toContain('teacher');
  });

  it('should include student role', () => {
    expect(validRoles).toContain('student');
  });

  it('should include unknown role for fallback', () => {
    expect(validRoles).toContain('unknown');
  });

  it('should have exactly 4 valid roles', () => {
    expect(validRoles).toHaveLength(4);
  });
});

describe('CourseAudience Type', () => {
  const validAudiences: CourseAudience[] = ['student', 'teacher'];

  it('should include student audience', () => {
    expect(validAudiences).toContain('student');
  });

  it('should include teacher audience', () => {
    expect(validAudiences).toContain('teacher');
  });

  it('should have exactly 2 valid audiences', () => {
    expect(validAudiences).toHaveLength(2);
  });

  it('should NOT include admin as audience (admin is a role, not audience)', () => {
    expect(validAudiences).not.toContain('admin');
  });
});

describe('Role to Audience Access Matrix', () => {
  /**
   * Access Matrix:
   * | Role    | student courses | teacher courses |
   * |---------|-----------------|-----------------|
   * | student | ✓               | ✗               |
   * | teacher | ✓               | ✓               |
   * | admin   | ✓               | ✓               |
   */

  type AccessMatrix = Record<RoleName, Record<CourseAudience, boolean>>;

  const accessMatrix: AccessMatrix = {
    student: { student: true, teacher: false },
    teacher: { student: true, teacher: true },
    admin: { student: true, teacher: true },
    unknown: { student: false, teacher: false }, // Unknown users have no access
  };

  function canAccess(role: RoleName, audience: CourseAudience): boolean {
    return accessMatrix[role]?.[audience] ?? false;
  }

  describe('Student access', () => {
    it('can access student courses', () => {
      expect(canAccess('student', 'student')).toBe(true);
    });

    it('cannot access teacher courses', () => {
      expect(canAccess('student', 'teacher')).toBe(false);
    });
  });

  describe('Teacher access', () => {
    it('can access student courses', () => {
      expect(canAccess('teacher', 'student')).toBe(true);
    });

    it('can access teacher courses', () => {
      expect(canAccess('teacher', 'teacher')).toBe(true);
    });
  });

  describe('Admin access', () => {
    it('can access student courses', () => {
      expect(canAccess('admin', 'student')).toBe(true);
    });

    it('can access teacher courses', () => {
      expect(canAccess('admin', 'teacher')).toBe(true);
    });
  });

  describe('Unknown role access', () => {
    it('cannot access student courses', () => {
      expect(canAccess('unknown', 'student')).toBe(false);
    });

    it('cannot access teacher courses', () => {
      expect(canAccess('unknown', 'teacher')).toBe(false);
    });
  });
});

describe('Role Hierarchy', () => {
  const roleHierarchy: Record<RoleName, number> = {
    unknown: 0,
    student: 1,
    teacher: 2,
    admin: 3,
  };

  function hasMinimumRole(userRole: RoleName, requiredRole: RoleName): boolean {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  it('admin should have access to all role levels', () => {
    expect(hasMinimumRole('admin', 'student')).toBe(true);
    expect(hasMinimumRole('admin', 'teacher')).toBe(true);
    expect(hasMinimumRole('admin', 'admin')).toBe(true);
  });

  it('teacher should have access to student and teacher levels', () => {
    expect(hasMinimumRole('teacher', 'student')).toBe(true);
    expect(hasMinimumRole('teacher', 'teacher')).toBe(true);
    expect(hasMinimumRole('teacher', 'admin')).toBe(false);
  });

  it('student should only have access to student level', () => {
    expect(hasMinimumRole('student', 'student')).toBe(true);
    expect(hasMinimumRole('student', 'teacher')).toBe(false);
    expect(hasMinimumRole('student', 'admin')).toBe(false);
  });

  it('unknown should have no access', () => {
    expect(hasMinimumRole('unknown', 'student')).toBe(false);
    expect(hasMinimumRole('unknown', 'teacher')).toBe(false);
    expect(hasMinimumRole('unknown', 'admin')).toBe(false);
  });
});

describe('Role Validation', () => {
  const isValidRole = (role: string): role is RoleName => {
    return ['admin', 'teacher', 'student', 'unknown'].includes(role);
  };

  const isValidAudience = (audience: string): audience is CourseAudience => {
    return ['student', 'teacher'].includes(audience);
  };

  it('should validate correct role names', () => {
    expect(isValidRole('admin')).toBe(true);
    expect(isValidRole('teacher')).toBe(true);
    expect(isValidRole('student')).toBe(true);
    expect(isValidRole('unknown')).toBe(true);
  });

  it('should reject invalid role names', () => {
    expect(isValidRole('superadmin')).toBe(false);
    expect(isValidRole('moderator')).toBe(false);
    expect(isValidRole('')).toBe(false);
  });

  it('should validate correct audience values', () => {
    expect(isValidAudience('student')).toBe(true);
    expect(isValidAudience('teacher')).toBe(true);
  });

  it('should reject invalid audience values', () => {
    expect(isValidAudience('admin')).toBe(false);
    expect(isValidAudience('public')).toBe(false);
    expect(isValidAudience('')).toBe(false);
  });
});
