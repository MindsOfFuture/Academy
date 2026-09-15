import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  params: new Map<string, string>(),
  track: vi.fn().mockResolvedValue(undefined),
  video: vi.fn().mockResolvedValue(undefined),
  getCourseDetail: vi.fn(),
  enrollInCourse: vi.fn(),
  verifyEnrollment: vi.fn(),
  fetchLessonProgress: vi.fn(),
  toggleLessonProgress: vi.fn(),
  listCourseAssignments: vi.fn(),
  getUserCourseSubmissions: vi.fn(),
  checkCourseCompletion: vi.fn(),
  getExistingCertificate: vi.fn(),
  issueCertificate: vi.fn(),
  getAssignment: vi.fn(),
  getUserSubmission: vi.fn(),
  submitAssignment: vi.fn(),
  updateSubmission: vi.fn(),
  deleteSubmission: vi.fn(),
  getCurrentChatUser: vi.fn(),
  pdf: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (key: string) => mocks.params.get(key) ?? null }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/image", () => ({ default: () => React.createElement("span", { "data-testid": "imagem" }) }));
vi.mock("@/components/navbar/navbar", () => ({ default: () => React.createElement("nav") }));
vi.mock("@/components/content-review/ContentReview", () => ({ default: () => null }));
vi.mock("@/components/activities/activity-chat", () => ({ default: () => null }));
vi.mock("react-hot-toast", () => ({ default: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock("@/lib/services/tracking.service", () => ({
  trackingService: { trackLearningEvent: mocks.track, trackVideoInteraction: mocks.video },
}));
vi.mock("@/lib/api/courses", () => ({ getCourseDetail: mocks.getCourseDetail }));
vi.mock("@/lib/api/enrollments", () => ({
  enrollInCourse: mocks.enrollInCourse,
  verifyEnrollment: mocks.verifyEnrollment,
  fetchLessonProgress: mocks.fetchLessonProgress,
  toggleLessonProgress: mocks.toggleLessonProgress,
}));
vi.mock("@/lib/api/assignments", () => ({
  listCourseAssignments: mocks.listCourseAssignments,
  getUserCourseSubmissions: mocks.getUserCourseSubmissions,
  getAssignment: mocks.getAssignment,
  getUserSubmission: mocks.getUserSubmission,
  submitAssignment: mocks.submitAssignment,
  updateSubmission: mocks.updateSubmission,
  deleteSubmission: mocks.deleteSubmission,
}));
vi.mock("@/lib/api/certificates", () => ({
  checkCourseCompletion: mocks.checkCourseCompletion,
  getExistingCertificate: mocks.getExistingCertificate,
  issueCertificate: mocks.issueCertificate,
}));
vi.mock("@/lib/api/activity-chat", () => ({ getCurrentChatUser: mocks.getCurrentChatUser }));
vi.mock("@/lib/utils/pdfGenerator", () => ({ generateAndDownloadCertificate: mocks.pdf }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select() { return this; },
      eq() { return this; },
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

import CoursePage from "@/app/course/page";
import ActivitiePage from "@/app/protected/activitie/page";

const COURSE_ID = "123e4567-e89b-42d3-a456-426614174000";
const LESSON_ID = "223e4567-e89b-42d3-a456-426614174000";
const ASSIGNMENT_ID = "323e4567-e89b-42d3-a456-426614174000";
const course = {
  id: COURSE_ID,
  title: "Curso comportamental",
  description: "",
  modules: [{
    id: "module-1",
    title: "Módulo",
    lessons: [{ id: LESSON_ID, title: "Aula", description: "", contentUrl: "https://example.test" }],
  }],
};
const assignment = {
  id: ASSIGNMENT_ID,
  lessonId: LESSON_ID,
  title: "Atividade comportamental",
  description: "",
  dueDate: null,
  maxScore: 10,
  createdAt: null,
};
const incompleteStatus = {
  isCompleted: false,
  allLessonsCompleted: false,
  allAssignmentsSubmitted: false,
  allAssignmentsGraded: false,
  allAssignmentsPassed: false,
  completedLessons: 0,
  totalLessons: 1,
  submittedAssignments: 0,
  totalAssignments: 0,
  gradedAssignments: 0,
  passedAssignments: 0,
  failedAssignments: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function renderCourse(enrolled = false, completed = false) {
  mocks.params = new Map([["id", COURSE_ID]]);
  mocks.getCourseDetail.mockResolvedValue(course);
  mocks.verifyEnrollment.mockResolvedValue(enrolled ? { id: "enrollment-1" } : null);
  mocks.fetchLessonProgress.mockResolvedValue([]);
  mocks.listCourseAssignments.mockResolvedValue([]);
  mocks.getUserCourseSubmissions.mockResolvedValue({});
  mocks.checkCourseCompletion.mockResolvedValue(completed ? { ...incompleteStatus, isCompleted: true } : incompleteStatus);
  mocks.getExistingCertificate.mockResolvedValue(null);
  render(React.createElement(CoursePage));
  await screen.findByText("Curso comportamental");
  await waitFor(() => expect(mocks.verifyEnrollment).toHaveBeenCalled());
}

async function renderActivity() {
  mocks.params = new Map([["id", ASSIGNMENT_ID]]);
  mocks.getAssignment.mockResolvedValue(assignment);
  mocks.getUserSubmission.mockResolvedValue(null);
  mocks.getCurrentChatUser.mockResolvedValue(null);
  render(React.createElement(ActivitiePage));
  await screen.findByText("Atividade comportamental");
}

describe("telemetria do fluxo de curso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params = new Map();
  });

  it("registra abertura somente quando o curso foi carregado", async () => {
    await renderCourse();
    expect(mocks.track).toHaveBeenCalledWith("course_opened", { courseId: COURSE_ID });
  });

  it("não registra abertura quando o carregamento falha", async () => {
    mocks.params = new Map([["id", COURSE_ID]]);
    mocks.getCourseDetail.mockRejectedValue(new Error("falha"));
    render(React.createElement(CoursePage));
    await screen.findByText("Curso não encontrado.");
    expect(mocks.track).not.toHaveBeenCalled();
  });

  it("espera matrícula e progresso concluírem antes de registrar", async () => {
    await renderCourse();
    mocks.track.mockClear();
    const enrollment = deferred<{ id: string }>();
    mocks.enrollInCourse.mockReturnValue(enrollment.promise);
    await userEvent.click(screen.getByRole("button", { name: "Matricular-se" }));
    expect(mocks.track).not.toHaveBeenCalled();
    enrollment.resolve({ id: "enrollment-1" });
    await waitFor(() => expect(mocks.track).toHaveBeenCalledWith("course_enrolled", { courseId: COURSE_ID }));

    mocks.track.mockClear();
    const progress = deferred<boolean>();
    mocks.toggleLessonProgress.mockReturnValue(progress.promise);
    await userEvent.click(screen.getByRole("button", { name: "Marcar como concluída" }));
    expect(mocks.track).not.toHaveBeenCalled();
    progress.resolve(true);
    await waitFor(() => expect(mocks.track).toHaveBeenCalledWith("lesson_completed", {
      courseId: COURSE_ID,
      lessonId: LESSON_ID,
    }));
  });

  it("não registra matrícula nem progresso quando as operações falham", async () => {
    await renderCourse();
    mocks.track.mockClear();
    mocks.enrollInCourse.mockRejectedValue(new Error("falha"));
    await userEvent.click(screen.getByRole("button", { name: "Matricular-se" }));
    await waitFor(() => expect(mocks.enrollInCourse).toHaveBeenCalled());
    expect(mocks.track).not.toHaveBeenCalled();

    mocks.toggleLessonProgress.mockRejectedValue(new Error("falha"));
    await userEvent.click(screen.getByRole("button", { name: "Marcar como concluída" }));
    await waitFor(() => expect(mocks.toggleLessonProgress).toHaveBeenCalled());
    expect(mocks.track).not.toHaveBeenCalled();
  });

  it("registra certificado somente depois da emissão e nunca na falha", async () => {
    await renderCourse(true, true);
    const button = await screen.findByRole("button", { name: "Emitir Certificado" });
    mocks.track.mockClear();
    const issued = deferred<Record<string, string>>();
    mocks.issueCertificate.mockReturnValueOnce(issued.promise);
    await userEvent.click(button);
    expect(mocks.track).not.toHaveBeenCalled();
    issued.resolve({
      studentName: "Aluno",
      studentCpf: "***",
      courseTitle: "Curso",
      issuedAt: "2026-09-02T12:00:00.000Z",
      verificationCode: "ABC",
    });
    await waitFor(() => expect(mocks.track).toHaveBeenCalledWith("certificate_generated", {
      courseId: COURSE_ID,
      metadata: { source: "emissao" },
    }));

    await renderCourse(true, true);
    mocks.track.mockClear();
    mocks.issueCertificate.mockRejectedValueOnce(new Error("falha"));
    await userEvent.click((await screen.findAllByRole("button", { name: "Emitir Certificado" })).at(-1)!);
    await waitFor(() => expect(mocks.issueCertificate).toHaveBeenCalledTimes(2));
    expect(mocks.track).not.toHaveBeenCalled();
  });
});

describe("telemetria do fluxo de atividade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params = new Map();
  });

  it("registra abertura e entrega somente após sucesso", async () => {
    await renderActivity();
    expect(mocks.track).toHaveBeenCalledWith("assignment_opened", {
      activityId: ASSIGNMENT_ID,
      lessonId: LESSON_ID,
    });
    mocks.track.mockClear();

    const submission = deferred<Record<string, unknown>>();
    mocks.submitAssignment.mockReturnValue(submission.promise);
    await userEvent.type(screen.getByPlaceholderText(/drive\.google\.com/), "example.test/resposta");
    await userEvent.click(screen.getByRole("button", { name: "Enviar Resposta" }));
    expect(mocks.track).not.toHaveBeenCalled();
    submission.resolve({ id: "submission-1" });
    await waitFor(() => expect(mocks.track).toHaveBeenCalledWith("assignment_submitted", {
      activityId: ASSIGNMENT_ID,
      lessonId: LESSON_ID,
      metadata: { submissionKind: "nova" },
    }));
  });

  it("não registra abertura ou entrega quando a operação falha", async () => {
    mocks.params = new Map([["id", ASSIGNMENT_ID]]);
    mocks.getAssignment.mockRejectedValue(new Error("falha"));
    render(React.createElement(ActivitiePage));
    await screen.findByText("Atividade não encontrada.");
    expect(mocks.track).not.toHaveBeenCalled();

    await renderActivity();
    mocks.track.mockClear();
    mocks.submitAssignment.mockRejectedValue(new Error("falha"));
    await userEvent.type((await screen.findAllByPlaceholderText(/drive\.google\.com/)).at(-1)!, "example.test/resposta");
    await userEvent.click((await screen.findAllByRole("button", { name: "Enviar Resposta" })).at(-1)!);
    await waitFor(() => expect(mocks.submitAssignment).toHaveBeenCalled());
    expect(mocks.track).not.toHaveBeenCalled();
  });
});
