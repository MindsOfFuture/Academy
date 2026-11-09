import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { limitesDoMes } from "./alocacao";
import type { AtividadeRelatorio, EncontroDoRelatorio } from "./types";

/**
 * Preenche o "Formulário de execução de atividades" (modelos/relatorio-mensal.docx)
 * trocando só o texto dos campos "XX…" e repetindo a linha vazia da tabela.
 * Formatação, cabeçalho e logos ficam como no modelo. Se o modelo mudar e um
 * campo sumir, falha alto em vez de gerar um documento pela metade.
 */

export interface DadosDoRelatorio {
  mes: string; // "2026-11"
  nome: string;
  cpf: string | null;
  encontros: EncontroDoRelatorio[];
  atividades: AtividadeRelatorio[];
}

export interface LinhaDoRelatorio {
  atividade: string;
  data: string; // ISO
  fonte: string;
}

/** Encontros e outras atividades juntos, em ordem de data. */
export function linhasDoRelatorio(encontros: EncontroDoRelatorio[], atividades: AtividadeRelatorio[]): LinhaDoRelatorio[] {
  const deEncontros = encontros.map((e) => {
    const onde = [e.escolaNome, e.turmaNome].filter(Boolean).join(", ");
    const cobertura = e.situacao === "cobertura" ? ", cobrindo outro bolsista" : "";
    return {
      atividade: `${e.descricao}${onde ? ` — ${onde}` : ""} (${e.horario}${cobertura})`,
      data: e.data,
      fonte: "",
    };
  });
  const outras = atividades.map((a) => ({ atividade: a.nome, data: a.data, fonte: a.comprovacao ?? "" }));
  return [...deEncontros, ...outras].sort((x, y) => x.data.localeCompare(y.data));
}

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarCpf(cpf: string | null): string {
  const digitos = (cpf ?? "").replace(/\D/g, "");
  return digitos.length === 11 ? digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "";
}

function xml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function trocar(doc: string, de: string, para: string): string {
  if (!doc.includes(de)) throw new Error(`Modelo do relatório mudou: não achei "${de}".`);
  return doc.replace(de, para);
}

/** Run vazio de cada célula da linha-modelo; recebe o texto da célula. */
const RUN_VAZIO = /(<w:r [^>]*><w:rPr><w:rtl w:val="0"\/><\/w:rPr>)(<\/w:r>)/g;

function preencherTabela(doc: string, linhas: LinhaDoRelatorio[]): string {
  const tabela = doc.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
  const linhasXml = tabela?.[0].match(/<w:tr>[\s\S]*?<\/w:tr>/g);
  if (!tabela || !linhasXml || linhasXml.length < 2) throw new Error("Modelo do relatório mudou: não achei a tabela.");
  const modelo = linhasXml[linhasXml.length - 1];
  if ((modelo.match(RUN_VAZIO) ?? []).length !== 3) throw new Error("Modelo do relatório mudou: a linha da tabela não tem 3 células vazias.");

  const novas = linhas.map((l) => {
    const celulas = [l.atividade, dataBr(l.data), l.fonte];
    let i = 0;
    return modelo
      .replace(/ w14:paraId="[^"]*"/g, "") // ids repetidos fazem o Word pedir reparo
      .replace(RUN_VAZIO, (_t, abre: string, fecha: string) => `${abre}<w:t xml:space="preserve">${xml(celulas[i++])}</w:t>${fecha}`);
  });
  // Sem linhas, a tabela fica com a linha vazia do modelo.
  return doc.replace(tabela[0], tabela[0].replace(modelo, novas.length ? novas.join("") : modelo));
}

export function preencherRelatorio(modelo: Uint8Array, dados: DadosDoRelatorio): Uint8Array {
  const arquivos = unzipSync(modelo);
  const { de, ate } = limitesDoMes(dados.mes);
  const [ano, mes] = dados.mes.split("-");

  let doc = strFromU8(arquivos["word/document.xml"]);
  doc = trocar(doc, "Período XX/XX/XXXX a XX/XX/XXXX", `Período ${dataBr(de)} a ${dataBr(ate)}`);
  doc = trocar(doc, "CPF do Bolsista:XXXXXX", `CPF do Bolsista: ${xml(formatarCpf(dados.cpf))}`);
  doc = trocar(doc, "Nome do Bolsista: XXXXXXXXXXXXXXXX", `Nome do Bolsista: ${xml(dados.nome)}`);
  doc = trocar(doc, "o bolsista Leandro Fortunato Moreira,", `o bolsista ${xml(dados.nome)},`);
  doc = trocar(doc, "no mês XX/XXXX", `no mês ${mes}/${ano}`);
  doc = preencherTabela(doc, linhasDoRelatorio(dados.encontros, dados.atividades));

  arquivos["word/document.xml"] = strToU8(doc);
  return zipSync(arquivos);
}
