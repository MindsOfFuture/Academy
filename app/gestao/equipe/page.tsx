import Link from "next/link";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import { atividadesDoMes, encontrosDoMes } from "@/lib/api/gestao/relatorio";
import type { MembroEquipe, ModalidadeBolsa } from "@/lib/api/gestao/types";
import { exigirMembro } from "../guard";
import { mesDaUrl } from "../alocacao/rotulos";
import { RegistroDoMes } from "../relatorio/registro";
import { SeletorMes } from "../seletor-mes";
import { AcoesMembro, FormBolsa, FormConcederPapel } from "./forms";
import { JanelaRegistro } from "./janela-registro";

/** Equipe do projeto (spec 003) — só a coordenação chega aqui. */

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

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ registro?: string; mes?: string }>;
}) {
  await exigirMembro("/gestao/equipe", "coordenacao");
  const params = await searchParams;
  const equipe = await listarEquipe();
  // Só abre o registro de quem é bolsista nesta equipe (a lista já separa o E2E).
  const doRegistro = equipe.find((m) => m.bolsista && m.userProfileId === params.registro);
  const mes = mesDaUrl(params.mes);
  const registro = doRegistro
    ? await Promise.all([encontrosDoMes(mes, doRegistro.userProfileId), atividadesDoMes(mes, doRegistro.userProfileId)])
    : null;

  const ativos = equipe.filter((m) => !m.desligadoEm);
  const desligados = equipe.filter((m) => m.desligadoEm);
  const bolsistas = ativos.filter((m) => m.bolsista).map((m) => ({ id: m.userProfileId, nome: m.nome }));

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

      {doRegistro && registro && (
        <JanelaRegistro titulo={`Registro de atividades · ${doRegistro.nome}`}>
          <SeletorMes mes={mes} titulo="Relatório de" parametros={{ registro: doRegistro.userProfileId }} />
          <RegistroDoMes encontros={registro[0]} atividades={registro[1]} vazio="do bolsista" />
        </JanelaRegistro>
      )}
    </div>
  );
}

function Selo({ children }: { children: string }) {
  return (
    <span className="ml-1 rounded-full bg-[#684A97]/10 px-2 py-0.5 text-xs font-medium text-[#684A97]">{children}</span>
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
              {m.coordenacao && <Selo>Coordenação</Selo>}
              {m.bolsista && <Selo>Bolsista</Selo>}
            </p>
            <p className="text-sm text-muted-foreground">{m.email}</p>
            {m.bolsista && (
              <p className="text-sm">
                {m.bolsaVigente
                  ? `${MODALIDADE[m.bolsaVigente.modalidade]} · ${m.bolsaVigente.cargaSemanalHoras} h/semana · até ${dataBr(m.bolsaVigente.fim)}`
                  : "Sem bolsa vigente"}
              </p>
            )}
            {m.desligadoEm && <p className="text-sm text-muted-foreground">Desligado em {dataBr(m.desligadoEm)}</p>}
            {m.bolsista && (
              <Link href={`?registro=${m.userProfileId}`} scroll={false} className="text-sm text-[#684A97] hover:underline">
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
  );
}
