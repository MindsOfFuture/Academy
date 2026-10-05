/**
 * YourCourses: o gerador de PDF (jsPDF) só é carregado no clique do
 * certificado; falha no carregamento vira mensagem amigável e libera o botão.
 */
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({
    pdfCarregado: false,
    falharImport: false,
    gerar: vi.fn(),
}));

vi.mock("@/lib/utils/pdfGenerator", () => {
    estado.pdfCarregado = true;
    if (estado.falharImport) throw new Error("Failed to fetch dynamically imported module");
    return { generateAndDownloadCertificate: estado.gerar };
});

const certificados = vi.hoisted(() => ({
    getExistingCertificate: vi.fn(),
    checkCourseCompletion: vi.fn(),
    issueCertificate: vi.fn(),
}));
vi.mock("@/lib/api/certificates", () => certificados);
vi.mock("@/lib/api/enrollments", () => ({ getUserCourses: vi.fn().mockResolvedValue([]) }));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toast }));

vi.mock("next/image", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

import { YourCourses } from "@/components/yourCourses/yourCoursers";

const curso = {
    enrollmentId: "e1",
    status: "active",
    course: { id: "c1", title: "Robótica", thumbUrl: null },
    progressPercent: 100,
    completedLessons: 3,
    totalLessons: 3,
} as unknown as import("@/lib/api/types").EnrollmentSummary;

const cert = {
    studentName: "Ana",
    studentCpf: "000",
    courseTitle: "Robótica",
    issuedAt: "2026-01-02T12:00:00Z",
    verificationCode: "ABC",
};

beforeEach(() => {
    estado.pdfCarregado = false;
    estado.falharImport = false;
    vi.doMock("@/lib/utils/pdfGenerator", () => {
        estado.pdfCarregado = true;
        if (estado.falharImport) throw new Error("Failed to fetch dynamically imported module");
        return { generateAndDownloadCertificate: estado.gerar };
    });
    estado.gerar.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    certificados.checkCourseCompletion.mockResolvedValue({ isCompleted: true });
    certificados.getExistingCertificate.mockResolvedValue(null);
    certificados.issueCertificate.mockReset().mockResolvedValue(cert);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

// Cada teste registra um novo mock para não depender do cache de imports dinâmicos.
describe("YourCourses — certificado com gerador sob demanda", () => {
    it("falha ao carregar o gerador mostra erro amigável e libera o botão", async () => {
        estado.falharImport = true;
        render(<YourCourses initialCursos={[curso]} />);
        const botao = await screen.findByRole("button", { name: /Emitir Certificado/ });
        expect(estado.pdfCarregado).toBe(false);

        fireEvent.click(botao);

        await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
        expect(toast.error.mock.calls[0][0]).toMatch(/certificado/i);
        expect(toast.error.mock.calls[0][0]).not.toMatch(/dynamically imported/);
        expect(certificados.issueCertificate).not.toHaveBeenCalled();
        expect(await screen.findByRole("button", { name: /Emitir Certificado/ })).not.toBeDisabled();
        estado.falharImport = false;
        estado.pdfCarregado = false;
    });

    it("não carrega o PDF antes do clique e emite + gera no clique", async () => {
        render(<YourCourses initialCursos={[curso]} />);
        const botao = await screen.findByRole("button", { name: /Emitir Certificado/ });
        expect(estado.pdfCarregado).toBe(false);

        fireEvent.click(botao);

        await waitFor(() => expect(estado.gerar).toHaveBeenCalledTimes(1));
        expect(estado.pdfCarregado).toBe(true);
        expect(certificados.issueCertificate).toHaveBeenCalledWith("c1");
        expect(estado.gerar).toHaveBeenCalledWith(
            expect.objectContaining({ studentName: "Ana", courseName: "Robótica", verificationCode: "ABC" }),
        );
        expect(toast.success).toHaveBeenCalled();
        expect(await screen.findByRole("button", { name: /Baixar Certificado/ })).not.toBeDisabled();
    });

    it("certificado existente: baixa sem reemitir", async () => {
        certificados.getExistingCertificate.mockResolvedValue(cert);
        render(<YourCourses initialCursos={[curso]} />);
        fireEvent.click(await screen.findByRole("button", { name: /Baixar Certificado/ }));

        await waitFor(() => expect(estado.gerar).toHaveBeenCalledTimes(1));
        expect(certificados.issueCertificate).not.toHaveBeenCalled();
        expect(estado.gerar).toHaveBeenCalledWith(expect.objectContaining({ verificationCode: "ABC" }));
        expect(screen.getByRole("button", { name: /Baixar Certificado/ })).not.toBeDisabled();
    });
});
