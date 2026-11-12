import type {
  AreaMelhoria,
  DadosArtigo,
  EstadoAcao,
  FuncaoAlocacao,
  ModalidadeBolsa,
  NovaBolsa,
  NovaEscola,
  NovaMelhoria,
  NovaMeta,
  NovaAtividade,
  NovaProducaoPesquisa,
  NovaReuniaoPesquisa,
  NovaTurma,
  NovoAfastamento,
  NovoEncontro,
  Ocorrencia,
  PedidoLote,
  RespostaMelhoria,
  SituacaoAlocacao,
  StatusMelhoria,
  StatusTurma,
  TipoEncontro,
  TipoProducao,
} from "./types";
import { montarConteudo } from "@/lib/utils/artigo-metadados";

/**
 * Validadores pequenos dos formulários da gestão (sem biblioteca de validação,
 * plano `gestao-dia-a-dia.md`, "Arquitetura"). O banco valida de novo por
 * constraint; aqui a mensagem sai em português antes de a requisição sair.
 */

const MODALIDADES: readonly ModalidadeBolsa[] = ["graduacao", "mestrado", "bdcti", "critt", "outra"];
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export type Validado<T> = { ok: true; valor: T } | { ok: false; mensagem: string };

function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

/** Número em formato brasileiro ou internacional ("20", "20,5", "1.200,00"). */
export function lerNumero(valor: string): number | null {
  if (!valor) return null;
  const normalizado = valor.includes(",") ? valor.replace(/\./g, "").replace(",", ".") : valor;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

export function validarBolsa(form: FormData): Validado<NovaBolsa> {
  const bolsistaId = texto(form, "bolsistaId");
  const modalidade = texto(form, "modalidade") as ModalidadeBolsa;
  const carga = lerNumero(texto(form, "cargaSemanalHoras"));
  const inicio = texto(form, "inicio");
  const fim = texto(form, "fim");

  if (!bolsistaId) return { ok: false, mensagem: "Escolha o bolsista." };
  if (!MODALIDADES.includes(modalidade)) return { ok: false, mensagem: "Escolha a modalidade da bolsa." };
  if (carga === null || carga <= 0 || carga > 40) {
    return { ok: false, mensagem: "A carga semanal precisa ficar entre 1 e 40 horas." };
  }
  if (!DATA_ISO.test(inicio) || !DATA_ISO.test(fim)) {
    return { ok: false, mensagem: "Informe o início e o fim da vigência." };
  }
  if (fim < inicio) return { ok: false, mensagem: "O fim da vigência não pode ser antes do início." };

  return {
    ok: true,
    valor: { bolsistaId, modalidade, cargaSemanalHoras: carga, inicio, fim },
  };
}

const AREAS: readonly AreaMelhoria[] = ["plataforma", "gestao", "aulas_material", "processo", "outra"];
const STATUS: readonly StatusMelhoria[] = ["nova", "em_analise", "aceita", "recusada", "duplicada", "entregue"];

/** Pedido de melhoria: mesmos limites dos checks da tabela `gestao.melhoria`. */
export function validarMelhoria(form: FormData): Validado<NovaMelhoria> {
  const titulo = texto(form, "titulo");
  const area = texto(form, "area") as AreaMelhoria;
  const problema = texto(form, "problema");
  const proposta = texto(form, "proposta");
  const quemSofre = texto(form, "quemSofre");

  if (titulo.length < 3 || titulo.length > 120) {
    return { ok: false, mensagem: "Dê um título curto ao pedido (de 3 a 120 caracteres)." };
  }
  if (!AREAS.includes(area)) return { ok: false, mensagem: "Escolha sobre o que é o pedido." };
  if (problema.length < 10 || problema.length > 2000) {
    return { ok: false, mensagem: "Conte qual é o problema em pelo menos uma frase." };
  }
  if (proposta.length < 3 || proposta.length > 2000) return { ok: false, mensagem: "Conte o que você propõe." };
  if (quemSofre.length > 500) return { ok: false, mensagem: "Resuma quem sofre com isso em até 500 caracteres." };

  return { ok: true, valor: { titulo, area, problema, proposta, quemSofre: quemSofre || null } };
}

/** Resposta da coordenação: recusa e repetido exigem motivo; repetido aponta o original. */
export function validarRespostaMelhoria(form: FormData): Validado<RespostaMelhoria> {
  const status = texto(form, "status") as StatusMelhoria;
  const resposta = texto(form, "resposta");
  const duplicadaDe = texto(form, "duplicadaDe");
  const linkExecucao = texto(form, "linkExecucao");

  if (!STATUS.includes(status)) return { ok: false, mensagem: "Escolha a resposta." };
  if ((status === "recusada" || status === "duplicada") && resposta.length < 10) {
    return { ok: false, mensagem: "Recusar ou marcar como repetido exige um motivo de pelo menos 10 caracteres." };
  }
  if (status === "duplicada" && !duplicadaDe) {
    return { ok: false, mensagem: "Aponte qual é o pedido original." };
  }
  if (linkExecucao && !/^https?:\/\//.test(linkExecucao)) {
    return { ok: false, mensagem: "O link precisa começar com http:// ou https://." };
  }
  if (resposta.length > 2000) return { ok: false, mensagem: "A resposta passou de 2000 caracteres." };

  return {
    ok: true,
    valor: {
      status,
      resposta: resposta || null,
      duplicadaDe: status === "duplicada" ? duplicadaDe : null,
      linkExecucao: linkExecucao || null,
    },
  };
}

// ---------------------------------------------------------------------------
// Alocação (spec 014)
// ---------------------------------------------------------------------------

const HORA = /^\d{2}:\d{2}$/;
const SITUACOES: readonly SituacaoAlocacao[] = [
  "prevista",
  "cumprida",
  "faltou_avisou",
  "faltou_sem_aviso",
  "substituida",
  "retirada",
];
const STATUS_TURMA: readonly StatusTurma[] = ["prevista", "em_andamento", "encerrada", "nao_abriu"];

const INTEIRO = /^\d{1,7}$/;

/** Números da página inicial (spec 019): inteiros de 0 a 1.000.000. */
export function validarNumerosDoSite(form: FormData): Validado<{ escolas: number; alunos: number; aulas: number }> {
  const escolas = texto(form, "escolas").replace(/\./g, "");
  const alunos = texto(form, "alunos").replace(/\./g, "");
  const aulas = texto(form, "aulas").replace(/\./g, "");
  const valido = (v: string) => INTEIRO.test(v) && Number(v) <= 1_000_000;
  if (!valido(escolas)) return { ok: false, mensagem: "Informe o número de escolas (de 0 a 1.000.000, sem vírgula)." };
  if (!valido(alunos)) return { ok: false, mensagem: "Informe o número de alunos (de 0 a 1.000.000, sem vírgula)." };
  if (!valido(aulas)) return { ok: false, mensagem: "Informe o número de aulas (de 0 a 1.000.000, sem vírgula)." };
  return { ok: true, valor: { escolas: Number(escolas), alunos: Number(alunos), aulas: Number(aulas) } };
}

export function validarEscola(form: FormData): Validado<NovaEscola> {
  const nome = texto(form, "nome");
  const categoria = texto(form, "categoria");
  const cidade = texto(form, "cidade");
  if (nome.length < 2) return { ok: false, mensagem: "Informe o nome da escola." };
  if (!categoria) return { ok: false, mensagem: "Informe se a escola é estadual, municipal ou outra." };
  if (cidade.length < 2) return { ok: false, mensagem: "Informe a cidade da escola." };
  return { ok: true, valor: { nome, categoria, cidade } };
}

export function validarTurma(form: FormData): Validado<NovaTurma> {
  const escolaId = texto(form, "escolaId");
  const nome = texto(form, "nome");
  const modalidade = texto(form, "modalidade");
  const inicio = texto(form, "inicio");
  const fim = texto(form, "fim");
  const alunos = texto(form, "nAlunos");
  if (!escolaId) return { ok: false, mensagem: "Escolha a escola." };
  if (nome.length < 2 || nome.length > 120) return { ok: false, mensagem: "Dê um nome à turma (até 120 caracteres)." };
  if (modalidade.length < 2) return { ok: false, mensagem: "Informe a atividade, como Lego ou IA." };
  if (!DATA_ISO.test(inicio)) return { ok: false, mensagem: "Informe quando a turma começa." };
  if (fim && (!DATA_ISO.test(fim) || fim < inicio)) {
    return { ok: false, mensagem: "O fim previsto não pode ser antes do início." };
  }
  if (alunos && !(/^\d{1,4}$/.test(alunos) && Number(alunos) <= 1000)) {
    return { ok: false, mensagem: "O número de alunos deve ser um número inteiro de 0 a 1000." };
  }
  return { ok: true, valor: { escolaId, nome, modalidade, inicio, fim: fim || null, nAlunos: alunos ? Number(alunos) : null } };
}

export function validarSituacaoTurma(form: FormData): Validado<{ status: StatusTurma; motivo: string | null }> {
  const status = texto(form, "status") as StatusTurma;
  const motivo = texto(form, "motivo");
  if (!STATUS_TURMA.includes(status)) return { ok: false, mensagem: "Escolha a situação da turma." };
  if (status === "nao_abriu" && motivo.length < 3) {
    return { ok: false, mensagem: "Conte por que a turma não abriu." };
  }
  return { ok: true, valor: { status, motivo: motivo || null } };
}

/**
 * Encontro: início e fim obrigatórios (decisão 4 da spec 014). Com turma, o
 * banco usa a escola da turma; sem turma (tarefa, reunião), a escola é opcional.
 */
/** Teto do lote e da repetição (spec 020): cabe um semestre de uma turma semanal. */
export const LOTE_MAXIMO = 60;
export const REPETICOES_MAXIMAS = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** De `inicio` até `ate`, de 7 em 7 dias, as duas pontas incluídas. Datas "AAAA-MM-DD". */
export function datasSemanais(inicio: string, ate: string): string[] {
  const datas: string[] = [];
  const dia = new Date(`${inicio}T00:00:00Z`);
  while (datas.length <= REPETICOES_MAXIMAS) {
    const iso = dia.toISOString().slice(0, 10);
    if (iso > ate) break;
    datas.push(iso);
    dia.setUTCDate(dia.getUTCDate() + 7);
  }
  return datas;
}

function somarDias(iso: string, dias: number): string {
  const dia = new Date(`${iso}T00:00:00Z`);
  dia.setUTCDate(dia.getUTCDate() + dias);
  return dia.toISOString().slice(0, 10);
}

/**
 * As datas de um lançamento, em ordem: "toda semana até" (`repetirAte`) e/ou
 * outros dias da mesma semana (`dias`, 1 = segunda … 6 = sábado, depois do dia
 * do encontro). Cada outro dia usa a equipe do encontro, ou a sua própria
 * (`equipePropria-<dia>`, `equipe-<dia>`, `responsaveis-<dia>`). Nada marcado =
 * só a data do encontro.
 */
export function validarRepeticao(form: FormData, encontro: NovoEncontro): Validado<Ocorrencia[]> {
  const { data } = encontro;
  const ate = texto(form, "repetirAte");
  let semanas = [data];
  if (ate) {
    if (!DATA_ISO.test(ate)) return { ok: false, mensagem: "Informe até quando o encontro se repete." };
    if (ate < data) return { ok: false, mensagem: "A repetição precisa terminar depois da data do encontro." };
    semanas = datasSemanais(data, ate);
    if (semanas.length > REPETICOES_MAXIMAS) {
      return { ok: false, mensagem: `A repetição vai até ${REPETICOES_MAXIMAS} semanas. Escolha uma data mais próxima.` };
    }
  }

  const diaDaSemana = new Date(`${data}T00:00:00Z`).getUTCDay();
  const dias = [...new Set(form.getAll("dias").map(Number))].sort((x, y) => x - y);
  if (dias.some((d) => !Number.isInteger(d) || d <= diaDaSemana || d > 6)) {
    return { ok: false, mensagem: "Os outros dias precisam ser depois do dia do encontro, na mesma semana." };
  }
  const outros = dias.map((d) => {
    if (!form.has(`equipePropria-${d}`)) return { deslocamento: d - diaDaSemana, equipe: encontro.equipe, responsaveis: encontro.responsaveis };
    const equipe = [...new Set(form.getAll(`equipe-${d}`).filter((v): v is string => typeof v === "string" && v.length > 0))];
    const responsaveis = form.getAll(`responsaveis-${d}`).filter((v): v is string => typeof v === "string" && equipe.includes(v));
    return { deslocamento: d - diaDaSemana, equipe, responsaveis: [...new Set(responsaveis)] };
  });

  return {
    ok: true,
    valor: semanas.flatMap((semana) => [
      { data: semana, equipe: encontro.equipe, responsaveis: encontro.responsaveis },
      ...outros.map((o) => ({ data: somarDias(semana, o.deslocamento), equipe: o.equipe, responsaveis: o.responsaveis })),
    ]),
  };
}

function ids(form: FormData, campo: string): string[] {
  return [...new Set(form.getAll(campo).filter((v): v is string => typeof v === "string" && UUID.test(v)))];
}

const ACOES_LOTE = ["alocar", "retirar", "trocar", "cancelar", "concluir"] as const;

export function validarLote(form: FormData): Validado<PedidoLote> {
  const acao = texto(form, "acao") as PedidoLote["acao"];
  const encontros = ids(form, "encontros");
  const pessoas = ids(form, "pessoas");
  const pessoa = ids(form, "pessoa")[0] ?? null;
  const substituto = ids(form, "substituto")[0] ?? null;
  const motivo = texto(form, "motivo");

  if (!ACOES_LOTE.includes(acao)) return { ok: false, mensagem: "Escolha o que fazer com os encontros marcados." };
  if (encontros.length === 0) return { ok: false, mensagem: "Marque pelo menos um encontro." };
  if (encontros.length > LOTE_MAXIMO) {
    return { ok: false, mensagem: `Marque até ${LOTE_MAXIMO} encontros por vez.` };
  }
  if (acao === "alocar" && pessoas.length === 0) return { ok: false, mensagem: "Escolha quem entra nos encontros." };
  if ((acao === "retirar" || acao === "trocar") && !pessoa) return { ok: false, mensagem: "Escolha quem sai dos encontros." };
  if (acao === "trocar" && !substituto) return { ok: false, mensagem: "Escolha quem entra no lugar." };
  if (acao === "trocar" && pessoa === substituto) return { ok: false, mensagem: "Escolha outra pessoa para entrar no lugar." };
  if (acao === "cancelar" && motivo.length < 3) return { ok: false, mensagem: "Cancelar exige o motivo." };
  if (motivo.length > 500) return { ok: false, mensagem: "O motivo vai até 500 caracteres." };

  return { ok: true, valor: { acao, encontros, pessoas, pessoa, substituto, motivo } };
}

const TIPOS: readonly TipoEncontro[] = ["aula", "impressao", "gravacao", "reuniao", "outro"];
const FUNCOES: readonly FuncaoAlocacao[] = ["responsavel", "apoio"];

export function validarEncontro(form: FormData): Validado<NovoEncontro> {
  const data = texto(form, "data");
  const inicio = texto(form, "inicio");
  const fim = texto(form, "fim");
  const turmaId = texto(form, "turmaId");
  const escolaId = texto(form, "escolaId");
  const modalidade = texto(form, "modalidade");
  const descricao = texto(form, "descricao");
  const numeroAula = texto(form, "numeroAula");
  const tipo = (texto(form, "tipo") || "aula") as TipoEncontro;
  const espacoId = texto(form, "espacoId");
  const equipe = form.getAll("equipe").filter((v): v is string => typeof v === "string" && v.length > 0);

  if (!DATA_ISO.test(data)) return { ok: false, mensagem: "Informe a data do encontro." };
  if (!HORA.test(inicio) || !HORA.test(fim)) return { ok: false, mensagem: "Informe o início e o fim do encontro." };
  if (fim <= inicio) return { ok: false, mensagem: "O fim precisa ser depois do início." };
  if (modalidade.length < 2) return { ok: false, mensagem: "Informe a atividade, como Lego ou Organizar materiais." };
  if (descricao.length > 200) return { ok: false, mensagem: "A descrição passou de 200 caracteres." };
  if (numeroAula && (!/^\d{1,3}$/.test(numeroAula) || Number(numeroAula) === 0)) {
    return { ok: false, mensagem: "O número da aula precisa ser um inteiro de 1 a 999." };
  }
  if (!TIPOS.includes(tipo)) return { ok: false, mensagem: "Escolha o tipo da atividade." };
  if (espacoId && !UUID.test(espacoId)) return { ok: false, mensagem: "Escolha o espaço de novo." };
  const responsaveis = form.getAll("responsaveis").filter((v): v is string => typeof v === "string" && equipe.includes(v));

  return {
    ok: true,
    valor: {
      data,
      inicio,
      fim,
      modalidade,
      descricao,
      turmaId: turmaId || null,
      // Com turma, o banco usa a escola da turma; sem turma, a escola é opcional.
      escolaId: turmaId ? null : escolaId || null,
      numeroAula: numeroAula ? Number(numeroAula) : null,
      tipo,
      espacoId: espacoId || null,
      equipe: [...new Set(equipe)],
      responsaveis: [...new Set(responsaveis)],
    },
  };
}

export interface MudancaAlocacao {
  situacao: SituacaoAlocacao;
  inicio: string | null;
  fim: string | null;
  cobertoPor: string | null;
  motivo: string | null;
  /** Só faz sentido para quem esteve no encontro (prevista ou cumprida). */
  atrasoMinutos: number | null;
  funcao: FuncaoAlocacao;
}

/** Situação de uma alocação, com o intervalo parcial e quem cobriu. */
export function validarMudancaAlocacao(form: FormData): Validado<MudancaAlocacao> {
  const situacao = texto(form, "situacao") as SituacaoAlocacao;
  const inicio = texto(form, "inicio");
  const fim = texto(form, "fim");
  const cobertoPor = texto(form, "cobertoPor");
  const motivo = texto(form, "motivo");
  const atraso = texto(form, "atrasoMinutos");
  const funcao = (texto(form, "funcao") || "apoio") as FuncaoAlocacao;

  if (!SITUACOES.includes(situacao) || situacao === "substituida") {
    return { ok: false, mensagem: "Escolha a situação." };
  }
  if (!FUNCOES.includes(funcao)) return { ok: false, mensagem: "Escolha a função." };
  if (Boolean(inicio) !== Boolean(fim)) {
    return { ok: false, mensagem: "Para horário parcial, informe a chegada e a saída." };
  }
  if (inicio && (!HORA.test(inicio) || !HORA.test(fim) || fim <= inicio)) {
    return { ok: false, mensagem: "A saída precisa ser depois da chegada." };
  }
  if (situacao === "retirada" && motivo.length < 3) {
    return { ok: false, mensagem: "Retirar alguém do encontro exige o motivo." };
  }
  if (motivo.length > 500) return { ok: false, mensagem: "O motivo passou de 500 caracteres." };
  if (atraso && (!/^\d{1,3}$/.test(atraso) || Number(atraso) < 1 || Number(atraso) > 600)) {
    return { ok: false, mensagem: "O atraso vai de 1 a 600 minutos." };
  }
  const esteve = situacao === "prevista" || situacao === "cumprida";

  return {
    ok: true,
    valor: {
      situacao,
      inicio: inicio || null,
      fim: fim || null,
      cobertoPor: cobertoPor || null,
      motivo: motivo || null,
      atrasoMinutos: atraso && esteve ? Number(atraso) : null,
      funcao,
    },
  };
}

/** Espaço da agenda: o mesmo limite do check de `gestao.espaco`. */
export function validarEspaco(form: FormData): Validado<{ nome: string; ativo: boolean }> {
  const nome = texto(form, "nome");
  if (nome.length < 2 || nome.length > 80) return { ok: false, mensagem: "O nome do espaço vai de 2 a 80 caracteres." };
  return { ok: true, valor: { nome, ativo: form.get("ativo") !== null } };
}

/** Tipo e espaço de um encontro já lançado; espaço vazio tira o espaço. */
/** Meta: mesmos limites dos checks de `gestao.meta`; ao menos um responsável. */
export function validarMeta(form: FormData): Validado<NovaMeta> {
  const titulo = texto(form, "titulo");
  const descricao = texto(form, "descricao");
  const prazo = texto(form, "prazo");
  const responsaveis = form.getAll("responsaveis").filter((v): v is string => typeof v === "string" && v.length > 0);

  if (titulo.length < 3 || titulo.length > 200) {
    return { ok: false, mensagem: "Dê um título à meta (de 3 a 200 caracteres)." };
  }
  if (descricao.length > 2000) return { ok: false, mensagem: "A descrição vai até 2000 caracteres." };
  if (!DATA_ISO.test(prazo)) return { ok: false, mensagem: "Informe o prazo." };
  if (responsaveis.length === 0) return { ok: false, mensagem: "Escolha ao menos um responsável." };
  if (new Set(responsaveis).size !== responsaveis.length) {
    return { ok: false, mensagem: "Cada responsável entra uma vez só." };
  }

  return { ok: true, valor: { titulo, descricao: descricao || null, prazo, responsaveis } };
}

/** Registro de andamento de uma meta. */
export function validarAndamento(form: FormData): Validado<{ texto: string }> {
  const valor = texto(form, "texto");
  if (valor.length < 2 || valor.length > 2000) {
    return { ok: false, mensagem: "Conte o andamento (de 2 a 2000 caracteres)." };
  }
  return { ok: true, valor: { texto: valor } };
}

export const TIPO_PRODUCAO: Record<TipoProducao, string> = {
  artigo_congresso: "Artigo em congresso",
  artigo_publicado: "Artigo publicado",
  relatorio: "Relatório",
  substack: "Substack",
  ebook: "E-book",
  outro: "Outro",
};

/** Reunião de pesquisa: mesmos limites dos checks de `gestao.reuniao_pesquisa`. */
export function validarReuniao(form: FormData): Validado<NovaReuniaoPesquisa> {
  const data = texto(form, "data");
  const participantes = texto(form, "participantes");
  const feito = texto(form, "feito");
  const desdobramentos = texto(form, "desdobramentos");
  if (!DATA_ISO.test(data)) return { ok: false, mensagem: "Informe a data da reunião." };
  if (participantes.length < 2 || participantes.length > 1000) {
    return { ok: false, mensagem: "Diga quem participou (de 2 a 1000 caracteres)." };
  }
  if (feito.length < 2 || feito.length > 5000) {
    return { ok: false, mensagem: "Conte o que foi feito (de 2 a 5000 caracteres)." };
  }
  if (desdobramentos.length > 5000) return { ok: false, mensagem: "Os desdobramentos vão até 5000 caracteres." };
  return { ok: true, valor: { data, participantes, feito, desdobramentos: desdobramentos || null } };
}

/** Produção de pesquisa: mesmos limites dos checks de `gestao.producao_pesquisa`. */
export function validarProducao(form: FormData): Validado<NovaProducaoPesquisa> {
  const tipo = texto(form, "tipo");
  const titulo = texto(form, "titulo");
  const autores = texto(form, "autores");
  const data = texto(form, "data");
  const onde = texto(form, "onde");
  const link = texto(form, "link");
  if (!Object.hasOwn(TIPO_PRODUCAO, tipo)) return { ok: false, mensagem: "Escolha o tipo da produção." };
  if (titulo.length < 2 || titulo.length > 300) {
    return { ok: false, mensagem: "Dê um título à produção (de 2 a 300 caracteres)." };
  }
  if (autores.length < 2 || autores.length > 1000) {
    return { ok: false, mensagem: "Informe os autores (de 2 a 1000 caracteres)." };
  }
  if (!DATA_ISO.test(data)) return { ok: false, mensagem: "Informe a data da produção." };
  if (onde.length > 300) return { ok: false, mensagem: "O campo “onde” vai até 300 caracteres." };
  if (link && (link.length > 500 || !/^https?:\/\/\S+$/i.test(link))) {
    return { ok: false, mensagem: "O link precisa começar com http:// ou https:// (até 500 caracteres)." };
  }
  return {
    ok: true,
    valor: { tipo: tipo as TipoProducao, titulo, autores, data, onde: onde || null, link: link || null },
  };
}

export function validarAfastamento(form: FormData): Validado<NovoAfastamento> {
  const bolsistaId = texto(form, "bolsistaId");
  const inicio = texto(form, "inicio");
  const fim = texto(form, "fim");
  const motivo = texto(form, "motivo");
  if (!bolsistaId) return { ok: false, mensagem: "Escolha o bolsista." };
  if (!DATA_ISO.test(inicio) || !DATA_ISO.test(fim)) return { ok: false, mensagem: "Informe o início e o fim." };
  if (fim < inicio) return { ok: false, mensagem: "O fim não pode ser antes do início." };
  if (motivo.length < 3 || motivo.length > 300) {
    return { ok: false, mensagem: "Escreva um motivo curto, sem dado de saúde (de 3 a 300 caracteres)." };
  }
  return { ok: true, valor: { bolsistaId, inicio, fim, motivo } };
}

/**
 * Traduz o erro do banco para uma frase que a coordenação entenda. Mensagens
 * que o próprio schema levanta em português (`gestao: ...`) passam limpas.
 */
export function mensagemDeErro(erro: unknown, padrao = "Não foi possível salvar. Tente de novo."): string {
  const texto = erro instanceof Error ? erro.message : typeof erro === "string" ? erro : "";
  if (texto.startsWith("gestao: ")) {
    const frase = texto.slice("gestao: ".length);
    return frase.charAt(0).toUpperCase() + frase.slice(1) + ".";
  }
  if (texto.includes("agenda_bolsista_bolsista_id_papel_membro_fkey") || texto.includes("bolsa_bolsista_id_fkey")) {
    return "Esta pessoa já tem trabalho registrado no projeto. Use “Desligar” para tirar o acesso sem apagar o histórico.";
  }
  if (texto.includes("papel_membro_algum_papel")) {
    return "A pessoa precisa ficar com ao menos um papel. Para tirar o acesso, use “Desligar”.";
  }
  if (texto.includes("agenda_bolsista_agenda_id_bolsista_id_key")) return "Esta pessoa já está neste encontro.";
  if (texto.includes("article_slug_key")) return "Já existe um artigo com esse endereço.";
  if (texto.includes("Professor não verificado")) return "Você não tem permissão para fazer isso.";
  if (texto.includes("espaco_nome_unico")) return "Já existe um espaço com esse nome.";
  if (texto.includes("papel_membro_pkey") || texto.includes("duplicate key")) {
    return "Esta pessoa já faz parte da equipe.";
  }
  if (texto.includes("melhoria_motivo_obrigatorio")) {
    return "Recusar ou marcar como repetido exige um motivo de pelo menos 10 caracteres.";
  }
  if (texto.includes("melhoria_duplicada_aponta_original")) return "Aponte qual é o pedido original.";
  if (texto.includes("agenda_bolsista_nao_cobre_a_si")) return "A pessoa não pode cobrir a si mesma.";
  if (texto.includes("turma_nao_abriu_com_motivo")) return "Conte por que a turma não abriu.";
  if (texto.includes("row-level security") || texto.includes("42501")) {
    return "Você não tem permissão para fazer isso.";
  }
  return padrao;
}

/** Atividade do relatório: nome, o dia em que aconteceu e, se houver, a comprovação. */
export function validarAtividade(form: FormData): Validado<NovaAtividade> {
  const nome = texto(form, "nome");
  const data = texto(form, "data");
  const comprovacao = texto(form, "comprovacao");
  if (nome.length < 2 || nome.length > 200) return { ok: false, mensagem: "Dê um nome à atividade (até 200 caracteres)." };
  if (!DATA_ISO.test(data)) return { ok: false, mensagem: "Informe o dia em que a atividade aconteceu." };
  if (comprovacao.length > 500) return { ok: false, mensagem: "A comprovação pode ter até 500 caracteres." };
  return { ok: true, valor: { nome, data, comprovacao: comprovacao || null } };
}

/** Endereço do artigo: minúsculo, sem acento, palavras ligadas por hífen. */
export function slugDe(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

export function validarArtigo(form: FormData): Validado<DadosArtigo> {
  const titulo = texto(form, "titulo");
  const slug = slugDe(titulo);
  const status = form.get("status");
  const resumo = texto(form, "resumo") || null;
  const corpo = texto(form, "conteudo");
  const metadados = {
    autores: texto(form, "autores"),
    publicadoEm: texto(form, "publicadoEm"),
    doi: texto(form, "doi"),
    palavrasChave: texto(form, "palavrasChave"),
    link: texto(form, "link"),
  };
  if (!titulo || titulo.length > 200) return { ok: false, mensagem: "Dê um título ao artigo (até 200 caracteres)." };
  if (!slug) return { ok: false, mensagem: "O título precisa ter letras ou números." };
  if (status !== "draft" && status !== "published") return { ok: false, mensagem: "Escolha o status." };
  if (status === "published" && !corpo) return { ok: false, mensagem: "Escreva o conteúdo antes de publicar." };
  for (const valor of [metadados.autores, metadados.publicadoEm, metadados.palavrasChave]) {
    if (valor.length > 500) return { ok: false, mensagem: "Os campos da publicação podem ter até 500 caracteres." };
    if (/[*<\r\n]/.test(valor)) return { ok: false, mensagem: "Os campos da publicação não aceitam * nem <." };
  }
  const url = (v: string) => !v || (v.length <= 500 && /^https?:\/\/[^\s<"*]+$/i.test(v));
  if (!url(metadados.doi)) return { ok: false, mensagem: "O DOI precisa começar com http:// ou https://." };
  if (!url(metadados.link)) return { ok: false, mensagem: "O link precisa começar com http:// ou https://." };
  const conteudo = montarConteudo(corpo, metadados) || null;
  return { ok: true, valor: { titulo, slug, resumo, conteudo, status } };
}

const TIPOS_CAPA = ["image/jpeg", "image/png", "image/webp"];
/** Mesmo limite do bucket `site-media`. */
export const LIMITE_CAPA = 5 * 1024 * 1024;

/** Capa opcional: arquivo vazio conta como "sem capa nova". */
export function validarCapa(valor: FormDataEntryValue | null): Validado<File | null> {
  if (!(valor instanceof File) || valor.size === 0) return { ok: true, valor: null };
  if (!TIPOS_CAPA.includes(valor.type)) return { ok: false, mensagem: "A capa precisa ser JPG, PNG ou WebP." };
  if (valor.size > LIMITE_CAPA) return { ok: false, mensagem: "A capa pode ter até 5 MB." };
  return { ok: true, valor };
}

export function falha(mensagem: string): EstadoAcao {
  return { ok: false, mensagem };
}

export function sucesso(mensagem: string): EstadoAcao {
  return { ok: true, mensagem };
}
