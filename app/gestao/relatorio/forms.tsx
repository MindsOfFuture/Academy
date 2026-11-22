"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AtividadeRelatorio, EstadoAcao } from "@/lib/api/gestao/types";
import { Aviso, rotuloCampo } from "../equipe/forms";
import { apagarAtividadeAction, cadastrarAtividadeAction, editarAtividadeAction, salvarLinkEncontroAction } from "./actions";
import { confirmarEnvio } from "@/components/ui/confirmar";
import { CampoFoto } from "./foto";

export type Pessoa = { id: string; nome: string };

/** Caixas de marcar com as pessoas da equipe; vazio não mostra nada. */
export function EscolhaPessoas({
  name,
  rotulo,
  pessoas,
  marcadas = [],
}: {
  name: string;
  rotulo: string;
  pessoas: Pessoa[];
  marcadas?: string[];
}) {
  if (pessoas.length === 0) return null;
  return (
    <fieldset className="space-y-1">
      <legend className={rotuloCampo}>{rotulo}</legend>
      <div className="grid max-h-40 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
        {pessoas.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={name} value={p.id} defaultChecked={marcadas.includes(p.id)} />
            {p.nome}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Campos da atividade, iguais ao cadastrar e ao editar. */
function CamposAtividade({
  atividade,
  dataPadrao,
  dataMinima,
  colegas,
  onEnviandoFoto,
}: {
  atividade?: AtividadeRelatorio;
  dataPadrao?: string;
  dataMinima?: string;
  colegas: Pessoa[];
  onEnviandoFoto: (enviando: boolean) => void;
}) {
  // Participante que saiu da equipe continua marcado ao editar.
  const pessoas = [
    ...colegas,
    ...(atividade?.participantes ?? [])
      .filter((id) => !colegas.some((c) => c.id === id))
      .map((id) => ({ id, nome: "Pessoa que saiu da equipe" })),
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
      <label className="space-y-1">
        <span className={rotuloCampo}>O que você fez</span>
        <Input
          name="nome"
          required
          minLength={2}
          maxLength={200}
          defaultValue={atividade?.nome}
          placeholder={atividade ? undefined : "Preparei o material da aula de Lego"}
        />
      </label>
      <label className="space-y-1">
        <span className={rotuloCampo}>Quando</span>
        <Input name="data" type="date" required min={dataMinima} defaultValue={atividade?.data ?? dataPadrao} />
      </label>
      <label className="space-y-1">
        <span className={rotuloCampo}>Início</span>
        <Input name="inicio" type="time" required defaultValue={atividade?.inicio?.slice(0, 5)} />
      </label>
      <label className="space-y-1">
        <span className={rotuloCampo}>Fim</span>
        <Input name="fim" type="time" required defaultValue={atividade?.fim?.slice(0, 5)} />
      </label>
      <label className="space-y-1 sm:col-span-4">
        <span className={rotuloCampo}>Comprovação (opcional)</span>
        <Input
          name="comprovacao"
          maxLength={500}
          defaultValue={atividade?.comprovacao ?? ""}
          placeholder={atividade ? undefined : "Link de foto, lista de presença, ata…"}
        />
      </label>
      <div className="sm:col-span-4">
        <CampoFoto inicial={atividade?.foto_comprovacao ?? null} onEnviando={onEnviandoFoto} />
      </div>
      <div className="sm:col-span-4">
        <EscolhaPessoas name="participantes" rotulo="Quem participou com você" pessoas={pessoas} marcadas={atividade?.participantes} />
      </div>
    </div>
  );
}

/** Cadastra uma atividade; limpa o formulário depois de salvar. */
export function FormAtividade({ dataPadrao, colegas }: { dataPadrao: string; colegas: Pessoa[] }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(cadastrarAtividadeAction, null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  // Trocar a chave remonta os campos: limpa também a foto escolhida.
  const [versao, setVersao] = useState(0);
  useEffect(() => {
    if (estado?.ok) setVersao((v) => v + 1);
  }, [estado]);
  return (
    <form action={acao} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Cadastrar atividade</h3>
      <CamposAtividade key={versao} dataPadrao={dataPadrao} colegas={colegas} onEnviandoFoto={setEnviandoFoto} />
      <Button type="submit" disabled={enviando || enviandoFoto}>
        {enviando ? "Salvando…" : "Salvar atividade"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

/**
 * Linha de uma atividade de mês aberto: mostra, edita no lugar e apaga.
 * `dataMinima` é o primeiro dia do mês corrente — antes dele o mês já fechou.
 */
export function LinhaAtividade({
  atividade,
  dataMinima,
  dia,
  colegas,
  children,
}: {
  atividade: AtividadeRelatorio;
  dataMinima: string;
  dia: string;
  colegas: Pessoa[];
  /** Horário, equipe, comprovação e foto, montados no servidor. */
  children?: ReactNode;
}) {
  const [editando, setEditando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [estadoEdicao, editar, salvando] = useActionState<EstadoAcao | null, FormData>(editarAtividadeAction, null);
  const [estadoApagar, apagar, apagando] = useActionState<EstadoAcao | null, FormData>(apagarAtividadeAction, null);

  useEffect(() => {
    if (estadoEdicao?.ok) setEditando(false);
  }, [estadoEdicao]);

  if (editando) {
    return (
      <form action={editar} className="space-y-3">
        <input type="hidden" name="id" value={atividade.id} />
        <CamposAtividade atividade={atividade} dataMinima={dataMinima} colegas={colegas} onEnviandoFoto={setEnviandoFoto} />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={salvando || enviandoFoto}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </div>
        {estadoEdicao && !estadoEdicao.ok && <Aviso estado={estadoEdicao} />}
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p>
            <span className="text-sm text-muted-foreground">{dia}</span> · {atividade.nome}
          </p>
          {children}
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditando(true)}>
            Editar
          </Button>
          <form
            action={apagar}
            onSubmit={confirmarEnvio(`Apagar “${atividade.nome}”?`, { rotulo: "Apagar", destrutivo: true })}
          >
            <input type="hidden" name="id" value={atividade.id} />
            <Button type="submit" size="sm" variant="outline" disabled={apagando} aria-label={`Apagar ${atividade.nome}`}>
              {apagando ? "Apagando…" : "Apagar"}
            </Button>
          </form>
        </div>
      </div>
      {estadoApagar && !estadoApagar.ok && <Aviso estado={estadoApagar} />}
    </div>
  );
}

/** Link vira link (abre em outra aba); texto aparece como está. */
export function Comprovacao({ texto }: { texto: string | null }) {
  if (!texto) return null;
  const link = /^https?:\/\/\S+$/.test(texto);
  return (
    <p className="text-sm text-muted-foreground">
      Comprovação:{" "}
      {link ? (
        <a href={texto} target="_blank" rel="noopener noreferrer" className="break-all text-[#684A97] underline">
          {texto}
        </a>
      ) : (
        texto
      )}
    </p>
  );
}

/** Link de comprovação de um encontro: botão que abre o campo no lugar. */
export function FormLinkEncontro({ encontroId, link, foto }: { encontroId: string; link: string | null; foto: string | null }) {
  const [aberto, setAberto] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [valor, setValor] = useState(link ?? "");
  const [estado, salvar, salvando] = useActionState<EstadoAcao | null, FormData>(salvarLinkEncontroAction, null);

  useEffect(() => {
    if (estado?.ok) setAberto(false);
  }, [estado]);

  if (!aberto) {
    return (
      <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => setAberto(true)}>
        {link || foto ? "Editar comprovação" : "Adicionar comprovação"}
      </Button>
    );
  }

  return (
    <form action={salvar} className="mt-2 space-y-2">
      <input type="hidden" name="encontroId" value={encontroId} />
      <label className="block space-y-1">
        <span className={rotuloCampo}>Link de comprovação</span>
        <Input name="link" type="url" maxLength={500} value={valor} onChange={(e) => setValor(e.target.value)} />
      </label>
      <CampoFoto inicial={foto} onEnviando={setEnviandoFoto} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={salvando || enviandoFoto}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
      {estado && !estado.ok && <Aviso estado={estado} />}
    </form>
  );
}
