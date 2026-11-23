"use client";

import { useState } from "react";
import Link from "next/link";
import type { MembroEquipe, ModalidadeBolsa } from "@/lib/api/gestao/types";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "@/components/ui/botoes";
import { AcoesMembro } from "./forms";

const MODALIDADE: Record<ModalidadeBolsa, string> = {
  graduacao: "Graduação",
  mestrado: "Mestrado",
  bdcti: "BDCTI",
  critt: "CRITT",
  outra: "Outra",
};

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

type Painel = "pessoa" | "bolsa" | null;

/**
 * Cabeçalho da equipe: título à esquerda, as duas ações à direita. Os
 * formulários abrem logo abaixo, um de cada vez.
 */
export function CabecalhoEquipe({
  titulo,
  formPessoa,
  formBolsa,
  abrir = null,
}: {
  titulo: React.ReactNode;
  formPessoa: React.ReactNode;
  formBolsa: React.ReactNode | null;
  abrir?: Painel;
}) {
  const [painel, setPainel] = useState<Painel>(abrir);
  const alternar = (p: Exclude<Painel, null>) => setPainel((atual) => (atual === p ? null : p));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {titulo}
        <div className="flex flex-wrap gap-2">
          {formBolsa && (
            <button
              type="button"
              aria-expanded={painel === "bolsa"}
              onClick={() => alternar("bolsa")}
              className={painel === "bolsa" ? BOTAO_PRIMARIO : BOTAO_SECUNDARIO}
            >
              Cadastrar bolsa
            </button>
          )}
          <button
            type="button"
            aria-expanded={painel === "pessoa"}
            onClick={() => alternar("pessoa")}
            className={BOTAO_PRIMARIO}
          >
            <span aria-hidden="true">+</span> Adicionar pessoa
          </button>
        </div>
      </div>
      {painel === "pessoa" && <div className="rounded-lg border bg-white p-4 shadow-sm">{formPessoa}</div>}
      {painel === "bolsa" && formBolsa && <div className="rounded-lg border bg-white p-4 shadow-sm">{formBolsa}</div>}
    </div>
  );
}

function Selo({ children }: { children: string }) {
  return (
    <span className="ml-1 rounded-full bg-[#684A97]/10 px-2 py-0.5 text-xs font-medium text-[#684A97]">{children}</span>
  );
}

export function ListaMembros({ membros, busca = false }: { membros: MembroEquipe[]; busca?: boolean }) {
  const [termo, setTermo] = useState("");
  if (membros.length === 0) {
    return <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Ninguém por aqui ainda.</p>;
  }
  const t = semAcento(termo.trim());
  const visiveis = t ? membros.filter((m) => semAcento(`${m.nome} ${m.email}`).includes(t)) : membros;
  return (
    <div className="space-y-3">
      {busca && (
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar na equipe pelo nome ou e-mail"
          aria-label="Buscar na equipe"
          className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684A97]/40"
        />
      )}
      {visiveis.length === 0 ? (
        <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Ninguém com esse nome.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {visiveis.map((m) => (
            <li key={m.userProfileId} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">
                  {m.nome}{" "}
                  {m.coordenacao && <Selo>Coordenação</Selo>}
                  {m.bolsista && <Selo>Bolsista</Selo>}
                </p>
                <p className="break-all text-sm text-muted-foreground">{m.email}</p>
                {m.bolsista && (
                  <p className="text-sm">
                    {m.bolsaVigente
                      ? `${MODALIDADE[m.bolsaVigente.modalidade]} · ${m.bolsaVigente.cargaSemanalHoras} h/semana · até ${dataBr(m.bolsaVigente.fim)}`
                      : "Sem bolsa vigente"}
                  </p>
                )}
                {m.desligadoEm && <p className="text-sm text-muted-foreground">Desligado em {dataBr(m.desligadoEm)}</p>}
                {m.bolsista && (
                  <Link
                    href={`?registro=${m.userProfileId}`}
                    scroll={false}
                    className="inline-flex min-h-11 items-center text-sm text-[#684A97] hover:underline md:min-h-0"
                  >
                    Registro de atividades
                  </Link>
                )}
              </div>
              <AcoesMembro
                userProfileId={m.userProfileId}
                nome={m.nome}
                papeis={{ coordenacao: m.coordenacao, bolsista: m.bolsista }}
                desligado={Boolean(m.desligadoEm)}
                temAlocacao={m.temAlocacao}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
