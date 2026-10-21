"use server";

import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import {
  alocar,
  atualizarAlocacao,
  cadastrarEscola,
  cadastrarTurma,
  cancelarEncontro,
  concluirEncontro,
  conflitosDeHorario,
  criarEncontro,
  criarEncontros,
  definirSituacaoTurma,
  editarEscola,
  editarTurma,
  escreverNotaEncerramento,
  mensagemDoLote,
  obterEncontros,
  planejarLote,
  registrarAfastamento,
  removerAlocacao,
  substituirAlocacao,
} from "@/lib/api/gestao/alocacao";
import { avisar, avisarLote, type ItemAviso, type MotivoAviso } from "@/lib/api/gestao/avisos";
import type { ConflitoHorario, EstadoAcao } from "@/lib/api/gestao/types";
import {
  falha,
  mensagemDeErro,
  sucesso,
  validarAfastamento,
  validarEncontro,
  validarEscola,
  validarLote,
  validarMudancaAlocacao,
  validarRepeticao,
  validarSituacaoTurma,
  validarTurma,
} from "@/lib/api/gestao/validacao";

/**
 * Ações da alocação (spec 014). Só a coordenação aloca nesta spec; toda ação
 * confere o papel antes de tocar no banco, e a RLS confere de novo.
 */


async function exigirCoordenacao(): Promise<EstadoAcao | null> {
  try {
    const papel = await ensureGestaoMember();
    return papel === "coordenacao" ? null : falha("Apenas a coordenação faz a alocação.");
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
}

function campo(form: FormData, nome: string): string {
  const valor = form.get(nome);
  return typeof valor === "string" ? valor.trim() : "";
}

/** Roda a escrita, revalida a alocação inteira e traduz o erro do banco. */
async function executar(escrita: () => Promise<unknown>, mensagem: string): Promise<EstadoAcao> {
  try {
    await escrita();
    // "/gestao" inteiro: a página do encontro do bolsista e a tela "Hoje" também mudam.
    revalidatePath("/gestao", "layout");
    return sucesso(mensagem);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
}

export async function cadastrarEscolaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const escola = validarEscola(form);
  if (!escola.ok) return falha(escola.mensagem);
  return executar(() => cadastrarEscola(escola.valor), "Escola cadastrada.");
}

export async function cadastrarTurmaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const turma = validarTurma(form);
  if (!turma.ok) return falha(turma.mensagem);
  return executar(() => cadastrarTurma(turma.valor), "Turma cadastrada.");
}

export async function editarEscolaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "escolaId");
  const escola = validarEscola(form);
  if (!id) return falha("Escola não informada.");
  if (!escola.ok) return falha(escola.mensagem);
  return executar(() => editarEscola(id, escola.valor), "Escola atualizada.");
}

/** O formulário manda a escola da turma só para passar na validação; ela não muda. */
export async function editarTurmaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "turmaId");
  const turma = validarTurma(form);
  if (!id) return falha("Turma não informada.");
  if (!turma.ok) return falha(turma.mensagem);
  return executar(() => editarTurma(id, turma.valor), "Turma atualizada.");
}

export async function situacaoTurmaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "turmaId");
  const situacao = validarSituacaoTurma(form);
  if (!id) return falha("Turma não informada.");
  if (!situacao.ok) return falha(situacao.mensagem);
  return executar(() => definirSituacaoTurma(id, situacao.valor.status, situacao.valor.motivo), "Situação atualizada.");
}

export async function criarEncontroAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const encontro = validarEncontro(form);
  if (!encontro.ok) return falha(encontro.mensagem);
  const datas = validarRepeticao(form, encontro.valor.data);
  if (!datas.ok) return falha(datas.mensagem);
  const pessoas = encontro.valor.equipe.length;
  const comQuem = pessoas ? ` com ${pessoas} ${pessoas === 1 ? "pessoa" : "pessoas"}` : ", ainda sem equipe";

  if (datas.valor.length === 1) {
    return executar(
      async () => avisar("alocado", await criarEncontro(encontro.valor), encontro.valor.equipe),
      `Encontro lançado${comQuem}.`,
    );
  }
  // Spec 020: toda semana até a data escolhida; um e-mail por pessoa com todas as datas.
  const dia = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  return executar(async () => {
    const ids = await criarEncontros(encontro.valor, datas.valor);
    await avisarLote("alocado", ids.map((encontroId) => ({ encontroId, pessoas: encontro.valor.equipe })));
  }, `${datas.valor.length} encontros lançados, de ${dia(datas.valor[0])} a ${dia(datas.valor.at(-1)!)}${comQuem}.`);
}

/**
 * Antes de lançar: quem da equipe escolhida já está em outro encontro no mesmo
 * horário, em cada data da repetição. É aviso, não trava — a coordenação decide
 * se revisa ou lança mesmo assim. Formulário incompleto devolve lista vazia; a
 * validação de verdade é a do lançamento.
 */
export async function conflitosEncontroAction(form: FormData): Promise<ConflitoHorario[]> {
  if (await exigirCoordenacao()) return [];
  const encontro = validarEncontro(form);
  if (!encontro.ok) return [];
  const datas = validarRepeticao(form, encontro.valor.data);
  if (!datas.ok) return [];
  const { inicio, fim, equipe } = encontro.valor;
  try {
    return (await Promise.all(datas.valor.map((data) => conflitosDeHorario(data, inicio, fim, equipe)))).flat();
  } catch {
    return [];
  }
}

export async function cancelarEncontroAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "encontroId");
  const motivo = campo(form, "motivo");
  if (!id) return falha("Encontro não informado.");
  if (motivo.length < 3) return falha("Cancelar um encontro exige o motivo.");
  return executar(async () => {
    await cancelarEncontro(id, motivo);
    await avisar("cancelado", id, "equipe");
  }, "Encontro cancelado. Ele continua no histórico.");
}

/** Concluir ou reabrir à mão: só a coordenação, com relatório opcional. */
export async function concluirEncontroAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "encontroId");
  const concluir = campo(form, "acao") !== "reabrir";
  const relatorio = campo(form, "relatorio");
  if (!id) return falha("Encontro não informado.");
  if (relatorio.length > 5000) return falha("O relatório vai até 5000 caracteres.");
  return executar(
    () => concluirEncontro(id, concluir, concluir ? relatorio : null),
    concluir ? "Encontro concluído. Quem estava prevista ficou como cumprida." : "Encontro reaberto.",
  );
}

/** Uma ou várias pessoas de uma vez no mesmo encontro (spec 020). */
export async function alocarAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "encontroId");
  const pessoas = [...new Set(form.getAll("bolsistaId").filter((v): v is string => typeof v === "string" && v !== ""))];
  if (!id || pessoas.length === 0) return falha("Escolha quem entra no encontro.");
  return executar(async () => {
    await alocar(id, pessoas);
    await avisar("alocado", id, pessoas);
  }, pessoas.length === 1 ? "Pessoa alocada." : `${pessoas.length} pessoas alocadas.`);
}

export async function atualizarAlocacaoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "alocacaoId");
  const mudanca = validarMudancaAlocacao(form);
  if (!id) return falha("Alocação não informada.");
  if (!mudanca.ok) return falha(mudanca.mensagem);
  return executar(() => atualizarAlocacao(id, mudanca.valor), "Alocação atualizada.");
}

export async function removerAlocacaoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "alocacaoId");
  if (!id) return falha("Alocação não informada.");
  return executar(async () => {
    const saiu = await removerAlocacao(id);
    await avisar("removido", saiu.encontroId, [saiu.bolsistaId]);
  }, "Pessoa removida do encontro.");
}

/**
 * A nota de encerramento de quem está no encontro. Aqui só se exige ser da
 * equipe; quem pode de fato o banco decide, em `gestao.escrever_nota_encerramento()`.
 */
export async function escreverNotaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  try {
    await ensureGestaoMember();
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
  const id = campo(form, "encontroId");
  const nota = campo(form, "nota");
  if (!id) return falha("Encontro não informado.");
  if (nota.length < 10 || nota.length > 5000) return falha("Escreva a nota de encerramento (de 10 a 5000 caracteres).");
  let concluiu = false;
  const estado = await executar(async () => {
    concluiu = await escreverNotaEncerramento(id, nota);
  }, "Nota salva.");
  return estado.ok && concluiu ? sucesso("Nota salva. Era a última: o encontro foi concluído.") : estado;
}

export async function substituirAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "alocacaoId");
  const substituto = campo(form, "substitutoId");
  const motivo = campo(form, "motivo");
  if (!id || !substituto) return falha("Escolha quem substitui.");
  return executar(async () => {
    const { encontroId, saiuId } = await substituirAlocacao(id, substituto, motivo || null);
    await Promise.all([avisar("substituido", encontroId, [saiuId]), avisar("alocado", encontroId, [substituto])]);
  }, "Substituição registrada.");
}

export async function afastamentoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const afastamento = validarAfastamento(form);
  if (!afastamento.ok) return falha(afastamento.mensagem);
  return executar(
    () => registrarAfastamento(afastamento.valor),
    "Afastamento registrado. Substitua os encontros listados abaixo.",
  );
}

// ---------------------------------------------------------------------------
// Em lote (spec 020)
// ---------------------------------------------------------------------------

const AVISO_DO_LOTE: Partial<Record<string, MotivoAviso>> = {
  alocar: "alocado",
  retirar: "removido",
  trocar: "substituido",
  cancelar: "cancelado",
};

/**
 * A mesma ação em vários encontros marcados no calendário. Cada encontro passa
 * pela função que a tela de um encontro usa; o que não couber fica de fora e a
 * mensagem diz por quê. Sem transação entre encontros: o que já foi feito vale.
 */
export async function loteAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const pedido = validarLote(form);
  if (!pedido.ok) return falha(pedido.mensagem);
  const { acao, motivo, substituto } = pedido.valor;

  let encontros;
  try {
    encontros = await obterEncontros(pedido.valor.encontros);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  const plano = planejarLote(pedido.valor, encontros);
  const deFora = plano.pulados.map((p) => ({ data: p.encontro.data, motivo: p.motivo }));
  const avisos: ItemAviso[] = [];
  const entrou: ItemAviso[] = [];
  let feitos = 0;

  for (const passo of plano.passos) {
    const id = passo.encontro.id;
    try {
      if (acao === "alocar") {
        await alocar(id, passo.pessoas);
        avisos.push({ encontroId: id, pessoas: passo.pessoas });
      } else if (acao === "retirar") {
        await removerAlocacao(passo.alocacaoId!);
        avisos.push({ encontroId: id, pessoas: passo.pessoas });
      } else if (acao === "trocar") {
        await substituirAlocacao(passo.alocacaoId!, substituto!, motivo || null);
        avisos.push({ encontroId: id, pessoas: passo.pessoas });
        entrou.push({ encontroId: id, pessoas: [substituto!] });
      } else if (acao === "cancelar") {
        await cancelarEncontro(id, motivo);
        avisos.push({ encontroId: id, pessoas: "equipe" });
      } else {
        await concluirEncontro(id, true, null);
      }
      feitos++;
    } catch (error) {
      const texto = mensagemDeErro(error);
      deFora.push({ data: passo.encontro.data, motivo: texto.charAt(0).toLowerCase() + texto.slice(1) });
    }
  }

  if (feitos > 0) {
    revalidatePath("/gestao", "layout");
    const motivoAviso = AVISO_DO_LOTE[acao];
    await Promise.all([motivoAviso ? avisarLote(motivoAviso, avisos) : null, avisarLote("alocado", entrou)]);
  }
  deFora.sort((x, y) => x.data.localeCompare(y.data));
  const mensagem = mensagemDoLote(feitos, deFora);
  return feitos > 0 ? sucesso(mensagem) : falha(mensagem);
}

/**
 * Antes de acrescentar ou trocar em lote: quem entra e já está em outro
 * encontro no mesmo horário. Mesmo aviso do lançamento; não trava.
 */
export async function conflitosLoteAction(form: FormData): Promise<ConflitoHorario[]> {
  if (await exigirCoordenacao()) return [];
  const pedido = validarLote(form);
  if (!pedido.ok || (pedido.valor.acao !== "alocar" && pedido.valor.acao !== "trocar")) return [];
  const entram = pedido.valor.acao === "trocar" ? [pedido.valor.substituto!] : null;
  try {
    const plano = planejarLote(pedido.valor, await obterEncontros(pedido.valor.encontros));
    const achados = await Promise.all(
      plano.passos
        .filter((p) => p.encontro.inicio && p.encontro.fim)
        .map(async (p) => {
          const lista = await conflitosDeHorario(p.encontro.data, p.encontro.inicio!, p.encontro.fim!, entram ?? p.pessoas);
          return lista.filter((c) => c.encontroId !== p.encontro.id);
        }),
    );
    return achados.flat();
  } catch {
    return [];
  }
}

/** Afastamento (spec 020): a mesma pessoa substitui em todos os encontros pendentes. */
export async function substituirTodosAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const alocacoes = [...new Set(form.getAll("alocacaoId").filter((v): v is string => typeof v === "string" && v !== ""))];
  const substituto = campo(form, "substitutoId");
  const motivo = campo(form, "motivo");
  if (alocacoes.length === 0) return falha("Nenhum encontro pendente.");
  if (!substituto) return falha("Escolha quem substitui.");

  const saiu: ItemAviso[] = [];
  const entrou: ItemAviso[] = [];
  let falhas = 0;
  for (const id of alocacoes) {
    try {
      const { encontroId, saiuId } = await substituirAlocacao(id, substituto, motivo || null);
      saiu.push({ encontroId, pessoas: [saiuId] });
      entrou.push({ encontroId, pessoas: [substituto] });
    } catch {
      falhas++;
    }
  }
  if (saiu.length === 0) return falha("Não deu para substituir. Abra os encontros e confira um por um.");
  revalidatePath("/gestao", "layout");
  await Promise.all([avisarLote("substituido", saiu), avisarLote("alocado", entrou)]);
  const resto = falhas ? ` Em ${falhas} não deu; eles continuam na lista.` : "";
  return sucesso(`Substituição feita em ${saiu.length} ${saiu.length === 1 ? "encontro" : "encontros"}.${resto}`);
}
