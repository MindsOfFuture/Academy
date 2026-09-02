import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("instrumentação dos fluxos reais", () => {
  it("cobre sessão, página e navegação de trilha", () => {
    const provider = source("components/tracking/TrackingProvider.tsx");
    const paths = source("components/trilhas/TrilhasClient.tsx");
    expect(provider).toContain("page_viewed");
    expect(source("lib/services/tracking.service.ts")).toContain("session_started");
    expect(paths).toContain("learning_path_opened");
  });

  it("emite matrícula, aula, recurso e certificado somente após o sucesso", () => {
    const course = source("app/course/page.tsx");
    expect(course).toMatch(/getCourseDetail[\s\S]*course_opened/);
    expect(course).toMatch(/await enrollInCourse[\s\S]*course_enrolled/);
    expect(course).toMatch(/await toggleLessonProgress[\s\S]*lesson_completed[\s\S]*lesson_uncompleted/);
    expect(course).toContain("lesson_opened");
    expect(course).toContain("resource_opened");
    expect(course).toMatch(/await issueCertificate[\s\S]*certificate_generated/);
  });

  it("emite abertura e entrega de atividade e chat após o sucesso", () => {
    const activity = source("app/protected/activitie/page.tsx");
    const chat = source("components/activities/activity-chat.tsx");
    expect(activity).toMatch(/await getAssignment[\s\S]*assignment_opened/);
    expect(activity).toMatch(/await submitAssignment[\s\S]*assignment_submitted/);
    expect(chat).toMatch(/await sendMessage[\s\S]*chat_message_sent/);
  });

  it("conecta os agregados semânticos aos quatro painéis existentes", () => {
    const hooks = source("components/dashboard/Analytics/hooks/useAnalytics.ts");
    expect(hooks).toContain("/api/analytics/events");
    expect(hooks).toContain("learning_events");
    expect(hooks).toContain("from");
    expect(hooks).toContain("to");

    for (const panel of ["GlobalAnalytics", "LearningPathAnalytics", "CourseAnalytics", "StudentAnalytics"]) {
      const dashboard = source(`components/dashboard/Analytics/${panel}.tsx`);
      expect(dashboard).toContain("learning_events");
      expect(dashboard).toMatch(/Interações|Atividade recente|Sessões/);
    }
  });
});
