"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { Aviso, rotuloCampo } from "../equipe/forms";
import { salvarTreinamentoAction } from "./actions";

export function FormTreinamento({ proximo }: { proximo: number }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(salvarTreinamentoAction, null);
  return (
    <form action={acao} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="font-semibold">Publicar vídeo</h2>
      <p className="text-sm text-muted-foreground">Suba o vídeo no YouTube como &quot;Não listado&quot; e cole o link aqui. Usar um número que já existe troca o vídeo daquele número.</p>
      <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
        <label className="block space-y-1"><span className={rotuloCampo}>Número</span><Input name="numero" type="number" min={1} max={999} required defaultValue={proximo} /></label>
        <label className="block space-y-1"><span className={rotuloCampo}>Título</span><Input name="titulo" required minLength={3} maxLength={200} /></label>
      </div>
      <label className="block space-y-1"><span className={rotuloCampo}>Link do YouTube</span><Input name="link" required placeholder="https://youtu.be/..." /></label>
      {estado && <Aviso estado={estado} />}
      <Button type="submit" disabled={enviando}>{enviando ? "Publicando…" : "Publicar"}</Button>
    </form>
  );
}
