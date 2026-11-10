import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
const createCourse = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/lib/api/courses', () => ({
  createCourse, updateCourse: vi.fn(), listCourses: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/api/profiles', () => ({ listUsersClient: vi.fn().mockResolvedValue([]) }));
vi.mock('@/components/dashboard/LearningPathManagement/LearningPathManager', () => ({ default: () => null }));
vi.mock('@/components/dashboard/ChatsPanel', () => ({ default: () => null }));
vi.mock('@/components/dashboard/PendingCorrections', () => ({ default: () => null }));
vi.mock('@/components/dashboard/GameResearch/GameResearchPanel', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
import toast from 'react-hot-toast';
import CoursesSection from '@/components/dashboard/courses-section';

async function abrirEPreencher() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  render(<CoursesSection isAdmin />);
  fireEvent.click(await screen.findByRole('button', { name: 'Criar novo curso' }));
  fireEvent.change(screen.getByPlaceholderText('Título do curso'), { target: { value: 'Robótica' } });
  fireEvent.change(screen.getByPlaceholderText('Descrição do curso'), { target: { value: 'Curso' } });
}

describe('Salvar curso', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    createCourse.mockReset();
  });

  it('mantém o modal e o que foi digitado quando a criação falha', async () => {
    createCourse.mockResolvedValue(null);
    await abrirEPreencher();
    fireEvent.click(screen.getByRole('button', { name: 'Criar Curso' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao criar curso.'));
    expect(screen.getByPlaceholderText('Título do curso')).toHaveValue('Robótica');
  });

  it('não cria duas vezes com cliques repetidos', async () => {
    createCourse.mockReturnValue(new Promise(() => {}));
    await abrirEPreencher();
    const botao = screen.getByRole('button', { name: 'Criar Curso' });
    fireEvent.click(botao);
    fireEvent.click(botao);
    expect(createCourse).toHaveBeenCalledTimes(1);
  });
});
