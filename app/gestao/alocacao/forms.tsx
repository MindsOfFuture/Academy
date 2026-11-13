"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Alocacao,
  ConflitoHorario,
  Encontro,
  EscolaSummary,
  Espaco,
  EstadoAcao,
  FuncaoAlocacao,
  SituacaoAlocacao,
  StatusTurma,
  TipoEncontro,
  Turma,
} from "@/lib/api/gestao/types";
import { Aviso, campoSelect, rotuloCampo } from "../equipe/forms";
import { FUNCAO, SITUACAO, STATUS_TURMA, TIPO_ENCONTRO } from "./rotulos";
import {
  afastamentoAction,
  alocarAction,
  atualizarAlocacaoAction,
  cadastrarEscolaAction,
  cadastrarEspacoAction,
  cadastrarTurmaAction,
  cancelarEncontroAction,
  concluirEncontroAction,
  conflitosEncontroAction,
  criarEncontroAction,
  editarEncontroAction,
  editarEscolaAction,
  editarEspacoAction,
  editarTurmaAction,
  escreverNotaAction,
  registrarPresentesAction,
  removerAlocacaoAction,
  situacaoTurmaAction,
  substituirAction,
  substituirTodosAction,
} from "./actions";
import { confirmarEnvio } from "@/components/ui/confirmar";

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

function SelectTipo({ defaultValue = "aula" }: { defaultValue?: TipoEncontro }) {
  return (
    <select name="tipo" defaultValue={defaultValue} className={campoSelect}>
      {(Object.keys(TIPO_ENCONTRO) as TipoEncontro[]).map((t) => (
        <option key={t} value={t}>
          {TIPO_ENCONTRO[t]}
        </option>
      ))}
    </select>
  );
}

function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/**
 * Aviso de horário sobreposto (decisão 6 da spec 014), usado no lançamento e
 * nas ações em lote (spec 020). Com várias datas, cada linha diz o dia.
 */
export function JanelaConflitos({
  janelaRef,
  conflitos,
  confirmar,
  aoConfirmar,
}: {
  janelaRef: React.RefObject<HTMLDialogElement | null>;
  conflitos: ConflitoHorario[];
  confirmar: string;
  aoConfirmar: () => void;
}) {
  const variasDatas = new Set(conflitos.map((c) => c.data)).size > 1;
  return (
    <dialog
      ref={janelaRef}
      aria-labelledby="sobreposicao-titulo"
      className="w-[min(32rem,calc(100vw-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="space-y-4 p-5">
        <h4 id="sobreposicao-titulo" className="text-lg font-semibold">
          Horário sobreposto
        </h4>
        <p className="text-sm text-muted-foreground">Já há outro encontro nesse dia e horário:</p>
        <ul className="max-h-72 divide-y overflow-y-auto rounded-md border text-sm">
          {conflitos.map((c) => (
            <li key={`${c.bolsistaId}-${c.encontroId}`} className="p-3">
              <span className="font-medium">{c.bolsistaNome}</span>
              <span className="block text-muted-foreground">
                {variasDatas && c.data && `${diaMes(c.data)} · `}
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
          <Button type="button" onClick={aoConfirmar}>
            {confirmar}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/** Quantas datas a repetição semanal gera (a conta que vale é a do servidor). */
function contarSemanas(data: string, ate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{4}-\d{2}-\d{2}$/.test(ate) || ate < data) return 1;
  const dias = (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${data}T00:00:00Z`)) / 86_400_000;
  return Math.floor(dias / 7) + 1;
}

const NOME_DIA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** Dia da semana (0 = domingo) de uma data "AAAA-MM-DD"; 7 se a data não vale. */
function diaDaSemana(iso: string): number {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00Z`).getUTCDay() : 7;
}
function somarDias(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

type EquipeDia = { equipe: Set<string>; responsaveis: Set<string> };

function alternado(atual: Set<string>, id: string): Set<string> {
  const nova = new Set(atual);
  if (nova.has(id)) nova.delete(id);
  else nova.add(id);
  return nova;
}

/** Quem vai e quem é responsável. `sufixo` separa a equipe de cada outro dia no formulário. */
function EscolhaEquipe({
  pessoas,
  valor,
  aoMudar,
  sufixo = "",
}: {
  pessoas: Opcao[];
  valor: EquipeDia;
  aoMudar: (valor: EquipeDia) => void;
  sufixo?: string;
}) {
  const { equipe, responsaveis } = valor;
  return (
    <div className="grid gap-1 sm:grid-cols-3">
      {pessoas.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name={`equipe${sufixo}`}
              value={p.id}
              checked={equipe.has(p.id)}
              // Quem sai da equipe deixa de ser responsável.
              onChange={() =>
                aoMudar({ equipe: alternado(equipe, p.id), responsaveis: new Set([...responsaveis].filter((r) => r !== p.id)) })
              }
              className="h-4 w-4 accent-[#684A97]"
            />
            {p.nome}
          </label>
          {equipe.has(p.id) && (
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name={`responsaveis${sufixo}`}
                value={p.id}
                checked={responsaveis.has(p.id)}
                onChange={() => aoMudar({ equipe, responsaveis: alternado(responsaveis, p.id) })}
                aria-label={`${p.nome} é responsável`}
                className="h-3.5 w-3.5 accent-[#684A97]"
              />
              Responsável
            </label>
          )}
        </div>
      ))}
    </div>
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
  espacos,
  pessoas,
  equipes,
  dataPadrao,
}: {
  turmas: Turma[];
  escolas: Opcao[];
  /** Só os ativos. */
  espacos: Opcao[];
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
  const [numeroAula, setNumeroAula] = useState("");
  const [principal, setPrincipal] = useState<EquipeDia>({ equipe: new Set(), responsaveis: new Set() });
  const [data, setData] = useState(dataPadrao);
  const [toda, setToda] = useState(false);
  const [repetirAte, setRepetirAte] = useState("");
  const [variosDias, setVariosDias] = useState(false);
  /** Outros dias marcados; `null` = mesma equipe do encontro. */
  const [dias, setDias] = useState<Record<number, EquipeDia | null>>({});
  const dow = diaDaSemana(data);
  const diasPossiveis = [1, 2, 3, 4, 5, 6].filter((d) => d > dow);
  const diasMarcados = variosDias ? diasPossiveis.filter((d) => d in dias) : [];
  const semanas = toda && repetirAte ? contarSemanas(data, repetirAte) : 1;
  const total = semanas * (1 + diasMarcados.length);
  useEffect(() => {
    // Lançou: a repetição não fica armada para o próximo lançamento.
    if (estado?.ok) {
      setToda(false);
      setRepetirAte("");
      setVariosDias(false);
      setDias({});
    }
  }, [estado]);
  const abertas = turmas.filter((t) => t.status === "prevista" || t.status === "em_andamento");

  function escolherTurma(id: string) {
    setTurmaId(id);
    const turma = turmas.find((t) => t.id === id);
    if (turma) setModalidade(turma.modalidade);
    setPrincipal({ equipe: new Set(equipes[id] ?? []), responsaveis: new Set() });
  }

  function marcarDia(d: number) {
    setDias((atual) => {
      const novo = { ...atual };
      if (d in novo) delete novo[d];
      else novo[d] = null;
      return novo;
    });
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

  return (
    <form ref={formRef} action={acao} onSubmit={aoEnviar} className={caixa}>
      <h3 className="font-semibold">Lançar encontro</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className={rotuloCampo}>Data</span>
          <Input name="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
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
        <label className="space-y-1">
          <span className={rotuloCampo}>Número da aula (opcional)</span>
          <Input
            name="numeroAula"
            type="number"
            min={1}
            max={999}
            step={1}
            value={numeroAula}
            onChange={(e) => setNumeroAula(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Tipo</span>
          <SelectTipo />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Espaço (opcional)</span>
          <Escolha name="espacoId" opcoes={espacos} vazio="Sem espaço" />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className={rotuloCampo}>
          Equipe ({principal.equipe.size}){turmaId && equipes[turmaId] ? " — veio do último encontro da turma" : ""}
        </legend>
        <EscolhaEquipe pessoas={pessoas} valor={principal} aoMudar={setPrincipal} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={rotuloCampo}>Repetição</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={toda} onChange={(e) => setToda(e.target.checked)} className="h-4 w-4 accent-[#684A97]" />
          Repetir toda semana
        </label>
        {toda && (
          <label className="ml-6 block max-w-xs space-y-1">
            <span className={rotuloCampo}>Até</span>
            <Input
              name="repetirAte"
              type="date"
              required
              min={data || undefined}
              value={repetirAte}
              onChange={(e) => setRepetirAte(e.target.value)}
            />
          </label>
        )}
        {diasPossiveis.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={variosDias}
              onChange={(e) => setVariosDias(e.target.checked)}
              className="h-4 w-4 accent-[#684A97]"
            />
            Também em outros dias desta semana
          </label>
        )}
        {variosDias && (
          <div className="ml-6 space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {diasPossiveis.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="dias"
                    value={d}
                    checked={d in dias}
                    onChange={() => marcarDia(d)}
                    className="h-4 w-4 accent-[#684A97]"
                  />
                  {NOME_DIA[d]} {diaMes(somarDias(data, d - dow))}
                </label>
              ))}
            </div>
            {diasMarcados.map((d, i) => {
              const propria = dias[d];
              return (
                <div key={d} className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">
                    {NOME_DIA[d]} {diaMes(somarDias(data, d - dow))}
                    {numeroAula && ` · Aula ${Number(numeroAula) + i + 1}`}
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!propria}
                      onChange={(e) =>
                        setDias((atual) => ({
                          ...atual,
                          [d]: e.target.checked
                            ? null
                            : { equipe: new Set(principal.equipe), responsaveis: new Set(principal.responsaveis) },
                        }))
                      }
                      className="h-4 w-4 accent-[#684A97]"
                    />
                    Mesma equipe
                  </label>
                  {propria && (
                    <>
                      <input type="hidden" name={`equipePropria-${d}`} value="1" />
                      <EscolhaEquipe
                        pessoas={pessoas}
                        valor={propria}
                        sufixo={`-${d}`}
                        aoMudar={(valor) => setDias((atual) => ({ ...atual, [d]: valor }))}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </fieldset>

      <Button type="submit" disabled={enviando || conferindo}>
        {conferindo
          ? "Conferindo horários…"
          : enviando
            ? "Lançando…"
            : total > 1
              ? `Lançar ${total} encontros`
              : "Lançar encontro"}
      </Button>
      <Aviso estado={estado} />

      <JanelaConflitos janelaRef={janelaRef} conflitos={conflitos} confirmar="Lançar mesmo assim" aoConfirmar={lancar} />
    </form>
  );
}

export function FormCancelarEncontro({ encontroId }: { encontroId: string }) {
  const [estado, acao, enviando] = useAcao(cancelarEncontroAction);
  return (
    <form
      action={acao}
      onSubmit={confirmarEnvio("Cancelar este encontro? Ele deixa de contar carga e continua no histórico.", { rotulo: "Cancelar encontro", destrutivo: true })}
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
 * Concluir ou reabrir à mão, só pela coordenação (decisão 10 da spec 014).
 * Concluir abre a janela do relatório, opcional; reabrir só confirma e mantém o
 * relatório. Sem a coordenação, o encontro se conclui com a última nota de encerramento.
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
        onSubmit={confirmarEnvio("Reabrir este encontro? Ele volta a aparecer como não confirmado.", { rotulo: "Reabrir" })}
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
            <span className={rotuloCampo}>Relatório do encontro (opcional)</span>
            <textarea
              name="relatorio"
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

/**
 * A nota de encerramento do próprio bolsista. Pode ser reescrita; quando a
 * última pessoa da equipe escreve a sua, o encontro se conclui.
 */
export function FormNotaEncerramento({
  encontroId,
  nota,
  link,
}: {
  encontroId: string;
  nota: string | null;
  link: string | null;
}) {
  const [estado, acao, enviando] = useAcao(escreverNotaAction);
  // Controlado: o React limpa o formulário depois do envio, e uma nota recusada não pode sumir.
  const [texto, setTexto] = useState(nota ?? "");
  const [url, setUrl] = useState(link ?? "");
  return (
    <form action={acao} className="space-y-2">
      <input type="hidden" name="encontroId" value={encontroId} />
      <label className="block space-y-1">
        <span className={rotuloCampo}>Sua nota de encerramento</span>
        <textarea
          name="nota"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O que foi feito, como a turma respondeu, o que faltou, o que levar na próxima."
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </label>
      <label className="block space-y-1">
        <span className={rotuloCampo}>Link de comprovação</span>
        <Input name="link" type="url" maxLength={500} value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <Button type="submit" size="sm" disabled={enviando}>
        {enviando ? "Salvando…" : nota ? "Atualizar nota" : "Salvar nota"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

/** Quantos alunos estavam no encontro; quem registra depois sobrescreve. */
export function FormPresentes({ encontroId, presentes }: { encontroId: string; presentes: number | null }) {
  const [estado, acao, enviando] = useAcao(registrarPresentesAction);
  const [valor, setValor] = useState(presentes === null ? "" : String(presentes));
  return (
    <form action={acao} className="space-y-2">
      <input type="hidden" name="encontroId" value={encontroId} />
      <label className="block space-y-1">
        <span className={rotuloCampo}>Alunos presentes</span>
        <div className="flex gap-2">
          <Input
            name="presentes"
            type="number"
            required
            min={0}
            max={9999}
            step={1}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-28"
          />
          <Button type="submit" size="sm" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </label>
      <Aviso estado={estado} />
    </form>
  );
}

/** Tira a pessoa do encontro (decisão 9). Quem removeu e como estava ficam no histórico. */
export function FormRemoverAlocacao({ alocacaoId, nome }: { alocacaoId: string; nome: string }) {
  const [estado, acao, enviando] = useAcao(removerAlocacaoAction);
  return (
    <form
      action={acao}
      onSubmit={confirmarEnvio(`Remover ${nome} deste encontro? Fica registrado no histórico.`, { rotulo: "Remover", destrutivo: true })}
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

/** Acrescenta uma ou várias pessoas de uma vez (spec 020). */
export function FormAlocar({ encontroId, pessoas }: { encontroId: string; pessoas: Opcao[] }) {
  const [estado, acao, enviando] = useAcao(alocarAction);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (estado?.ok) setMarcadas(new Set());
  }, [estado]);
  if (pessoas.length === 0) return null;

  function alternar(id: string) {
    setMarcadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  return (
    <form action={acao} className={caixa}>
      <input type="hidden" name="encontroId" value={encontroId} />
      <fieldset className="space-y-2">
        <legend className={rotuloCampo}>Acrescentar pessoas</legend>
        <div className="grid gap-1 sm:grid-cols-3">
          {pessoas.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="bolsistaId"
                value={p.id}
                checked={marcadas.has(p.id)}
                onChange={() => alternar(p.id)}
                className="h-4 w-4 accent-[#684A97]"
              />
              {p.nome}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" variant="outline" disabled={enviando || marcadas.size === 0}>
        {marcadas.size > 1 ? `Alocar ${marcadas.size} pessoas` : "Alocar"}
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
        <label className="space-y-1">
          <span className={rotuloCampo}>Atraso (min)</span>
          <Input name="atrasoMinutos" type="number" min={1} max={600} defaultValue={alocacao.atrasoMinutos ?? ""} />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Função</span>
          <select name="funcao" defaultValue={alocacao.funcao} className={campoSelect}>
            {(Object.keys(FUNCAO) as FuncaoAlocacao[]).map((f) => (
              <option key={f} value={f}>
                {FUNCAO[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 sm:col-span-3">
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

/** Tudo de um encontro já lançado, menos a equipe (que tem a sua seção). */
export function FormEditarEncontro({
  encontro,
  turmas,
  escolas,
  espacos,
}: {
  encontro: Encontro;
  turmas: Turma[];
  escolas: Opcao[];
  espacos: Opcao[];
}) {
  const [estado, acao, enviando] = useAcao(editarEncontroAction);
  const [aberto, setAberto] = useState(false);
  const [turmaId, setTurmaId] = useState(encontro.turmaId ?? "");
  // A turma atual continua na lista mesmo se já fechou.
  const opcoesTurma = turmas.filter(
    (t) => t.status === "prevista" || t.status === "em_andamento" || t.id === encontro.turmaId,
  );
  useEffect(() => {
    if (estado?.ok) setAberto(false);
  }, [estado]);
  if (!aberto) {
    return (
      <div className="space-y-1">
        <Button type="button" size="sm" variant="outline" onClick={() => setAberto(true)}>
          Editar encontro
        </Button>
        <Aviso estado={estado} />
      </div>
    );
  }
  return (
    <form action={acao} className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
      <input type="hidden" name="encontroId" value={encontro.id} />
      <label className="space-y-1">
        <span className={rotuloCampo}>Data</span>
        <Input name="data" type="date" required defaultValue={encontro.data} />
      </label>
      <label className="space-y-1">
        <span className={rotuloCampo}>Início</span>
        <Input name="inicio" type="time" required defaultValue={encontro.inicio ?? ""} />
      </label>
      <label className="space-y-1">
        <span className={rotuloCampo}>Fim</span>
        <Input name="fim" type="time" required defaultValue={encontro.fim ?? ""} />
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className={rotuloCampo}>Turma</span>
        <select name="turmaId" value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className={campoSelect}>
          <option value="">Sem turma (tarefa, evento, apresentação)</option>
          {opcoesTurma.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} · {t.escolaNome}
            </option>
          ))}
        </select>
      </label>
      {!turmaId && (
        <label className="space-y-1">
          <span className={rotuloCampo}>Escola (opcional)</span>
          <Escolha name="escolaId" opcoes={escolas} vazio="Fora de escola" defaultValue={encontro.escolaId ?? ""} />
        </label>
      )}
      <label className="space-y-1">
        <span className={rotuloCampo}>Atividade</span>
        <Input name="modalidade" required defaultValue={encontro.modalidade} />
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className={rotuloCampo}>Observação (opcional)</span>
        <Input
          name="descricao"
          maxLength={200}
          defaultValue={encontro.descricao !== encontro.modalidade ? encontro.descricao : ""}
        />
      </label>
      <label className="space-y-1">
        <span className={rotuloCampo}>Número da aula (opcional)</span>
        <Input name="numeroAula" type="number" min={1} max={999} step={1} defaultValue={encontro.numeroAula ?? ""} />
      </label>
      <label className="space-y-1">
        <span className={rotuloCampo}>Tipo</span>
        <SelectTipo defaultValue={encontro.tipo} />
      </label>
      <label className="space-y-1">
        <span className={rotuloCampo}>Espaço</span>
        <Escolha name="espacoId" opcoes={espacos} vazio="Sem espaço" defaultValue={encontro.espacoId ?? ""} />
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-3">
        <Button type="submit" size="sm" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setAberto(false);
            setTurmaId(encontro.turmaId ?? "");
          }}
        >
          Fechar
        </Button>
      </div>
      <div className="sm:col-span-3">
        <Aviso estado={estado} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Escola e turma
// ---------------------------------------------------------------------------

/** Cadastra; com `espaco`, edita o nome ou desativa. */
export function FormEspaco({ espaco }: { espaco?: Espaco }) {
  const [estado, acao, enviando] = useAcao(espaco ? editarEspacoAction : cadastrarEspacoAction);
  return (
    <form action={acao} className={espaco ? "space-y-3" : caixa}>
      {espaco ? (
        <input type="hidden" name="espacoId" value={espaco.id} />
      ) : (
        <h3 className="font-semibold">Cadastrar espaço</h3>
      )}
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Nome</span>
          <Input name="nome" required minLength={2} maxLength={80} defaultValue={espaco?.nome} />
        </label>
        {espaco && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ativo" defaultChecked={espaco.ativo} className="h-4 w-4 accent-[#684A97]" />
            Ativo
          </label>
        )}
        <Button type="submit" disabled={enviando} className="sm:col-span-3 sm:w-fit">
          {espaco ? "Salvar alterações" : "Salvar espaço"}
        </Button>
      </div>
      <Aviso estado={estado} />
    </form>
  );
}

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
        <label className="space-y-1">
          <span className={rotuloCampo}>Número de alunos (opcional)</span>
          <Input name="nAlunos" type="number" min={0} max={1000} step={1} defaultValue={turma?.nAlunos ?? ""} />
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

/** Afastamento (spec 020): a mesma pessoa entra em todos os encontros que faltam substituir. */
export function FormSubstituirTodos({ alocacoes, pessoas }: { alocacoes: string[]; pessoas: Opcao[] }) {
  const [estado, acao, enviando] = useAcao(substituirTodosAction);
  if (alocacoes.length === 0 || pessoas.length === 0) return null;
  const n = alocacoes.length;
  return (
    <form action={acao} className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-end">
      {alocacoes.map((id) => (
        <input key={id} type="hidden" name="alocacaoId" value={id} />
      ))}
      <input type="hidden" name="motivo" value="Afastamento" />
      <label className="flex-1 space-y-1">
        <span className={rotuloCampo}>Substituir em todos por</span>
        <Escolha name="substitutoId" opcoes={pessoas} vazio="Escolha…" required />
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={enviando}>
        {enviando ? "Substituindo…" : `Substituir em ${n} ${n === 1 ? "encontro" : "encontros"}`}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}
