import { jsPDF } from "jspdf";

export interface CertificateData {
  studentName: string;
  studentCpf: string;
  courseName: string;
  completionDate: string;
  verificationCode: string;
}

export function generateAndDownloadCertificate(data: CertificateData) {
  // A4 Landscape
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // ===== Background gradient effect =====
  // Light gradient background
  doc.setFillColor(252, 250, 255);
  doc.rect(0, 0, width, height, "F");

  // ===== Outer border =====
  doc.setLineWidth(3);
  doc.setDrawColor(104, 74, 151); // #684A97
  doc.rect(8, 8, width - 16, height - 16);

  // ===== Inner decorative border =====
  doc.setLineWidth(0.8);
  doc.setDrawColor(180, 160, 210);
  doc.rect(13, 13, width - 26, height - 26);

  // ===== Corner decorations (small squares) =====
  const cornerSize = 6;
  doc.setFillColor(104, 74, 151);
  // Top-left
  doc.rect(8, 8, cornerSize, cornerSize, "F");
  // Top-right
  doc.rect(width - 8 - cornerSize, 8, cornerSize, cornerSize, "F");
  // Bottom-left
  doc.rect(8, height - 8 - cornerSize, cornerSize, cornerSize, "F");
  // Bottom-right
  doc.rect(width - 8 - cornerSize, height - 8 - cornerSize, cornerSize, cornerSize, "F");

  // ===== Top decorative line =====
  doc.setDrawColor(230, 170, 50); // Gold
  doc.setLineWidth(1.5);
  doc.line(40, 30, width - 40, 30);

  // ===== Institution name =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(130, 130, 130);
  doc.text("MINDS OF FUTURE ACADEMY", width / 2, 42, { align: "center" });

  // ===== Main Title =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(104, 74, 151);
  doc.text("CERTIFICADO DE CONCLUSÃO", width / 2, 58, { align: "center" });

  // ===== Decorative line below title =====
  doc.setDrawColor(230, 170, 50);
  doc.setLineWidth(1);
  doc.line(80, 63, width - 80, 63);

  // ===== "Certificamos que" =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Certificamos que", width / 2, 78, { align: "center" });

  // ===== Student Name =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  doc.text(data.studentName.toUpperCase(), width / 2, 95, { align: "center" });

  // Underline for the name
  const nameWidth = doc.getTextWidth(data.studentName.toUpperCase());
  doc.setDrawColor(104, 74, 151);
  doc.setLineWidth(0.5);
  doc.line(
    (width - nameWidth) / 2 - 10,
    98,
    (width + nameWidth) / 2 + 10,
    98
  );

  // ===== CPF =====
  if (data.studentCpf) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    const formattedCpf = formatCpf(data.studentCpf);
    doc.text(`CPF: ${formattedCpf}`, width / 2, 107, { align: "center" });
  }

  // ===== Body text =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "concluiu com êxito todas as aulas e atividades do curso",
    width / 2,
    120,
    { align: "center" }
  );

  // ===== Course Name =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(104, 74, 151);
  const courseLines = doc.splitTextToSize(
    `"${data.courseName}"`,
    width - 60
  );
  doc.text(courseLines, width / 2, 135, { align: "center" });

  // ===== "na plataforma Minds of Future Academy" =====
  const courseBlockHeight = courseLines.length * 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "na plataforma Minds of Future Academy, tendo obtido aprovação",
    width / 2,
    135 + courseBlockHeight + 4,
    { align: "center" }
  );
  doc.text(
    "em todas as atividades com nota igual ou superior a 60%.",
    width / 2,
    135 + courseBlockHeight + 12,
    { align: "center" }
  );

  // ===== Date =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Emitido em: ${data.completionDate}`,
    width / 2,
    height - 42,
    { align: "center" }
  );

  // ===== Bottom decorative line =====
  doc.setDrawColor(230, 170, 50);
  doc.setLineWidth(1.5);
  doc.line(40, height - 35, width - 40, height - 35);

  // ===== Verification Code =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(104, 74, 151);
  doc.text(
    `Código de Autenticidade: ${data.verificationCode}`,
    width / 2,
    height - 26,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Valide este certificado em: mindsofthefuture.com/validar",
    width / 2,
    height - 20,
    { align: "center" }
  );

  // Save PDF
  const filename = `Certificado_${data.studentName.replace(/\s+/g, "_")}_${data.courseName.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

function formatCpf(cpf: string) {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
}
