import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { trackLearningEvent, fetchMessages, sendMessage, subscribeToMessages } = vi.hoisted(() => ({
  trackLearningEvent: vi.fn().mockResolvedValue(undefined),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  subscribeToMessages: vi.fn(),
}));

vi.mock("@/lib/services/tracking.service", () => ({
  trackingService: { trackLearningEvent },
}));
vi.mock("@/lib/api/activity-chat", () => ({
  fetchMessages,
  sendMessage,
  subscribeToMessages,
}));

import TrilhasClient from "@/components/trilhas/TrilhasClient";
import ActivityChat from "@/components/activities/activity-chat";

describe("instrumentação dos fluxos reais", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMessages.mockResolvedValue([]);
    subscribeToMessages.mockReturnValue(vi.fn());
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("registra a abertura da trilha somente no clique de navegação", async () => {
    render(React.createElement(TrilhasClient, {
      trilhasData: [{
        id: "123e4567-e89b-42d3-a456-426614174000",
        title: "Trilha teste",
        description: "",
        courses: [{ id: "course-1", title: "Curso teste", description: "", thumbUrl: null }],
      }] as never,
      coursesData: [],
    }));

    expect(trackLearningEvent).not.toHaveBeenCalled();
    const link = screen.getByText("Ver curso").closest("a");
    link?.addEventListener("click", (event) => event.preventDefault());
    await userEvent.click(link as HTMLAnchorElement);
    expect(trackLearningEvent).toHaveBeenCalledWith("learning_path_opened", {
      learningPathId: "123e4567-e89b-42d3-a456-426614174000",
    });
  });

  it("registra mensagem somente depois do envio bem-sucedido e nunca na falha", async () => {
    let resolveSend: (() => void) | undefined;
    sendMessage.mockReturnValueOnce(new Promise<void>((resolve) => { resolveSend = resolve; }));
    const user = userEvent.setup();
    render(React.createElement(ActivityChat, {
      assignmentId: "assignment-1",
      studentId: "student-1",
      currentUser: { id: "student-1", name: "Aluno", role: "student" } as never,
    }));
    await screen.findByText("Nenhuma mensagem ainda.");

    await user.type(screen.getByPlaceholderText("Digite sua mensagem..."), "mensagem privada");
    await user.click(screen.getByTitle("Enviar mensagem"));
    expect(trackLearningEvent).not.toHaveBeenCalled();

    resolveSend?.();
    await waitFor(() => expect(trackLearningEvent).toHaveBeenCalledWith("chat_message_sent", {
      activityId: "assignment-1",
      metadata: { senderRole: "student" },
    }));
    expect(JSON.stringify(trackLearningEvent.mock.calls)).not.toContain("mensagem privada");

    sendMessage.mockRejectedValueOnce(new Error("falha"));
    await user.type(screen.getByPlaceholderText("Digite sua mensagem..."), "não enviar");
    await user.click(screen.getByTitle("Enviar mensagem"));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));
    expect(trackLearningEvent).toHaveBeenCalledTimes(1);
  });
});