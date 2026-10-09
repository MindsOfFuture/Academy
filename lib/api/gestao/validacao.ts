import type {
  AreaMelhoria,
  EstadoAcao,
  ModalidadeBolsa,
  NovaBolsa,
  NovaEscola,
  NovaMelhoria,
  NovaTurma,
  NovoAfastamento,
  NovoEncontro,
  RespostaMelhoria,
  SituacaoAlocacao,
  StatusMelhoria,
  StatusTurma,
} from "./types";

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
  if (!escolaId) return { ok: false, mensagem: "Escolha a escola." };
  if (nome.length < 2 || nome.length > 120) return { ok: false, mensagem: "Dê um nome à turma (até 120 caracteres)." };
  if (modalidade.length < 2) return { ok: false, mensagem: "Informe a atividade, como Lego ou IA." };
  if (!DATA_ISO.test(inicio)) return { ok: false, mensagem: "Informe quando a turma começa." };
  if (fim && (!DATA_ISO.test(fim) || fim < inicio)) {
    return { ok: false, mensagem: "O fim previsto não pode ser antes do início." };
  }
  return { ok: true, valor: { escolaId, nome, modalidade, inicio, fim: fim || null } };
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
 * Encontro: início e fim obrigatórios (decisão 4 da spec 014). Sem turma, a
 * escola vem do formulário; com turma, o banco usa a da turma.
 */
export function validarEncontro(form: FormData): Validado<NovoEncontro> {
  const data = texto(form, "data");
  const inicio = texto(form, "inicio");
  const fim = texto(form, "fim");
  const turmaId = texto(form, "turmaId");
  const escolaId = texto(form, "escolaId");
  const modalidade = texto(form, "modalidade");
  const descricao = texto(form, "descricao");
  const equipe = form.getAll("equipe").filter((v): v is string => typeof v === "string" && v.length > 0);

  if (!DATA_ISO.test(data)) return { ok: false, mensagem: "Informe a data do encontro." };
  if (!HORA.test(inicio) || !HORA.test(fim)) return { ok: false, mensagem: "Informe o início e o fim do encontro." };
  if (fim <= inicio) return { ok: false, mensagem: "O fim precisa ser depois do início." };
  if (!turmaId && !escolaId) return { ok: false, mensagem: "Escolha a turma ou, se não tiver turma, a escola." };
  if (modalidade.length < 2) return { ok: false, mensagem: "Informe a atividade, como Lego ou Organizar materiais." };
  if (descricao.length > 200) return { ok: false, mensagem: "A descrição passou de 200 caracteres." };

  return {
    ok: true,
    valor: {
      data,
      inicio,
      fim,
      modalidade,
      descricao,
      turmaId: turmaId || null,
      escolaId,
      equipe: [...new Set(equipe)],
    },
  };
}

export interface MudancaAlocacao {
  situacao: SituacaoAlocacao;
  inicio: string | null;
  fim: string | null;
  cobertoPor: string | null;
  motivo: string | null;
}

/** Situação de uma alocação, com o intervalo parcial e quem cobriu. */
export function validarMudancaAlocacao(form: FormData): Validado<MudancaAlocacao> {
  const situacao = texto(form, "situacao") as SituacaoAlocacao;
  const inicio = texto(form, "inicio");
  const fim = texto(form, "fim");
  const cobertoPor = texto(form, "cobertoPor");
  const motivo = texto(form, "motivo");

  if (!SITUACOES.includes(situacao) || situacao === "substituida") {
    return { ok: false, mensagem: "Escolha a situação." };
  }
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

  return {
    ok: true,
    valor: { situacao, inicio: inicio || null, fim: fim || null, cobertoPor: cobertoPor || null, motivo: motivo || null },
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

export function falha(mensagem: string): EstadoAcao {
  return { ok: false, mensagem };
}

export function sucesso(mensagem: string): EstadoAcao {
  return { ok: true, mensagem };
}
