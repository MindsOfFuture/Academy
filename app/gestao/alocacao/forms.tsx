"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Alocacao,
  MatriculaSummary,
  ConflitoHorario,
  EscolaSummary,
  EstadoAcao,
  SituacaoAlocacao,
  StatusTurma,
  Turma,
} from "@/lib/api/gestao/types";
import { Aviso, campoSelect, rotuloCampo } from "../equipe/forms";
import { SITUACAO, STATUS_TURMA } from "./rotulos";
import { analisarListaAlunos } from "@/lib/api/gestao/validacao";
import {
  afastamentoAction,
  cadastrarAlunoTurmaAction,
  cadastrarListaAlunosTurmaAction,
  finalizarMatriculaAction,
  alocarAction,
  atualizarAlocacaoAction,
  cadastrarEscolaAction,
  cadastrarTurmaAction,
  cancelarEncontroAction,
  concluirEncontroAction,
  conflitosEncontroAction,
  criarEncontroAction,
  definirGestorAction,
  editarEscolaAction,
  editarTurmaAction,
  removerAlocacaoAction,
  situacaoTurmaAction,
  substituirAction,
} from "./actions";

type Opcao = { id: string; nome: string };

const caixa = "space-y-3 rounded-lg border bg-white p-4 shadow-sm";

function useAcao(acao: (anterior: EstadoAcao | null, form: FormData) => Promise<EstadoAcao>) {
  return useActionState<EstadoAcao | null, FormData>(acao, null);
}

function Escolha({ name, opcoes, vazio, defaultValue = "", required }: {
  name: string;
  opcoes: Opcao[];
  vazio: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <select name={name} defaultValue={defaultValue} required={required} className={campoSelect}>
      <option value="">{vazio}</option>
      {opcoes.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nome}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Encontro
// ---------------------------------------------------------------------------

/**
 * Uma linha da mensagem de hoje. Ao escolher a turma, a equipe do último
 * encontro dela vem marcada (decisão 2 da spec 014) e pode ser trocada.
 *
 * Antes de lançar, confere se alguém da equipe já está em outro encontro no
 * mesmo horário (decisão 6). Havendo, a janela mostra quem e onde; a
 * coordenação revisa ou lança mesmo assim. A conferência roda no envio, e não
 * no servidor depois, para o formulário não se apagar enquanto ela decide.
 */
export function FormEncontro({
  turmas,
  escolas,
  pessoas,
  equipes,
  dataPadrao,
}: {
  turmas: Turma[];
  escolas: Opcao[];
  pessoas: Opcao[];
  equipes: Record<string, string[]>;
  dataPadrao: string;
}) {
  const [estado, acao, enviando] = useAcao(criarEncontroAction);
  const formRef = useRef<HTMLFormElement>(null);
  const janelaRef = useRef<HTMLDialogElement>(null);
  const liberado = useRef(false);
  const [conflitos, setConflitos] = useState<ConflitoHorario[]>([]);
  const [conferindo, setConferindo] = useState(false);
  const [turmaId, setTurmaId] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [equipe, setEquipe] = useState<Set<string>>(new Set());
  const abertas = turmas.filter((t) => t.status === "prevista" || t.status === "em_andamento");

  function escolherTurma(id: string) {
    setTurmaId(id);
    const turma = turmas.find((t) => t.id === id);
    if (turma) setModalidade(turma.modalidade);
    setEquipe(new Set(equipes[id] ?? []));
  }

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    if (liberado.current) {
      liberado.current = false;
      return;
    }
    e.preventDefault();
    const form = e.currentTarget;
    setConferindo(true);
    const achados = await conflitosEncontroAction(new FormData(form));
    setConferindo(false);
    if (achados.length === 0) {
      lancar();
      return;
    }
    setConflitos(achados);
    janelaRef.current?.showModal();
  }

  function lancar() {
    janelaRef.current?.close();
    liberado.current = true;
    formRef.current?.requestSubmit();
  }

  function alternar(id: string) {
    setEquipe((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  return (
    <form ref={formRef} action={acao} onSubmit={aoEnviar} className={caixa}>
      <h3 className="font-semibold">Lançar encontro</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className={rotuloCampo}>Data</span>
          <Input name="data" type="date" required defaultValue={dataPadrao} />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Início</span>
          <Input name="inicio" type="time" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Fim</span>
          <Input name="fim" type="time" required />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Turma</span>
          <select name="turmaId" value={turmaId} onChange={(e) => escolherTurma(e.target.value)} className={campoSelect}>
            <option value="">Sem turma (tarefa, evento, apresentação)</option>
            {abertas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} · {t.escolaNome}
              </option>
            ))}
          </select>
        </label>
        {!turmaId && (
          <label className="space-y-1">
            <span className={rotuloCampo}>Escola (opcional)</span>
            <Escolha name="escolaId" opcoes={escolas} vazio="Fora de escola" />
          </label>
        )}
        <label className="space-y-1">
          <span className={rotuloCampo}>Atividade</span>
          <Input
            name="modalidade"
            required
            value={modalidade}
            onChange={(e) => setModalidade(e.target.value)}
            placeholder="Lego, IA, Organizar caixas…"
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Observação (opcional)</span>
          <Input name="descricao" maxLength={200} placeholder="Competição, encerramento…" />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className={rotuloCampo}>
          Equipe ({equipe.size}){turmaId && equipes[turmaId] ? " — veio do último encontro da turma" : ""}
        </legend>
        <div className="grid gap-1 sm:grid-cols-3">
          {pessoas.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="equipe"
                value={p.id}
                checked={equipe.has(p.id)}
                onChange={() => alternar(p.id)}
                className="h-4 w-4 accent-[#684A97]"
              />
              {p.nome}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={enviando || conferindo}>
        {conferindo ? "Conferindo horários…" : enviando ? "Lançando…" : "Lançar encontro"}
      </Button>
      <Aviso estado={estado} />

      <dialog
        ref={janelaRef}
        aria-labelledby="sobreposicao-titulo"
        className="w-[min(32rem,calc(100vw-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="space-y-4 p-5">
          <h4 id="sobreposicao-titulo" className="text-lg font-semibold">
            Horário sobreposto
          </h4>
          <p className="text-sm text-muted-foreground">
            {conflitos.length === 1 ? "Esta pessoa já está" : "Estas pessoas já estão"} em outro encontro nesse dia e
            horário:
          </p>
          <ul className="divide-y rounded-md border text-sm">
            {conflitos.map((c) => (
              <li key={`${c.bolsistaId}-${c.encontroId}`} className="p-3">
                <span className="font-medium">{c.bolsistaNome}</span>
                <span className="block text-muted-foreground">
                  {c.horario} · {c.modalidade}
                  {c.turmaNome && ` · ${c.turmaNome}`} ·{" "}
                  <Link href={`/gestao/alocacao/${c.encontroId}`} target="_blank" className="text-[#684A97] underline">
                    ver encontro
                  </Link>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => janelaRef.current?.close()}>
              Revisar
            </Button>
            <Button type="button" onClick={lancar}>
              Lançar mesmo assim
            </Button>
          </div>
        </div>
      </dialog>
    </form>
  );
}

export function FormCancelarEncontro({ encontroId }: { encontroId: string }) {
  const [estado, acao, enviando] = useAcao(cancelarEncontroAction);
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!window.confirm("Cancelar este encontro? Ele deixa de contar carga e continua no histórico.")) e.preventDefault();
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="encontroId" value={encontroId} />
      <label className="flex-1 space-y-1">
        <span className={rotuloCampo}>Motivo do cancelamento</span>
        <Input name="motivo" required minLength={3} maxLength={500} placeholder="Escola suspendeu as aulas…" />
      </label>
      <Button type="submit" variant="destructive" disabled={enviando}>
        Cancelar encontro
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

/**
 * Concluir ou reabrir (decisão 10 da spec 014). Concluir abre a janela do
 * relatório (spec 016), obrigatório; reabrir só confirma e mantém o relatório.
 * Serve à coordenação e ao gestor do encontro — quem pode, o banco decide.
 */
export function FormConcluirEncontro({
  encontroId,
  concluido,
  relatorio,
}: {
  encontroId: string;
  concluido: boolean;
  relatorio: string | null;
}) {
  const [estado, acao, enviando] = useAcao(concluirEncontroAction);
  const janelaRef = useRef<HTMLDialogElement>(null);
  // Controlado: o React limpa o formulário depois do envio, e um relatório
  // recusado não pode sumir.
  const [texto, setTexto] = useState(relatorio ?? "");

  useEffect(() => {
    if (estado?.ok) janelaRef.current?.close();
  }, [estado]);

  if (concluido) {
    return (
      <form
        action={acao}
        onSubmit={(e) => {
          if (!window.confirm("Reabrir este encontro? Ele volta a aparecer como não confirmado.")) e.preventDefault();
        }}
        className="inline-flex flex-col items-start gap-1"
      >
        <input type="hidden" name="encontroId" value={encontroId} />
        <input type="hidden" name="acao" value="reabrir" />
        <Button type="submit" size="sm" variant="outline" disabled={enviando}>
          Reabrir encontro
        </Button>
        {estado && !estado.ok && <Aviso estado={estado} />}
      </form>
    );
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="bg-green-700 text-white hover:bg-green-800"
        onClick={() => janelaRef.current?.showModal()}
      >
        Concluir encontro
      </Button>
      <dialog
        ref={janelaRef}
        aria-labelledby={`concluir-${encontroId}`}
        className="w-[min(36rem,calc(100vw-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-black/40"
      >
        <form action={acao} className="space-y-4 p-5">
          <input type="hidden" name="encontroId" value={encontroId} />
          <input type="hidden" name="acao" value="concluir" />
          <h4 id={`concluir-${encontroId}`} className="text-lg font-semibold">
            Concluir encontro
          </h4>
          <label className="block space-y-1">
            <span className={rotuloCampo}>Relatório do encontro</span>
            <textarea
              name="relatorio"
              required
              minLength={10}
              maxLength={5000}
              rows={7}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="O que foi feito, como a turma respondeu, o que faltou, o que levar na próxima."
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>
          <p className="text-xs text-muted-foreground">Quem estiver como prevista passa a cumprida.</p>
          {estado && !estado.ok && <Aviso estado={estado} />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => janelaRef.current?.close()}>
              Voltar
            </Button>
            <Button type="submit" disabled={enviando} className="bg-green-700 text-white hover:bg-green-800">
              {enviando ? "Concluindo…" : "Concluir"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** Marca ou tira o gestor do encontro (spec 016): quem conclui junto com a coordenação. */
export function FormGestor({ alocacaoId, gestor }: { alocacaoId: string; gestor: boolean }) {
  const [estado, acao, enviando] = useAcao(definirGestorAction);
  return (
    <form action={acao} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="alocacaoId" value={alocacaoId} />
      <input type="hidden" name="gestor" value={gestor ? "nao" : "sim"} />
      <Button type="submit" size="sm" variant="outline" disabled={enviando}>
        {gestor ? "Tirar gestor" : "Tornar gestor"}
      </Button>
      {estado && !estado.ok && <Aviso estado={estado} />}
    </form>
  );
}

/** Tira a pessoa do encontro (decisão 9). Quem removeu e como estava ficam no histórico. */
export function FormRemoverAlocacao({ alocacaoId, nome }: { alocacaoId: string; nome: string }) {
  const [estado, acao, enviando] = useAcao(removerAlocacaoAction);
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!window.confirm(`Remover ${nome} deste encontro? Fica registrado no histórico.`)) e.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      <input type="hidden" name="alocacaoId" value={alocacaoId} />
      <Button type="submit" size="sm" variant="outline" disabled={enviando}>
        Remover do encontro
      </Button>
      {estado && !estado.ok && <Aviso estado={estado} />}
    </form>
  );
}

export function FormAlocar({ encontroId, pessoas }: { encontroId: string; pessoas: Opcao[] }) {
  const [estado, acao, enviando] = useAcao(alocarAction);
  if (pessoas.length === 0) return null;
  return (
    <form action={acao} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="encontroId" value={encontroId} />
      <label className="flex-1 space-y-1">
        <span className={rotuloCampo}>Acrescentar pessoa</span>
        <Escolha name="bolsistaId" opcoes={pessoas} vazio="Escolha…" required />
      </label>
      <Button type="submit" variant="outline" disabled={enviando}>
        Alocar
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Alocação: o que aconteceu
// ---------------------------------------------------------------------------


/**
 * `pessoas` alimenta "Quem cobriu" (em geral alguém do próprio encontro);
 * `substitutos` alimenta "Substituir por" e só traz quem está fora do encontro
 * (decisão 8 da spec 014).
 */
export function FormAlocacao({
  alocacao,
  pessoas,
  substitutos,
  limites,
}: {
  alocacao: Alocacao;
  pessoas: Opcao[];
  substitutos: Opcao[];
  limites: { inicio: string | null; fim: string | null };
}) {
  const [estado, acao, enviando] = useAcao(atualizarAlocacaoAction);
  const [sub, executarSub, substituindo] = useAcao(substituirAction);
  const outras = pessoas.filter((p) => p.id !== alocacao.bolsistaId);

  // Substituição não se desfaz por aqui: quem entrou tem a própria alocação.
  if (alocacao.situacao === "substituida") return null;

  return (
    <div className="space-y-3">
      <form action={acao} className="grid gap-2 sm:grid-cols-6 sm:items-end">
        <input type="hidden" name="alocacaoId" value={alocacao.id} />
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Situação</span>
          <select name="situacao" defaultValue={alocacao.situacao} className={campoSelect}>
            {(Object.keys(SITUACAO) as SituacaoAlocacao[])
              .filter((s) => s !== "substituida")
              .map((s) => (
                <option key={s} value={s}>
                  {SITUACAO[s]}
                </option>
              ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Chegou</span>
          <Input name="inicio" type="time" defaultValue={alocacao.inicio ?? ""} min={limites.inicio ?? undefined} max={limites.fim ?? undefined} />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Saiu</span>
          <Input name="fim" type="time" defaultValue={alocacao.fim ?? ""} min={limites.inicio ?? undefined} max={limites.fim ?? undefined} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Quem cobriu</span>
          <Escolha name="cobertoPor" opcoes={outras} vazio="Ninguém" defaultValue={alocacao.cobertoPor ?? ""} />
        </label>
        <label className="space-y-1 sm:col-span-5">
          <span className={rotuloCampo}>Motivo ou observação</span>
          <Input name="motivo" maxLength={500} defaultValue={alocacao.motivo ?? ""} placeholder="Aula na faculdade até 14h…" />
        </label>
        <Button type="submit" size="sm" disabled={enviando}>
          Salvar
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Deixe chegada e saída em branco quando a pessoa ficou o encontro inteiro.
      </p>
      <Aviso estado={estado} />

      {alocacao.situacao !== "cumprida" && alocacao.situacao !== "retirada" && (
        <form action={executarSub} className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-end">
          <input type="hidden" name="alocacaoId" value={alocacao.id} />
          <label className="flex-1 space-y-1">
            <span className={rotuloCampo}>Substituir por</span>
            <Escolha name="substitutoId" opcoes={substitutos} vazio="Escolha…" required />
          </label>
          <label className="flex-1 space-y-1">
            <span className={rotuloCampo}>Motivo</span>
            <Input name="motivo" maxLength={500} placeholder="Afastamento, troca de turma…" />
          </label>
          <Button type="submit" size="sm" variant="outline" disabled={substituindo}>
            Substituir
          </Button>
          <Aviso estado={sub} />
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escola e turma
// ---------------------------------------------------------------------------

/** Cadastra; com `escola`, edita. Nada se apaga: cadastro errado se corrige aqui. */
export function FormEscola({ escola }: { escola?: EscolaSummary }) {
  const [estado, acao, enviando] = useAcao(escola ? editarEscolaAction : cadastrarEscolaAction);
  return (
    <form action={acao} className={escola ? "space-y-3" : caixa}>
      {escola ? (
        <input type="hidden" name="escolaId" value={escola.id} />
      ) : (
        <h3 className="font-semibold">Cadastrar escola</h3>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 sm:col-span-3">
          <span className={rotuloCampo}>Nome</span>
          <Input name="nome" required minLength={2} defaultValue={escola?.nome} />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Rede</span>
          <select name="categoria" defaultValue={escola?.categoria ?? "estadual"} className={campoSelect}>
            <option value="estadual">Estadual</option>
            <option value="municipal">Municipal</option>
            <option value="federal">Federal</option>
            <option value="outra">Outra</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Cidade</span>
          <Input name="cidade" required defaultValue={escola?.cidade ?? "Juiz de Fora"} />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={enviando} className="w-full">
            {escola ? "Salvar alterações" : "Salvar escola"}
          </Button>
        </div>
      </div>
      <Aviso estado={estado} />
    </form>
  );
}

/**
 * Cadastra; com `turma`, edita nome, atividade e período. A escola de uma turma
 * não muda: os encontros já lançados guardam a escola dela.
 */
export function FormTurma({ escolas, turma }: { escolas: Opcao[]; turma?: Turma }) {
  const [estado, acao, enviando] = useAcao(turma ? editarTurmaAction : cadastrarTurmaAction);
  if (!turma && escolas.length === 0) return null;
  return (
    <form action={acao} className={turma ? "space-y-3" : caixa}>
      {!turma && <h3 className="font-semibold">Cadastrar turma</h3>}
      <div className="grid gap-3 sm:grid-cols-2">
        {turma ? (
          <>
            <input type="hidden" name="turmaId" value={turma.id} />
            <input type="hidden" name="escolaId" value={turma.escolaId} />
          </>
        ) : (
          <label className="space-y-1">
            <span className={rotuloCampo}>Escola</span>
            <Escolha name="escolaId" opcoes={escolas} vazio="Escolha…" required />
          </label>
        )}
        <label className="space-y-1">
          <span className={rotuloCampo}>Atividade</span>
          <Input name="modalidade" required defaultValue={turma?.modalidade} placeholder="Lego, IA, Educação Financeira…" />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Nome da turma</span>
          <Input name="nome" required maxLength={120} defaultValue={turma?.nome} placeholder="Lego de segunda à tarde" />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Início</span>
          <Input name="inicio" type="date" required defaultValue={turma?.inicio} />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Fim previsto (opcional)</span>
          <Input name="fim" type="date" defaultValue={turma?.fim ?? ""} />
        </label>
      </div>
      <Button type="submit" disabled={enviando}>
        {turma ? "Salvar alterações" : "Salvar turma"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}


export function FormSituacaoTurma({ turma }: { turma: Turma }) {
  const [estado, acao, enviando] = useAcao(situacaoTurmaAction);
  return (
    <form action={acao} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="turmaId" value={turma.id} />
      <label className="space-y-1">
        <span className={rotuloCampo}>Situação</span>
        <select name="status" defaultValue={turma.status} className={campoSelect}>
          {(Object.keys(STATUS_TURMA) as StatusTurma[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_TURMA[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex-1 space-y-1">
        <span className={rotuloCampo}>Motivo</span>
        <Input name="motivo" maxLength={500} defaultValue={turma.motivo ?? ""} placeholder="Obrigatório se não abriu" />
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={enviando}>
        Salvar
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Afastamento
// ---------------------------------------------------------------------------

export function FormAfastamento({ pessoas }: { pessoas: Opcao[] }) {
  const [estado, acao, enviando] = useAcao(afastamentoAction);
  return (
    <form action={acao} className={caixa}>
      <h3 className="font-semibold">Registrar afastamento</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 sm:col-span-3">
          <span className={rotuloCampo}>Bolsista</span>
          <Escolha name="bolsistaId" opcoes={pessoas} vazio="Escolha…" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>De</span>
          <Input name="inicio" type="date" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Até</span>
          <Input name="fim" type="date" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Motivo</span>
          <Input name="motivo" required minLength={3} maxLength={300} placeholder="Provas, viagem…" />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Não registre dado de saúde nem anexe atestado.</p>
      <Button type="submit" disabled={enviando}>
        Registrar
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}


export function FormAdicionarAluno({ turmaId }: { turmaId: string }) {
  const [estado, acao, enviando] = useAcao(cadastrarAlunoTurmaAction);
  return <form action={acao} className={caixa}>
    <h2 className="font-semibold">Adicionar aluno</h2>
    <input type="hidden" name="turmaId" value={turmaId} />
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="space-y-1"><span className={rotuloCampo}>Nome</span><Input name="nome" required minLength={2} maxLength={120} /></label>
      <label className="space-y-1"><span className={rotuloCampo}>Idade</span><Input name="idade" type="number" required min={3} max={100} /></label>
      <label className="space-y-1"><span className={rotuloCampo}>Ano escolar</span><Input name="anoEscolar" required maxLength={80} placeholder="7º ano" /></label>
    </div>
    <Button type="submit" disabled={enviando}>Adicionar aluno</Button><Aviso estado={estado} />
  </form>;
}

export function FormColarLista({ turmaId, matriculas }: { turmaId: string; matriculas: MatriculaSummary[] }) {
  const [estado, acao, enviando] = useAcao(cadastrarListaAlunosTurmaAction);
  const [texto, setTexto] = useState("");
  const preview = analisarListaAlunos(texto);
  const ativos = new Set(matriculas.filter(m => m.situacao === "ativa").map(m => m.nome.trim().toLocaleLowerCase("pt-BR")));
  const duplicadas = preview.linhas.filter(l => l.aluno && ativos.has(l.aluno.nome.trim().toLocaleLowerCase("pt-BR")));
  return <form action={acao} className={caixa}>
    <h2 className="font-semibold">Colar lista</h2>
    <p className="text-sm text-muted-foreground">Uma pessoa por linha: Nome; idade; ano escolar.</p>
    <input type="hidden" name="turmaId" value={turmaId} />
    <label className="sr-only" htmlFor="lista-alunos">Lista de alunos</label>
    <textarea id="lista-alunos" name="lista" rows={5} value={texto} onChange={e => setTexto(e.target.value)} placeholder={"Ana Souza; 12; 7º ano"} className="w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
    {preview.linhas.length > 0 && <div aria-live="polite" className="space-y-1 text-sm"><p className="font-medium">Conferência</p>
      {preview.linhas.map(l => <p key={l.numero} className={l.erro || (l.aluno && ativos.has(l.aluno.nome.trim().toLocaleLowerCase("pt-BR"))) ? "text-red-700" : "text-green-700"}>
        Linha {l.numero}: {l.erro ?? (l.aluno && ativos.has(l.aluno.nome.trim().toLocaleLowerCase("pt-BR")) ? "Possível duplicidade: nome já está nesta turma." : l.aluno?.nome)}
      </p>)}
      {duplicadas.length > 0 && <p className="text-red-700">Ajuste ou remova as possíveis duplicidades antes de salvar.</p>}
    </div>}
    <Button type="submit" disabled={enviando || preview.validos.length === 0 || preview.linhas.some(l => l.erro) || duplicadas.length > 0}
      onClick={e => { if (!window.confirm("Adicionar todos os alunos válidos desta lista?")) e.preventDefault(); }}>Confirmar e adicionar lista</Button>
    <Aviso estado={estado} />
  </form>;
}

export function AcaoFinalizarMatricula({ matricula }: { matricula: MatriculaSummary }) {
  const [estado, acao, enviando] = useAcao(finalizarMatriculaAction);
  return <form action={acao} className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={e => {
    const motivo = new FormData(e.currentTarget).get("motivo");
    if (!window.confirm("Finalizar a matrícula de " + matricula.nome + "? O histórico será mantido.")) e.preventDefault();
    if (typeof motivo !== "string" || motivo.trim().length < 3) e.preventDefault();
  }}>
    <input type="hidden" name="matriculaId" value={matricula.id} />
    <label className="flex-1 space-y-1"><span className={rotuloCampo}>Motivo para finalizar</span><Input name="motivo" required minLength={3} maxLength={500} placeholder="Mudou de escola…" /></label>
    <Button type="submit" variant="outline" disabled={enviando}>Finalizar matrícula</Button><Aviso estado={estado} />
  </form>;
}
