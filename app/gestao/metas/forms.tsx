"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoAcao, Meta } from "@/lib/api/gestao/types";
import { andamentoMetaAction, concluirMetaAction, salvarMetaAction } from "./actions";

function Aviso({ estado }: { estado: EstadoAcao | null }) {
  if (!estado) return null;
  return (
    <p role={estado.ok ? "status" : "alert"} className={`text-sm ${estado.ok ? "text-green-700" : "text-red-700"}`}>
      {estado.mensagem}
    </p>
  );
}

const rotulo = "text-sm font-medium text-gray-700";
const areaTexto =
  "flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/** Criar (sem `meta`) ou editar. */
export function FormMeta({ meta, pessoas }: { meta?: Meta; pessoas: { id: string; nome: string }[] }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(salvarMetaAction, null);
  const marcados = new Set(meta?.responsaveis.map((r) => r.id));
  return (
    <form action={acao} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{meta ? "Editar meta" : "Nova meta"}</h2>
      {meta && <input type="hidden" name="id" value={meta.id} />}
      <label className="block space-y-1">
        <span className={rotulo}>Título</span>
        <Input name="titulo" required minLength={3} maxLength={200} defaultValue={meta?.titulo} />
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Descrição (opcional)</span>
        <textarea name="descricao" maxLength={2000} className={areaTexto} defaultValue={meta?.descricao ?? ""} />
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Prazo</span>
        <Input name="prazo" type="date" required defaultValue={meta?.prazo} className="w-auto" />
      </label>
      <fieldset className="space-y-1">
        <legend className={rotulo}>Responsáveis</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {pessoas.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="responsaveis" value={p.id} defaultChecked={marcados.has(p.id)} />
              {p.nome}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : meta ? "Salvar" : "Criar meta"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

export function FormAndamento({ metaId }: { metaId: string }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(andamentoMetaAction, null);
  return (
    <form action={acao} className="space-y-2">
      <input type="hidden" name="id" value={metaId} />
      <label className="block space-y-1">
        <span className={rotulo}>Registrar andamento</span>
        <textarea name="texto" required minLength={2} maxLength={2000} className={areaTexto} />
      </label>
      <Button type="submit" size="sm" disabled={enviando}>
        {enviando ? "Registrando…" : "Registrar"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

export function FormConcluirMeta({ metaId, concluida }: { metaId: string; concluida: boolean }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(concluirMetaAction, null);
  return (
    <form action={acao} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={metaId} />
      {concluida && <input type="hidden" name="acao" value="reabrir" />}
      <Button type="submit" size="sm" variant={concluida ? "outline" : "default"} disabled={enviando}>
        {concluida ? "Reabrir meta" : "Marcar como concluída"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}
