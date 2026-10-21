"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { Aviso, rotuloCampo } from "./equipe/forms";
import { numerosDoSiteAction } from "./actions";

/**
 * Spec 019: os dois números que a página inicial mostra, editáveis pela coordenação.
 * Envio à mão (e não por `action` no formulário): o React limparia os campos depois
 * de salvar e a tela voltaria a mostrar os números antigos.
 */
export function FormNumerosDoSite({ escolas, alunos }: { escolas: number; alunos: number }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(numerosDoSiteAction, null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        startTransition(() => acao(dados));
      }}
      className="space-y-3 rounded-lg border bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <label className="space-y-1">
          <span className={rotuloCampo}>Escolas atendidas</span>
          <Input name="escolas" type="number" inputMode="numeric" min={0} max={1000000} step={1} required defaultValue={escolas} />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Alunos impactados</span>
          <Input name="alunos" type="number" inputMode="numeric" min={0} max={1000000} step={1} required defaultValue={alunos} />
        </label>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar números"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">É o que aparece no topo da página inicial do site.</p>
      <Aviso estado={estado} />
    </form>
  );
}
