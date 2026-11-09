import { unzipSync } from "fflate";
import { jsPDF } from "jspdf";
import { limitesDoMes } from "./alocacao";
import { dataBr, formatarCpf, linhasDoRelatorio, type DadosDoRelatorio } from "./relatorio-docx";

/**
 * Mesmo "Formulário de execução de atividades" do .docx, desenhado em PDF.
 * Textos fixos copiados do modelo; o logo sai do próprio modelo, então os dois
 * formatos não divergem na imagem.
 */

const COORDENADORA = "CRISTINA SAYURI CORTES OUCHI DUSI";
const MARGEM = 25.4; // 1 polegada, como o modelo
const COLUNAS = [3823, 1559, 3685]; // larguras da tabela do modelo (twips)

export function gerarRelatorioPdf(modelo: Uint8Array, dados: DadosDoRelatorio): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const util = largura - 2 * MARGEM;
  const { de, ate } = limitesDoMes(dados.mes);
  const [ano, mes] = dados.mes.split("-");

  const cabecalho = () => {
    const logo = unzipSync(modelo, { filter: (f) => f.name === "word/media/image1.jpg" })["word/media/image1.jpg"];
    if (logo) doc.addImage(logo, "JPEG", MARGEM, 8, 37, 22);
    doc.setFont("helvetica", "bold").setFontSize(11);
    doc.text("UNIVERSIDADE FEDERAL DE JUIZ DE FORA", largura - MARGEM, 16, { align: "right" });
    doc.text("FACULDADE DE ADMINISTRAÇÃO E CIÊNCIAS CONTÁBEIS", largura - MARGEM, 21, { align: "right" });
  };
  cabecalho();

  let y = MARGEM + 12;
  const linha = (texto: string, opcoes: { negrito?: boolean; tamanho?: number; centro?: boolean; antes?: number } = {}) => {
    doc.setFont("helvetica", opcoes.negrito ? "bold" : "normal").setFontSize(opcoes.tamanho ?? 12);
    y += opcoes.antes ?? 0;
    const partes: string[] = doc.splitTextToSize(texto, util);
    doc.text(partes, opcoes.centro ? largura / 2 : MARGEM, y, { align: opcoes.centro ? "center" : "left", maxWidth: util });
    y += partes.length * doc.getLineHeight() / doc.internal.scaleFactor;
  };

  linha("Projeto Minds of the Future", { negrito: true, tamanho: 13, centro: true });
  linha("Formulário de execução de atividades", { negrito: true, tamanho: 13, centro: true });
  linha(`Nome do professor coordenador: ${COORDENADORA}`, { negrito: true, antes: 6 });
  linha(`Período ${dataBr(de)} a ${dataBr(ate)}`, { negrito: true });
  linha(`CPF do Bolsista: ${formatarCpf(dados.cpf)}`, { negrito: true });
  linha(`Nome do Bolsista: ${dados.nome}`, { negrito: true });
  linha("1- FREQUÊNCIA DO BOLSISTA", { negrito: true, antes: 4 });
  linha(
    `Atesto, para os devidos fins, que o bolsista ${dados.nome}, obteve frequência integral no mês ${mes}/${ano}, ` +
      "obtendo desempenho satisfatório no cumprimento de suas atividades referentes ao projeto acima citado.",
    { antes: 2 },
  );
  linha("2-PLANO DE TRABALHO E ATIVIDADES DESENVOLVIDAS DO BOLSISTA", { negrito: true, antes: 4 });
  y += 2;

  // Tabela: cabeçalho repetido a cada página nova.
  const total = COLUNAS.reduce((a, b) => a + b, 0);
  const larguras = COLUNAS.map((c) => (c / total) * util);
  const PAD = 1.5;
  const desenharLinha = (celulas: string[], negrito: boolean) => {
    doc.setFont("helvetica", negrito ? "bold" : "normal").setFontSize(negrito ? 11 : 10);
    const textos = celulas.map((c, i) => doc.splitTextToSize(c, larguras[i] - 2 * PAD) as string[]);
    const alt = Math.max(1, ...textos.map((t) => t.length)) * doc.getLineHeight() / doc.internal.scaleFactor + 2 * PAD;
    if (y + alt > altura - MARGEM) {
      doc.addPage();
      cabecalho();
      y = MARGEM + 12;
      if (!negrito) desenharLinha(TITULOS, true);
      doc.setFont("helvetica", negrito ? "bold" : "normal").setFontSize(negrito ? 11 : 10);
    }
    let x = MARGEM;
    textos.forEach((t, i) => {
      doc.rect(x, y, larguras[i], alt);
      const centro = negrito || i === 1;
      doc.text(t, centro ? x + larguras[i] / 2 : x + PAD, y + PAD + 3.5, { align: centro ? "center" : "left" });
      x += larguras[i];
    });
    y += alt;
  };
  const TITULOS = ["Atividades desenvolvidas no mês", "Data", "Fonte de comprovação (caso houver)"];
  desenharLinha(TITULOS, true);
  const linhas = linhasDoRelatorio(dados.encontros, dados.atividades);
  if (!linhas.length) desenharLinha(["", "", ""], false);
  for (const l of linhas) desenharLinha([l.atividade, dataBr(l.data), l.fonte], false);

  // Assinaturas lado a lado, sem partir entre páginas.
  if (y + 40 > altura - MARGEM) {
    doc.addPage();
    cabecalho();
    y = MARGEM;
  }
  y += 28; // espaço para assinar
  const meio = largura / 2;
  for (const [cx, rotulo] of [[MARGEM + util / 4, "Assinatura Coordenador do projeto"], [meio + util / 4, "Assinatura Bolsista"]] as const) {
    doc.line(cx - 35, y, cx + 35, y);
    doc.setFont("helvetica", "bold").setFontSize(11);
    doc.text(rotulo, cx, y + 5, { align: "center" });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
