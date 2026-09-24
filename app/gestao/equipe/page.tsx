import { listarEquipe } from "@/lib/api/gestao/equipe";
import type { MembroEquipe, ModalidadeBolsa } from "@/lib/api/gestao/types";
import { exigirMembro } from "../guard";
import { AcoesMembro, FormBolsa, FormConcederPapel } from "./forms";

/** Equipe do projeto (spec 003) — só a coordenação chega aqui. */

const MODALIDADE: Record<ModalidadeBolsa, string> = {
  graduacao: "Graduação",
  mestrado: "Mestrado",
  bdcti: "BDCTI",
  critt: "CRITT",
  outra: "Outra",
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function EquipePage() {
  await exigirMembro("/gestao/equipe", "coordenacao");
  const equipe = await listarEquipe();

  const ativos = equipe.filter((m) => !m.desligadoEm);
  const desligados = equipe.filter((m) => m.desligadoEm);
  const bolsistas = ativos.filter((m) => m.papel === "bolsista").map((m) => ({ id: m.userProfileId, nome: m.nome }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormConcederPapel />
        <FormBolsa bolsistas={bolsistas} />
      </div>

      <section aria-labelledby="equipe-ativa" className="space-y-3">
        <h2 id="equipe-ativa" className="text-xl font-semibold">
          Equipe ativa ({ativos.length})
        </h2>
        <ListaMembros membros={ativos} />
      </section>

      {desligados.length > 0 && (
        <section aria-labelledby="equipe-desligada" className="space-y-3">
          <h2 id="equipe-desligada" className="text-xl font-semibold">
            Desligados ({desligados.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Sem acesso ao sistema. O que fizeram continua no histórico do projeto.
          </p>
          <ListaMembros membros={desligados} />
        </section>
      )}
    </div>
  );
}

function ListaMembros({ membros }: { membros: MembroEquipe[] }) {
  if (membros.length === 0) {
    return <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Ninguém por aqui ainda.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border bg-white shadow-sm">
      {membros.map((m) => (
        <li key={m.userProfileId} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="font-medium">
              {m.nome}{" "}
              <span className="ml-1 rounded-full bg-[#684A97]/10 px-2 py-0.5 text-xs font-medium text-[#684A97]">
                {m.papel === "coordenacao" ? "Coordenação" : "Bolsista"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">{m.email}</p>
            {m.papel === "bolsista" && (
              <p className="text-sm">
                {m.bolsaVigente
                  ? `${MODALIDADE[m.bolsaVigente.modalidade]} · ${m.bolsaVigente.cargaSemanalHoras} h/semana · ${moeda.format(
                      m.bolsaVigente.valorMensal,
                    )} · até ${dataBr(m.bolsaVigente.fim)}`
                  : "Sem bolsa vigente"}
              </p>
            )}
            {m.desligadoEm && <p className="text-sm text-muted-foreground">Desligado em {dataBr(m.desligadoEm)}</p>}
          </div>
          <AcoesMembro
            userProfileId={m.userProfileId}
            nome={m.nome}
            papel={m.papel}
            desligado={Boolean(m.desligadoEm)}
            temAlocacao={m.temAlocacao}
          />
        </li>
      ))}
    </ul>
  );
}
