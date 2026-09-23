import type { EstadoAcao, ModalidadeBolsa, NovaBolsa } from "./types";

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
