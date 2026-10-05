import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
const loaded = vi.hoisted(() => ({ analytics: false, courseDetail: false }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/lib/api/courses', () => ({
  createCourse: vi.fn(), updateCourse: vi.fn(),
  listCourses: vi.fn().mockResolvedValue([{ id: 'c1', title: 'Robótica', description: 'Curso', thumbUrl: null }]),
}));
vi.mock('@/lib/api/profiles', () => ({ listUsersClient: vi.fn().mockResolvedValue([]) }));
vi.mock('@/components/dashboard/CourseManagement/courseDetail', () => {
  loaded.courseDetail = true;
  return { default: () => <div>Detalhes carregados</div> };
});
vi.mock('@/components/dashboard/Analytics/AnalyticsTab', () => {
  loaded.analytics = true;
  return { default: () => <div>Analytics carregado</div> };
});
vi.mock('@/components/dashboard/LearningPathManagement/LearningPathManager', () => ({ default: () => null }));
vi.mock('@/components/dashboard/ChatsPanel', () => ({ default: () => null }));
vi.mock('@/components/dashboard/PendingCorrections', () => ({ default: () => null }));
vi.mock('@/components/dashboard/GameResearch/GameResearchPanel', () => ({ default: () => null }));
import CoursesSection from '@/components/dashboard/courses-section';

describe('Painéis pesados sob demanda', () => {
  it('não importa gráficos e certificados no carregamento inicial e abre ambos quando solicitados', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    const { unmount } = render(<CoursesSection isAdmin />);
    expect(await screen.findByText('Robótica')).toBeInTheDocument();
    expect(loaded.analytics).toBe(false);
    expect(loaded.courseDetail).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar' }));
    expect(await screen.findByText('Detalhes carregados')).toBeInTheDocument();
    expect(loaded.courseDetail).toBe(true);
    expect(loaded.analytics).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));
    await waitFor(() => expect(screen.getByText('Analytics carregado')).toBeInTheDocument());
    expect(loaded.analytics).toBe(true);
    unmount();
    vi.unstubAllGlobals();
  });
});
