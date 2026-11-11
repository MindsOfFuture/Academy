import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

/**
 * Planilha de calendário da coordenação (.xlsx) → encontros da gestão.
 *
 * Módulo puro e autocontido (só fflate): roda no navegador, no servidor e com
 * `node --experimental-strip-types`. Nada aqui fala com o banco; a gravação está
 * em `importacao.ts` e na função `gestao.importar_planilha`.
 *
 * Formato esperado: cabeçalho "Segunda … Domingo" em A..G, depois pares de linhas
 * (números dos dias / eventos), uma semana por par, e o mês na coluna H. Cada
 * célula de evento pode ter vários eventos separados por uma linha em branco.
 *
 * Todas as expressões regulares aqui são lineares no tamanho da entrada: o
 * arquivo vem de fora e uma regex com retrocesso explosivo travaria o servidor.
 */

export type Grade = Map<string, string | number>;

export interface EventoPlanilha {
  celula: string;
  data: string;
  inicio: string;
  fim: string;
  escola: string | null;
  modalidade: string;
  descricao: string;
}

export interface LeituraPlanilha {
  primeiroDia: string;
  eventos: EventoPlanilha[];
  ignorados: { celula: string; data: string; texto: string }[];
  erros: string[];
}

export interface EncontroPrevia extends EventoPlanilha {
  escolaId: string | null;
  escolaNova: string | null;
  duplicado: boolean;
}

export interface EscolaNovaPrevia {
  chave: string;
  nome: string;
  categoria: string;
  cidade: string;
}

export interface PreviaImportacao {
  encontros: EncontroPrevia[];
  escolasNovas: EscolaNovaPrevia[];
}

/** Mesmo formato de `Validado` em `validacao.ts` (repetido para o módulo ficar autocontido). */
export type Validado<T> = { ok: true; valor: T } | { ok: false; mensagem: string };

export const EVENTOS_MAXIMOS = 400;
const NAO_E_XLSX = "Este arquivo não é uma planilha .xlsx.";
const PARTE_MAXIMA = 20 * 1024 * 1024;
const COLUNAS = ["A", "B", "C", "D", "E", "F", "G"];
const DIAS_DA_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

// ---------------------------------------------------------------------------
// Datas (sempre em UTC, só o calendário importa)
// ---------------------------------------------------------------------------

function dataUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function isoDe(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function somaDias(iso: string, dias: number): string {
  const d = dataUtc(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return isoDe(d);
}

/** Segunda = 0 … domingo = 6. */
function diaDaSemana(iso: string): number {
  return (dataUtc(iso).getUTCDay() + 6) % 7;
}

function dataValida(iso: string): boolean {
  return DATA_ISO.test(iso) && !Number.isNaN(dataUtc(iso).getTime()) && isoDe(dataUtc(iso)) === iso;
}

function isoDoDia(ano: number, mes: number, dia: number): string {
  return isoDe(new Date(Date.UTC(ano, mes - 1, dia)));
}

function dataBr(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

// ---------------------------------------------------------------------------
// Leitura do .xlsx
// ---------------------------------------------------------------------------

function decodificar(texto: string): string {
  return texto.replace(/&(amp|lt|gt|quot|apos|#\d{1,7}|#x[0-9a-fA-F]{1,6});/g, (_, e: string) => {
    if (e === "amp") return "&";
    if (e === "lt") return "<";
    if (e === "gt") return ">";
    if (e === "quot") return '"';
    if (e === "apos") return "'";
    const n = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return n <= 0x10ffff ? String.fromCodePoint(n) : "";
  });
}

/**
 * Elementos `<tag …>…</tag>` (ou `<tag …/>`) por busca de índice, sem regex:
 * marcação malformada não vira retrocesso quadrático.
 */
function elementos(xml: string, tag: string): { atributos: string; conteudo: string }[] {
  const achados: { atributos: string; conteudo: string }[] = [];
  const abre = `<${tag}`;
  const fecha = `</${tag}>`;
  let i = xml.indexOf(abre);
  while (i !== -1) {
    const seguinte = xml[i + abre.length];
    if (seguinte !== ">" && seguinte !== "/" && seguinte !== " " && seguinte !== "\t" && seguinte !== "\n" && seguinte !== "\r") {
      i = xml.indexOf(abre, i + 1);
      continue;
    }
    const fimAbertura = xml.indexOf(">", i);
    if (fimAbertura === -1) break;
    const atributos = xml.slice(i + abre.length, fimAbertura);
    if (atributos.endsWith("/")) {
      achados.push({ atributos: atributos.slice(0, -1), conteudo: "" });
      i = xml.indexOf(abre, fimAbertura);
      continue;
    }
    const fimElemento = xml.indexOf(fecha, fimAbertura);
    if (fimElemento === -1) break;
    achados.push({ atributos, conteudo: xml.slice(fimAbertura + 1, fimElemento) });
    i = xml.indexOf(abre, fimElemento + fecha.length);
  }
  return achados;
}

function atributo(atributos: string, nome: string): string | null {
  const m = new RegExp(`(?:^|\\s)${nome}="([^"]*)"`).exec(atributos);
  return m ? m[1] : null;
}

/** Texto de um `<si>` ou `<is>`: junta os `<t>` dos trechos, sem a leitura fonética (`<rPh>`). */
function textoRico(xml: string): string {
  const fonetica = xml.indexOf("<rPh");
  const corpo = fonetica === -1 ? xml : xml.slice(0, fonetica);
  return decodificar(elementos(corpo, "t").map((t) => t.conteudo).join(""));
}

/** Lê a primeira aba do .xlsx como grade célula → valor ("A3" → 28). */
export function lerGrade(bytes: Uint8Array): Grade {
  let arquivos: Record<string, Uint8Array>;
  try {
    arquivos = unzipSync(bytes, {
      filter: (f) =>
        f.originalSize <= PARTE_MAXIMA &&
        (f.name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(f.name)),
    });
  } catch {
    throw new Error(NAO_E_XLSX);
  }
  // shortcut: lê só a primeira aba; escolher aba quando houver planilha com mais de uma
  const aba = Object.keys(arquivos)
    .filter((n) => n.startsWith("xl/worksheets/"))
    .sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")))[0];
  if (!aba) throw new Error(NAO_E_XLSX);

  const compartilhados = arquivos["xl/sharedStrings.xml"]
    ? elementos(strFromU8(arquivos["xl/sharedStrings.xml"]), "si").map((si) => textoRico(si.conteudo))
    : [];

  const grade: Grade = new Map();
  for (const c of elementos(strFromU8(arquivos[aba]), "c")) {
    const ref = atributo(c.atributos, "r");
    if (!ref || !/^[A-Z]{1,3}\d{1,7}$/.test(ref)) continue;
    const tipo = atributo(c.atributos, "t");
    const v = elementos(c.conteudo, "v")[0]?.conteudo;
    let valor: string | number | undefined;
    if (tipo === "s") valor = v === undefined ? undefined : compartilhados[Number(v)];
    else if (tipo === "inlineStr") valor = textoRico(elementos(c.conteudo, "is")[0]?.conteudo ?? "");
    else if (tipo === "str" || tipo === "b") valor = v === undefined ? undefined : decodificar(v);
    else if (tipo === "e") valor = undefined;
    else if (v !== undefined && v.trim() !== "" && Number.isFinite(Number(v))) valor = Number(v);
    if (valor !== undefined && valor !== "") grade.set(ref, valor);
  }
  return grade;
}

// ---------------------------------------------------------------------------
// Estrutura da grade
// ---------------------------------------------------------------------------

function ultimaLinha(grade: Grade): number {
  let maior = 0;
  for (const ref of grade.keys()) {
    const linha = Number(ref.replace(/^[A-Z]+/, ""));
    if (linha > maior) maior = linha;
  }
  return maior;
}

/** Número do dia na célula: número da planilha ou texto só com dígitos. */
function numeroDoDia(valor: string | number | undefined): number | null {
  if (typeof valor === "number") return Number.isInteger(valor) && valor >= 1 && valor <= 31 ? valor : null;
  if (typeof valor === "string" && /^\s*\d{1,2}\s*$/.test(valor)) {
    const n = Number(valor);
    return n >= 1 && n <= 31 ? n : null;
  }
  return null;
}

function linhaDeNumeros(grade: Grade, linha: number): boolean {
  return COLUNAS.filter((c) => numeroDoDia(grade.get(`${c}${linha}`)) !== null).length >= 4;
}

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function mesDoRotulo(valor: string | number | undefined): number | null {
  if (typeof valor !== "string") return null;
  const rotulo = semAcento(valor).trim().toLowerCase();
  const i = MESES.findIndex((m) => semAcento(m).toLowerCase() === rotulo);
  return i === -1 ? null : i + 1;
}

/**
 * Segunda-feira da primeira semana, deduzida do cabeçalho e do mês da coluna H.
 * O ano não está na planilha: vale o de hoje ± 1 em que o dia da semana bate,
 * o mais perto de hoje. Sem pista suficiente, null (a tela pede a data).
 */
export function inferirPrimeiroDia(grade: Grade, hojeIso: string): string | null {
  const ultima = ultimaLinha(grade);
  let cabecalho = 0;
  for (let l = 1; l <= ultima && !cabecalho; l++) {
    const a = grade.get(`A${l}`);
    if (typeof a === "string" && semAcento(a).trim().toLowerCase().startsWith("segunda")) cabecalho = l;
  }
  if (!cabecalho) return null;

  let numeros = 0;
  for (let l = cabecalho + 1; l <= ultima && !numeros; l++) if (linhaDeNumeros(grade, l)) numeros = l;
  if (!numeros) return null;

  let mes: number | null = null;
  for (let l = 1; l <= ultima && mes === null; l++) mes = mesDoRotulo(grade.get(`H${l}`));
  if (mes === null) return null;

  const dias = COLUNAS.map((c) => numeroDoDia(grade.get(`${c}${numeros}`)));
  const colunaDoUm = dias.indexOf(1);
  const diaDaSegunda = dias[0];
  if (colunaDoUm === -1 && diaDaSegunda === null) return null;

  const anoDeHoje = Number(hojeIso.slice(0, 4));
  const hoje = dataUtc(hojeIso).getTime();
  let melhor: string | null = null;
  for (const ano of [anoDeHoje - 1, anoDeHoje, anoDeHoje + 1]) {
    let segunda: string;
    if (colunaDoUm !== -1) {
      const um = isoDoDia(ano, mes, 1);
      if (diaDaSemana(um) !== colunaDoUm) continue;
      segunda = somaDias(um, -colunaDoUm);
    } else {
      segunda = isoDoDia(ano, mes, diaDaSegunda as number);
      if (segunda.slice(5, 7) !== String(mes).padStart(2, "0") || diaDaSemana(segunda) !== 0) continue;
    }
    if (melhor === null || Math.abs(dataUtc(segunda).getTime() - hoje) < Math.abs(dataUtc(melhor).getTime() - hoje)) {
      melhor = segunda;
    }
  }
  return melhor;
}

// ---------------------------------------------------------------------------
// Nomes
// ---------------------------------------------------------------------------

function espacosSimples(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

/** "E.M  Cecília" e "E.M Cecília" → "E.M. Cecília"; "E.E de X" → "E.E. de X". */
export function nomeCanonicoEscola(nome: string): string {
  return espacosSimples(nome).replace(/^E\.?\s*([ME])\.?\s+/, (_, letra: string) => `E.${letra}. `);
}

/** Chave de comparação: sem acento, sem pontuação, minúsculas. */
export function chaveEscola(nome: string): string {
  return espacosSimples(
    semAcento(nomeCanonicoEscola(nome))
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ""),
  );
}

const MODALIDADES: Record<string, string> = {
  lego: "Lego",
  "educacao financeira": "Educação Financeira",
  ia: "IA",
  python: "Python",
};

export function modalidadeCanonica(texto: string): string {
  const limpo = espacosSimples(texto);
  return MODALIDADES[semAcento(limpo).toLowerCase()] ?? limpo.charAt(0).toUpperCase() + limpo.slice(1);
}

/** Categoria e cidade propostas para uma escola que ainda não está cadastrada. */
export function escolaSugerida(nome: string): { categoria: string; cidade: string } {
  const canonico = nomeCanonicoEscola(nome);
  const cidadeNoNome = /^E\.E\. de (.+)$/.exec(canonico);
  if (cidadeNoNome) return { categoria: "estadual", cidade: cidadeNoNome[1] };
  if (canonico.startsWith("E.E. ")) return { categoria: "estadual", cidade: "Juiz de Fora" };
  if (canonico.startsWith("E.M. ")) return { categoria: "municipal", cidade: "Juiz de Fora" };
  return { categoria: "outra", cidade: "Juiz de Fora" };
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

const TEM_CONTEUDO = /[\p{L}\p{N}]/u;
const HORARIO = /(\d{1,2})h(\d{2})?\s?(?:às|as|a|-)\s?(\d{1,2})h(\d{2})?/i;
const MODALIDADE = /^(?:modalidade|m[óo]dulo)\s?:\s?(.+)$/i;
const AULAS = /\baulas?\s?\d/i;

function hora(h: string, m: string | undefined): string | null {
  const horas = Number(h);
  const minutos = Number(m ?? "0");
  if (horas > 23 || minutos > 59) return null;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

/** Tira do fim espaços e hífens (laço em vez de `[\s-]+$`, que retrocede). */
function semTracoNoFim(texto: string): string {
  let fim = texto.length;
  while (fim > 0 && (texto[fim - 1] === " " || texto[fim - 1] === "-")) fim--;
  return texto.slice(0, fim);
}

/** "aula 05e 06" → "Aulas 05 e 06". */
function descricaoDasAulas(trecho: string): string {
  const numeros = (trecho.match(/\d+/g) ?? []).map((n) => n.padStart(2, "0"));
  return `${numeros.length > 1 ? "Aulas" : "Aula"} ${numeros.join(" e ")}`;
}

type Bloco = { linhas: string[] };

function blocosDaCelula(texto: string): Bloco[] {
  const blocos: Bloco[] = [];
  let atual: string[] = [];
  for (const linha of texto.split(/\r?\n/)) {
    if (linha.trim() === "") {
      if (atual.length) blocos.push({ linhas: atual });
      atual = [];
    } else atual.push(espacosSimples(linha));
  }
  if (atual.length) blocos.push({ linhas: atual });
  return blocos;
}

type Interpretado =
  | { tipo: "evento"; evento: Omit<EventoPlanilha, "celula" | "data"> }
  | { tipo: "ignorado"; texto: string }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "vazio" };

function interpretarBloco(bloco: Bloco): Interpretado {
  const bolsistas = bloco.linhas.findIndex((l) => /^bolsistas\s?:/i.test(l));
  const linhas = (bolsistas === -1 ? bloco.linhas : bloco.linhas.slice(0, bolsistas)).filter((l) => TEM_CONTEUDO.test(l));
  if (linhas.length === 0) return { tipo: "vazio" };

  const indiceHorario = linhas.findIndex((l) => HORARIO.test(l));
  if (indiceHorario === -1) return { tipo: "ignorado", texto: linhas.join(" ") };
  const [, h1, m1, h2, m2] = HORARIO.exec(linhas[indiceHorario]) as RegExpExecArray;
  const inicio = hora(h1, m1);
  const fim = hora(h2, m2);
  if (!inicio || !fim) return { tipo: "erro", mensagem: `o horário "${linhas[indiceHorario]}" não existe` };
  if (fim <= inicio) return { tipo: "erro", mensagem: `o fim do horário (${fim}) não é depois do início (${inicio})` };

  let modalidade = "";
  let titulo = "";
  linhas.forEach((linha, i) => {
    if (i === indiceHorario) return;
    const m = MODALIDADE.exec(linha);
    if (m) {
      if (!modalidade) modalidade = modalidadeCanonica(m[1]);
    } else if (!titulo) titulo = linha;
  });

  let escola: string | null = null;
  let descricao = "";
  const aulas = titulo.search(AULAS);
  const traco = titulo.indexOf(" - ");
  if (aulas !== -1) {
    escola = semTracoNoFim(titulo.slice(0, aulas)) || null;
    descricao = descricaoDasAulas(titulo.slice(aulas));
  } else if (traco !== -1) {
    escola = titulo.slice(0, traco).trim() || null;
    const direita = modalidadeCanonica(titulo.slice(traco + 3));
    if (modalidade) descricao = direita;
    else modalidade = direita;
  } else if (titulo) {
    if (modalidade) descricao = titulo;
    else modalidade = modalidadeCanonica(titulo);
  }
  if (!modalidade) return { tipo: "erro", mensagem: "falta dizer qual é a atividade (Modalidade: …)" };

  return {
    tipo: "evento",
    evento: { inicio, fim, escola: escola ? nomeCanonicoEscola(escola) : null, modalidade, descricao },
  };
}

/** Lê os eventos da grade, contando as semanas a partir de `primeiroDia` (uma segunda-feira). */
export function interpretarCalendario(grade: Grade, primeiroDia: string): LeituraPlanilha {
  const leitura: LeituraPlanilha = { primeiroDia, eventos: [], ignorados: [], erros: [] };
  if (!dataValida(primeiroDia) || diaDaSemana(primeiroDia) !== 0) {
    leitura.erros.push("A primeira semana precisa começar numa segunda-feira.");
    return leitura;
  }

  const ultima = ultimaLinha(grade);
  const semanas: number[] = [];
  for (let l = 1; l <= ultima; l++) if (linhaDeNumeros(grade, l)) semanas.push(l);

  semanas.forEach((linhaNumeros, k) => {
    const segunda = somaDias(primeiroDia, 7 * k);
    const ate = k + 1 < semanas.length ? semanas[k + 1] : ultima + 1;
    COLUNAS.forEach((coluna, c) => {
      const data = somaDias(segunda, c);
      const dia = Number(data.slice(8, 10));
      const numero = numeroDoDia(grade.get(`${coluna}${linhaNumeros}`));
      if (numero !== null && numero !== dia) {
        leitura.erros.push(
          `A célula ${coluna}${linhaNumeros} diz ${numero}, mas a conta dá ${dia} (${dataBr(data)}). Confira o primeiro dia da planilha.`,
        );
      }
      for (let l = linhaNumeros + 1; l < ate; l++) {
        const celula = `${coluna}${l}`;
        const valor = grade.get(celula);
        if (typeof valor !== "string") continue;
        for (const bloco of blocosDaCelula(valor)) {
          const r = interpretarBloco(bloco);
          if (r.tipo === "evento") leitura.eventos.push({ celula, data, ...r.evento });
          else if (r.tipo === "ignorado") leitura.ignorados.push({ celula, data, texto: r.texto });
          else if (r.tipo === "erro") leitura.erros.push(`Na célula ${celula} (${dataBr(data)}), ${r.mensagem}.`);
        }
      }
    });
  });
  return leitura;
}

// ---------------------------------------------------------------------------
// Prévia e validação
// ---------------------------------------------------------------------------

/**
 * Casa as escolas da planilha com as cadastradas (pela chave) e marca o que já
 * existe no banco ou se repete na própria planilha (mesma data, escola e horário).
 */
export function montarPrevia(
  eventos: EventoPlanilha[],
  escolas: { id: string; nome: string }[],
  existentes: { data: string; escola_id: string | null; inicio: string | null; fim: string | null }[],
): PreviaImportacao {
  const cadastradas = new Map<string, string>();
  for (const e of escolas) if (!cadastradas.has(chaveEscola(e.nome))) cadastradas.set(chaveEscola(e.nome), e.id);

  const vistos = new Set(
    existentes.map((e) => `${e.data}|${e.escola_id ?? ""}|${(e.inicio ?? "").slice(0, 5)}|${(e.fim ?? "").slice(0, 5)}`),
  );
  const novas = new Map<string, EscolaNovaPrevia>();

  const encontros = eventos.map((evento): EncontroPrevia => {
    let escolaId: string | null = null;
    let escolaNova: string | null = null;
    if (evento.escola) {
      const chave = chaveEscola(evento.escola);
      escolaId = cadastradas.get(chave) ?? null;
      if (!escolaId) {
        if (!novas.has(chave)) {
          const nome = nomeCanonicoEscola(evento.escola);
          novas.set(chave, { chave, nome, ...escolaSugerida(nome) });
        }
        escolaNova = (novas.get(chave) as EscolaNovaPrevia).nome;
      }
    }
    const lugar = escolaId ?? (escolaNova ? `nova:${chaveEscola(escolaNova)}` : "");
    const chave = `${evento.data}|${lugar}|${evento.inicio}|${evento.fim}`;
    const duplicado = vistos.has(chave);
    vistos.add(chave);
    return { ...evento, escolaId, escolaNova, duplicado };
  });

  return { encontros, escolasNovas: [...novas.values()] };
}

function textoOuVazio(valor: unknown): string | null {
  return typeof valor === "string" ? valor.trim() : null;
}

/** Fronteira de confiança: eventos que chegam do navegador para gravar. */
export function validarEventos(valor: unknown): Validado<EventoPlanilha[]> {
  if (!Array.isArray(valor) || valor.length === 0) return { ok: false, mensagem: "Nenhum evento para importar." };
  if (valor.length > EVENTOS_MAXIMOS) {
    return { ok: false, mensagem: `A importação vai até ${EVENTOS_MAXIMOS} eventos por vez.` };
  }
  const eventos: EventoPlanilha[] = [];
  for (const item of valor) {
    if (typeof item !== "object" || item === null) return { ok: false, mensagem: "A lista de eventos veio com defeito." };
    const o = item as Record<string, unknown>;
    const celula = textoOuVazio(o.celula) ?? "";
    const data = textoOuVazio(o.data) ?? "";
    const inicio = textoOuVazio(o.inicio) ?? "";
    const fim = textoOuVazio(o.fim) ?? "";
    const modalidade = textoOuVazio(o.modalidade) ?? "";
    const descricao = textoOuVazio(o.descricao) ?? "";
    const escola = o.escola === null || o.escola === undefined ? null : textoOuVazio(o.escola);

    if (!/^[A-Z]{1,3}\d{1,7}$/.test(celula)) return { ok: false, mensagem: "A lista de eventos veio com defeito." };
    if (!dataValida(data)) return { ok: false, mensagem: `A data do evento da célula ${celula} não é válida.` };
    const horaOk = (h: string) => HORA.test(h) && Number(h.slice(0, 2)) <= 23 && Number(h.slice(3)) <= 59;
    if (!horaOk(inicio) || !horaOk(fim)) {
      return { ok: false, mensagem: `O horário do evento da célula ${celula} não é válido.` };
    }
    if (fim <= inicio) return { ok: false, mensagem: `No evento da célula ${celula}, o fim precisa ser depois do início.` };
    if (modalidade.length < 2 || modalidade.length > 80) {
      return { ok: false, mensagem: `A atividade do evento da célula ${celula} precisa ter de 2 a 80 caracteres.` };
    }
    if (descricao.length > 200) return { ok: false, mensagem: `A descrição do evento da célula ${celula} passou de 200 caracteres.` };
    if (escola !== null && (escola.length < 2 || escola.length > 120)) {
      return { ok: false, mensagem: `O nome da escola do evento da célula ${celula} precisa ter de 2 a 120 caracteres.` };
    }
    eventos.push({ celula, data, inicio, fim, escola, modalidade, descricao });
  }
  return { ok: true, valor: eventos };
}

// ---------------------------------------------------------------------------
// Escrita do .xlsx
// ---------------------------------------------------------------------------

function escaparXml(texto: string): string {
  return texto
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function partesDaRef(ref: string): { coluna: number; linha: number } {
  const letras = ref.replace(/\d+$/, "");
  let coluna = 0;
  for (const l of letras) coluna = coluna * 26 + (l.charCodeAt(0) - 64);
  return { coluna, linha: Number(ref.slice(letras.length)) };
}

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships";

/**
 * Planilha mínima de uma aba ("Calendário"). Texto quebra linha e fica no topo;
 * número e células em `negrito` saem em negrito e centralizados.
 */
export function montarXlsx(
  celulas: Record<string, string | number>,
  opcoes: { mesclas?: string[]; alturas?: Record<number, number>; negrito?: string[] } = {},
): Uint8Array {
  const negrito = new Set(opcoes.negrito ?? []);
  const porLinha = new Map<number, { coluna: number; xml: string }[]>();
  for (const [ref, valor] of Object.entries(celulas)) {
    const { coluna, linha } = partesDaRef(ref);
    const estilo = typeof valor === "number" || negrito.has(ref) ? 2 : 1;
    const xml =
      typeof valor === "number"
        ? `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`
        : `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${escaparXml(valor)}</t></is></c>`;
    porLinha.set(linha, [...(porLinha.get(linha) ?? []), { coluna, xml }]);
  }
  for (const linha of Object.keys(opcoes.alturas ?? {})) if (!porLinha.has(Number(linha))) porLinha.set(Number(linha), []);

  const linhas = [...porLinha.keys()]
    .sort((a, b) => a - b)
    .map((linha) => {
      const altura = opcoes.alturas?.[linha];
      const atributos = altura ? ` ht="${altura}" customHeight="1"` : "";
      const cels = (porLinha.get(linha) ?? []).sort((a, b) => a.coluna - b.coluna).map((c) => c.xml).join("");
      return `<row r="${linha}"${atributos}>${cels}</row>`;
    })
    .join("");
  const mesclas = opcoes.mesclas?.length
    ? `<mergeCells count="${opcoes.mesclas.length}">${opcoes.mesclas.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>`
    : "";

  const aba =
    `${XML}<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">` +
    `<cols><col min="1" max="7" width="24" customWidth="1"/><col min="8" max="8" width="12" customWidth="1"/></cols>` +
    `<sheetData>${linhas}</sheetData>${mesclas}</worksheet>`;

  const estilos =
    `${XML}<styleSheet xmlns="${NS_MAIN}">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="3">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
    `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>` +
    `</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`;

  return zipSync({
    "[Content_Types].xml": strToU8(
      `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    ),
    "_rels/.rels": strToU8(
      `${XML}<Relationships xmlns="${NS_PKG_REL}">` +
        `<Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `${XML}<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">` +
        `<sheets><sheet name="Calendário" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `${XML}<Relationships xmlns="${NS_PKG_REL}">` +
        `<Relationship Id="rId1" Type="${NS_REL}/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="${NS_REL}/styles" Target="styles.xml"/></Relationships>`,
    ),
    "xl/styles.xml": strToU8(estilos),
    "xl/worksheets/sheet1.xml": strToU8(aba),
  });
}

export const EXEMPLO_DO_MODELO =
  "Exemplo de evento (uma linha em branco separa dois eventos no mesmo dia):\n" +
  "E.M. Nome da Escola - aulas 01 e 02\nModalidade: Lego\nHorário: 13h às 17h";

/** Planilha em branco de `meses` meses a partir de `mes` ("AAAA-MM"), no formato que a importação lê. */
export function gerarModelo(mes: string, meses: number): Uint8Array {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error("Escolha o mês de início.");
  if (!Number.isInteger(meses) || meses < 1 || meses > 6) throw new Error("O modelo vai de 1 a 6 meses.");
  const ano = Number(mes.slice(0, 4));
  const mesNumero = Number(mes.slice(5, 7));
  const primeiro = `${mes}-01`;
  const ultimoDia = isoDe(new Date(Date.UTC(ano, mesNumero - 1 + meses, 0)));
  const ultimaSegunda = somaDias(ultimoDia, -diaDaSemana(ultimoDia));

  const celulas: Record<string, string | number> = { A1: EXEMPLO_DO_MODELO };
  const mesclas = ["A1:G1"];
  const alturas: Record<number, number> = { 1: 75 };
  const negrito: string[] = [];
  DIAS_DA_SEMANA.forEach((dia, c) => {
    celulas[`${COLUNAS[c]}2`] = dia;
    negrito.push(`${COLUNAS[c]}2`);
  });

  const rotulos: { linha: number; mes: number }[] = [];
  let segunda = somaDias(primeiro, -diaDaSemana(primeiro));
  for (let linha = 3; segunda <= ultimaSegunda; linha += 2, segunda = somaDias(segunda, 7)) {
    COLUNAS.forEach((coluna, c) => (celulas[`${coluna}${linha}`] = Number(somaDias(segunda, c).slice(8, 10))));
    alturas[linha + 1] = 110;
    rotulos.push({ linha, mes: linha === 3 ? mesNumero : Number(segunda.slice(5, 7)) });
  }
  rotulos.forEach((r, i) => {
    if (i > 0 && rotulos[i - 1].mes === r.mes) return;
    let fim = i;
    while (fim + 1 < rotulos.length && rotulos[fim + 1].mes === r.mes) fim++;
    celulas[`H${r.linha}`] = MESES[r.mes - 1];
    negrito.push(`H${r.linha}`);
    mesclas.push(`H${r.linha}:H${rotulos[fim].linha + 1}`);
  });

  return montarXlsx(celulas, { mesclas, alturas, negrito });
}
