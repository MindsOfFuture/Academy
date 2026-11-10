"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AtividadeRelatorio, EstadoAcao } from "@/lib/api/gestao/types";
import { Aviso, rotuloCampo } from "../equipe/forms";
import { apagarAtividadeAction, cadastrarAtividadeAction, editarAtividadeAction } from "./actions";
import { confirmarEnvio } from "@/components/ui/confirmar";

/** Cadastra uma atividade; limpa o formulário depois de salvar. */
export function FormAtividade({ dataPadrao }: { dataPadrao: string }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(cadastrarAtividadeAction, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);
  return (
    <form ref={form} action={acao} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Cadastrar atividade</h3>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="space-y-1">
          <span className={rotuloCampo}>O que você fez</span>
          <Input name="nome" required minLength={2} maxLength={200} placeholder="Preparei o material da aula de Lego" />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Quando</span>
          <Input name="data" type="date" required defaultValue={dataPadrao} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Comprovação (opcional)</span>
          <Input name="comprovacao" maxLength={500} placeholder="Link de foto, lista de presença, ata…" />
        </label>
      </div>
      <Button type="submit" disabled={enviando}>
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
export function LinhaAtividade({ atividade, dataMinima, dia }: { atividade: AtividadeRelatorio; dataMinima: string; dia: string }) {
  const [editando, setEditando] = useState(false);
  const [estadoEdicao, editar, salvando] = useActionState<EstadoAcao | null, FormData>(editarAtividadeAction, null);
  const [estadoApagar, apagar, apagando] = useActionState<EstadoAcao | null, FormData>(apagarAtividadeAction, null);

  useEffect(() => {
    if (estadoEdicao?.ok) setEditando(false);
  }, [estadoEdicao]);

  if (editando) {
    return (
      <form action={editar} className="space-y-3">
        <input type="hidden" name="id" value={atividade.id} />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="space-y-1">
            <span className={rotuloCampo}>O que você fez</span>
            <Input name="nome" required minLength={2} maxLength={200} defaultValue={atividade.nome} />
          </label>
          <label className="space-y-1">
            <span className={rotuloCampo}>Quando</span>
            <Input name="data" type="date" required min={dataMinima} defaultValue={atividade.data} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className={rotuloCampo}>Comprovação (opcional)</span>
            <Input name="comprovacao" maxLength={500} defaultValue={atividade.comprovacao ?? ""} />
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={salvando}>
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
          <Comprovacao texto={atividade.comprovacao} />
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
