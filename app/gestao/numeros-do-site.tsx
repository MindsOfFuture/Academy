"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Destaque } from "@/lib/api/content";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { Aviso, rotuloCampo } from "./equipe/forms";
import { numerosDoSiteAction } from "./actions";

const NOME: Record<Destaque["chave"], string> = { escolas: "Escolas", alunos: "Alunos", aulas: "Aulas" };

/**
 * Specs 019 e 028: os números que a página inicial mostra logo abaixo do logo. A
 * coordenação escolhe quais aparecem, o texto embaixo de cada um e o número base.
 * Envio à mão (e não por `action` no formulário): o React limparia os campos depois
 * de salvar e a tela voltaria a mostrar os valores antigos.
 */
export function FormNumerosDoSite({ destaques }: { destaques: Destaque[] }) {
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
      <ul className="divide-y">
        {destaques.map((d) => (
          <li key={d.chave} className="grid gap-3 py-3 first:pt-0 sm:grid-cols-[9rem_1fr_9rem] sm:items-end">
            <label className="flex items-center gap-2 text-sm font-medium sm:pb-2">
              <input type="checkbox" name={`mostrar_${d.chave}`} defaultChecked={d.mostrar} className="size-4 accent-[#684A97]" />
              Mostrar {NOME[d.chave].toLowerCase()}
            </label>
            <label className="space-y-1">
              <span className={rotuloCampo}>Texto embaixo do número</span>
              <Input name={`rotulo_${d.chave}`} required minLength={2} maxLength={40} defaultValue={d.rotulo} />
            </label>
            <label className="space-y-1">
              <span className={rotuloCampo}>Número base</span>
              <Input
                name={d.chave}
                type="number"
                inputMode="numeric"
                min={0}
                max={1000000}
                step={1}
                required
                defaultValue={d.base}
              />
            </label>
            <p className="text-xs text-muted-foreground sm:col-span-3">
              {d.mostrar
                ? `O site mostra hoje: ${d.total.toLocaleString("pt-BR")} ${d.rotulo.toLowerCase()}.`
                : "Escondido na página inicial."}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        O número base é o que o projeto já tinha antes da gestão. O site soma a ele as escolas, os alunos das turmas e
        os encontros concluídos cadastrados aqui.
      </p>
      <Button type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}
