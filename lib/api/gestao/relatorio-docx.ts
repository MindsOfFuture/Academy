import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { limitesDoMes } from "./alocacao";
import { TIPO_ENCONTRO, type AtividadeRelatorio, type EncontroDoRelatorio } from "./types";

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
  /** Caminho no bucket → foto já reduzida (fotosParaRelatorio). Foto ausente fica de fora. */
  fotos?: Map<string, FotoDoRelatorio>;
}

/** JPEG pronto para entrar no .docx, com o tamanho em pixels. */
export interface FotoDoRelatorio {
  bytes: Uint8Array;
  largura: number;
  altura: number;
}

export interface LinhaDoRelatorio {
  atividade: string;
  data: string; // ISO
  fonte: string;
  /** Caminhos das fotos de comprovação. */
  fotos: string[];
}

/** Encontros e outras atividades juntos, em ordem de data. */
export function linhasDoRelatorio(encontros: EncontroDoRelatorio[], atividades: AtividadeRelatorio[]): LinhaDoRelatorio[] {
  const deEncontros = encontros.map((e) => {
    const onde = [e.escolaNome ?? (e.tipo !== "aula" ? TIPO_ENCONTRO[e.tipo] : null), e.turmaNome, e.espacoNome]
      .filter(Boolean)
      .join(", ");
    const cobertura = e.situacao === "cobertura" ? ", cobrindo outro bolsista" : "";
    return {
      atividade: `${e.descricao}${onde ? ` — ${onde}` : ""} (${e.horario}${cobertura})`,
      data: e.data,
      fonte: e.links.join(" "),
      fotos: e.fotos,
    };
  });
  const outras = atividades.map((a) => ({
    atividade: a.inicio && a.fim ? `${a.nome} (${a.inicio.slice(0, 5)} às ${a.fim.slice(0, 5)})` : a.nome,
    data: a.data,
    fonte: a.comprovacao ?? "",
    fotos: a.foto_comprovacao ? [a.foto_comprovacao] : [],
  }));
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

/** EMU por pixel a 96 dpi, e por twip. */
const EMU_PX = 9525;
const EMU_TWIP = 635;
/** Altura máxima da foto na célula (~4,5 cm): a linha não engole a página. */
const ALTURA_MAXIMA = 1_620_000;

/** Foto inline, reduzida para caber na largura da coluna e na altura máxima. */
function desenho(foto: FotoDoRelatorio, rel: string, n: number, larguraMaxima: number): string {
  const escala = Math.min(1, larguraMaxima / (foto.largura * EMU_PX), ALTURA_MAXIMA / (foto.altura * EMU_PX));
  const cx = Math.round(foto.largura * EMU_PX * escala);
  const cy = Math.round(foto.altura * EMU_PX * escala);
  return (
    `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:docPr id="${n}" name="Foto ${n}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>` +
    `<pic:nvPicPr><pic:cNvPr id="${n}" name="foto-${n}.jpg"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rel}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`
  );
}

/** Foto registrada no pacote: o arquivo em word/media e a relação que o documento cita. */
export interface FotoNoPacote {
  rel: string;
  arquivo: string;
  n: number;
  foto: FotoDoRelatorio;
}

function preencherTabela(doc: string, linhas: LinhaDoRelatorio[], fotos: Map<string, FotoDoRelatorio>, usadas: FotoNoPacote[]): string {
  const tabela = doc.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
  const linhasXml = tabela?.[0].match(/<w:tr>[\s\S]*?<\/w:tr>/g);
  if (!tabela || !linhasXml || linhasXml.length < 2) throw new Error("Modelo do relatório mudou: não achei a tabela.");
  const modelo = linhasXml[linhasXml.length - 1];
  if ((modelo.match(RUN_VAZIO) ?? []).length !== 3) throw new Error("Modelo do relatório mudou: a linha da tabela não tem 3 células vazias.");
  // Largura da coluna "Fonte de comprovação" menos as margens da célula e uma folga.
  const colunas = [...(tabela[0].match(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/)?.[0] ?? "").matchAll(/<w:gridCol w:w="(\d+)"\/>/g)];
  const larguraMaxima = (Number(colunas[2]?.[1] ?? 3685) - 360) * EMU_TWIP;

  const novas = linhas.map((l) => {
    const celulas = [l.atividade, dataBr(l.data), l.fonte];
    const desenhos = l.fotos.flatMap((caminho) => {
      const foto = fotos.get(caminho);
      if (!foto) return [];
      const n = 1000 + usadas.length;
      const registro = { rel: `rIdFoto${n}`, arquivo: `foto-${n}.jpg`, n, foto };
      usadas.push(registro);
      return [desenho(foto, registro.rel, n, larguraMaxima)];
    });
    let i = 0;
    return modelo
      .replace(/ w14:paraId="[^"]*"/g, "") // ids repetidos fazem o Word pedir reparo
      .replace(RUN_VAZIO, (_t, abre: string, fecha: string) => {
        const texto = celulas[i];
        const fotosDaCelula = i++ === 2 ? desenhos.map((d, j) => (texto || j > 0 ? `<w:br/>${d}` : d)).join("") : "";
        return `${abre}<w:t xml:space="preserve">${xml(texto)}</w:t>${fotosDaCelula}${fecha}`;
      });
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
  const usadas: FotoNoPacote[] = [];
  doc = preencherTabela(doc, linhasDoRelatorio(dados.encontros, dados.atividades), dados.fotos ?? new Map(), usadas);
  arquivos["word/document.xml"] = strToU8(doc);

  if (usadas.length > 0) {
    const rels = "word/_rels/document.xml.rels";
    arquivos[rels] = strToU8(
      strFromU8(arquivos[rels]).replace(
        "</Relationships>",
        usadas
          .map(
            (u) =>
              `<Relationship Id="${u.rel}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${u.arquivo}"/>`,
          )
          .join("") + "</Relationships>",
      ),
    );
    const tipos = strFromU8(arquivos["[Content_Types].xml"]);
    if (!/Extension="jpg"/.test(tipos)) {
      arquivos["[Content_Types].xml"] = strToU8(tipos.replace("<Default ", '<Default ContentType="image/jpeg" Extension="jpg"/><Default '));
    }
    for (const u of usadas) arquivos[`word/media/${u.arquivo}`] = u.foto.bytes;
  }
  return zipSync(arquivos);
}
