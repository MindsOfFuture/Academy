"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mesCorrente, mesVizinho, nomeDoMes } from "./alocacao/rotulos";

/**
 * Troca de mês de todas as telas da gestão separadas por período: anterior e
 * próximo, a lista para pular direto a um mês, "Este mês" e as setas ← → do
 * teclado. O mês fica no endereço (`?mes=`), junto dos `parametros` da tela.
 */

const MESES_ANTES = 24;
const MESES_DEPOIS = 12;

export function SeletorMes({
  mes,
  titulo,
  parametros = {},
}: {
  mes: string;
  /** Antes do mês: "Carga de", "Relatório de". Sem título, só o mês. */
  titulo?: string;
  /** Outros parâmetros do endereço que a troca de mês mantém (ex.: `registro`). */
  parametros?: Record<string, string>;
}) {
  const router = useRouter();
  const raiz = useRef<HTMLDivElement>(null);
  const atual = mesCorrente();
  const href = (m: string) => `?${new URLSearchParams({ ...parametros, mes: m })}`;
  const anterior = href(mesVizinho(mes, -1));
  const proximo = href(mesVizinho(mes, 1));

  // A lista vai de 2 anos atrás a 1 ano à frente, e sempre inclui o mês aberto.
  const opcoes = Array.from({ length: MESES_ANTES + MESES_DEPOIS + 1 }, (_, i) => mesVizinho(atual, i - MESES_ANTES));
  if (!opcoes.includes(mes)) opcoes.push(mes);
  opcoes.sort().reverse();

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const alvo = e.target;
      if (alvo instanceof Element && alvo.closest("input, textarea, select, [contenteditable=true]")) return;
      // Com uma janela aberta, só o seletor de dentro dela responde.
      const janela = document.querySelector("dialog[open]");
      if (janela && !janela.contains(raiz.current)) return;
      e.preventDefault();
      router.push(e.key === "ArrowLeft" ? anterior : proximo, { scroll: false });
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [router, anterior, proximo]);

  const seta = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-white text-xl text-[#684A97] hover:bg-[#684A97]/10";

  // Sem quebra na linha de fora: as setas ficam sempre nas pontas e só o mês quebra no celular.
  return (
    <div ref={raiz} className="flex items-center gap-2">
      <Link href={anterior} scroll={false} aria-label="Mês anterior" className={seta}>
        ‹
      </Link>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
        <h2 className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xl font-semibold">
          {titulo && <span>{titulo}</span>}
          <select
            aria-label="Mês"
            value={mes}
            onChange={(e) => router.push(href(e.target.value), { scroll: false })}
            className="max-w-full rounded-md border border-input bg-white px-2 py-1 text-xl font-semibold"
          >
            {opcoes.map((m) => (
              <option key={m} value={m}>
                {titulo ? nomeDoMes(m).toLowerCase() : nomeDoMes(m)}
              </option>
            ))}
          </select>
        </h2>
        {mes !== atual && (
          <Link href={href(atual)} scroll={false} className="inline-flex min-h-11 items-center rounded-md border bg-white px-3 text-sm text-[#684A97] hover:bg-[#684A97]/10">
            Este mês
          </Link>
        )}
      </div>
      <Link href={proximo} scroll={false} aria-label="Próximo mês" className={seta}>
        ›
      </Link>
    </div>
  );
}
