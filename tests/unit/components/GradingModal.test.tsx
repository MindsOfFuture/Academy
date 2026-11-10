import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/api/assignments', () => ({ gradeSubmission: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
import GradingModal from '@/components/dashboard/CourseManagement/GradingModal';

const submission = {
  id: 's1', studentName: 'Ana', studentEmail: 'ana@x.com', submittedAt: null, gradedAt: null,
  answerUrl: null, contentUrl: null, comments: null, score: null, feedback: null,
} as never;

describe('GradingModal', () => {
  it('expõe diálogo, botão Fechar e fecha com Esc', () => {
    const onClose = vi.fn();
    render(<GradingModal submission={submission} maxScore={10} onClose={onClose} onGraded={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nota/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('Esc não descarta feedback já digitado e o foco entra no diálogo', () => {
    const onClose = vi.fn();
    render(<GradingModal submission={submission} maxScore={10} onClose={onClose} onGraded={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveFocus();
    fireEvent.change(screen.getByLabelText(/Feedback/), { target: { value: 'Muito bom, revise o item 2.' } });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
