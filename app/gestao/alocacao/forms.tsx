"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Alocacao, EstadoAcao, SituacaoAlocacao, StatusTurma, Turma } from "@/lib/api/gestao/types";
import { Aviso, campoSelect, rotuloCampo } from "../equipe/forms";
import { SITUACAO, STATUS_TURMA } from "./rotulos";
import {
  afastamentoAction,
  alocarAction,
  atualizarAlocacaoAction,
  cadastrarEscolaAction,
  cadastrarTurmaAction,
  cancelarEncontroAction,
  criarEncontroAction,
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

  function alternar(id: string) {
    setEquipe((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  return (
    <form action={acao} className={caixa}>
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

      <Button type="submit" disabled={enviando}>
        {enviando ? "Lançando…" : "Lançar encontro"}
      </Button>
      <Aviso estado={estado} />
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


export function FormAlocacao({
  alocacao,
  pessoas,
  limites,
}: {
  alocacao: Alocacao;
  pessoas: Opcao[];
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
            <Escolha name="substitutoId" opcoes={outras} vazio="Escolha…" required />
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

export function FormEscola() {
  const [estado, acao, enviando] = useAcao(cadastrarEscolaAction);
  return (
    <form action={acao} className={caixa}>
      <h3 className="font-semibold">Cadastrar escola</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 sm:col-span-3">
          <span className={rotuloCampo}>Nome</span>
          <Input name="nome" required minLength={2} />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Rede</span>
          <select name="categoria" defaultValue="estadual" className={campoSelect}>
            <option value="estadual">Estadual</option>
            <option value="municipal">Municipal</option>
            <option value="federal">Federal</option>
            <option value="outra">Outra</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Cidade</span>
          <Input name="cidade" required defaultValue="Juiz de Fora" />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={enviando} className="w-full">
            Salvar escola
          </Button>
        </div>
      </div>
      <Aviso estado={estado} />
    </form>
  );
}

export function FormTurma({ escolas }: { escolas: Opcao[] }) {
  const [estado, acao, enviando] = useAcao(cadastrarTurmaAction);
  if (escolas.length === 0) return null;
  return (
    <form action={acao} className={caixa}>
      <h3 className="font-semibold">Cadastrar turma</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className={rotuloCampo}>Escola</span>
          <Escolha name="escolaId" opcoes={escolas} vazio="Escolha…" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Atividade</span>
          <Input name="modalidade" required placeholder="Lego, IA, Educação Financeira…" />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Nome da turma</span>
          <Input name="nome" required maxLength={120} placeholder="Lego de segunda à tarde" />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Início</span>
          <Input name="inicio" type="date" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Fim previsto (opcional)</span>
          <Input name="fim" type="date" />
        </label>
      </div>
      <Button type="submit" disabled={enviando}>
        Salvar turma
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
