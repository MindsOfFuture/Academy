import type {
  AreaMelhoria,
  EstadoAcao,
  ModalidadeBolsa,
  NovaBolsa,
  NovaMelhoria,
  RespostaMelhoria,
  StatusMelhoria,
} from "./types";

/**
 * Validadores pequenos dos formulários da gestão (sem biblioteca de validação,
 * plano `gestao-dia-a-dia.md`, "Arquitetura"). O banco valida de novo por
 * constraint; aqui a mensagem sai em português antes de a requisição sair.
 */

const MODALIDADES: readonly ModalidadeBolsa[] = ["graduacao", "mestrado", "bdcti", "critt", "outra"];
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function validarEmail(valor: string): Validado<string> {
  const email = valor.trim().toLowerCase();
  if (!EMAIL.test(email)) return { ok: false, mensagem: "Informe um e-mail completo, como nome@ufjf.br." };
  return { ok: true, valor: email };
}

export function validarBolsa(form: FormData): Validado<NovaBolsa> {
  const bolsistaId = texto(form, "bolsistaId");
  const modalidade = texto(form, "modalidade") as ModalidadeBolsa;
  const carga = lerNumero(texto(form, "cargaSemanalHoras"));
  const valor = lerNumero(texto(form, "valorMensal"));
  const inicio = texto(form, "inicio");
  const fim = texto(form, "fim");

  if (!bolsistaId) return { ok: false, mensagem: "Escolha o bolsista." };
  if (!MODALIDADES.includes(modalidade)) return { ok: false, mensagem: "Escolha a modalidade da bolsa." };
  if (carga === null || carga <= 0 || carga > 40) {
    return { ok: false, mensagem: "A carga semanal precisa ficar entre 1 e 40 horas." };
  }
  if (valor === null || valor < 0) return { ok: false, mensagem: "Informe o valor mensal da bolsa." };
  if (!DATA_ISO.test(inicio) || !DATA_ISO.test(fim)) {
    return { ok: false, mensagem: "Informe o início e o fim da vigência." };
  }
  if (fim < inicio) return { ok: false, mensagem: "O fim da vigência não pode ser antes do início." };

  return {
    ok: true,
    valor: { bolsistaId, modalidade, cargaSemanalHoras: carga, valorMensal: valor, inicio, fim },
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
  if (texto.includes("papel_membro_pkey") || texto.includes("duplicate key")) {
    return "Esta pessoa já faz parte da equipe.";
  }
  if (texto.includes("melhoria_motivo_obrigatorio")) {
    return "Recusar ou marcar como repetido exige um motivo de pelo menos 10 caracteres.";
  }
  if (texto.includes("melhoria_duplicada_aponta_original")) return "Aponte qual é o pedido original.";
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
