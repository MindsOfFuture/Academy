import { listarTurmas } from "@/lib/api/gestao/alocacao";
import { listEscolas } from "@/lib/api/gestao/entities";
import { exigirMembro } from "../../guard";
import { FormEscola, FormSituacaoTurma, FormTurma } from "../forms";
import { STATUS_TURMA } from "../rotulos";

/** Turmas e escolas (spec 014). Turma que não abriu continua aqui, com o motivo. */

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function TurmasPage() {
  await exigirMembro("/gestao/alocacao/turmas", "coordenacao");
  const [turmas, escolas] = await Promise.all([listarTurmas(), listEscolas()]);
  const opcoesEscola = escolas.map((e) => ({ id: e.id, nome: `${e.nome} · ${e.cidade}` }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormTurma escolas={opcoesEscola} />
        <FormEscola />
      </div>

      <section aria-labelledby="turmas" className="space-y-3">
        <h2 id="turmas" className="text-xl font-semibold">
          Turmas ({turmas.length})
        </h2>
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {turmas.map((t) => (
            <li key={t.id} className="space-y-3 p-4">
              <div>
                <p className="font-medium">
                  {t.nome}{" "}
                  <span className="ml-1 rounded-full bg-[#684A97]/10 px-2 py-0.5 text-xs font-medium text-[#684A97]">
                    {STATUS_TURMA[t.status]}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {t.modalidade} · {t.escolaNome} · desde {dataBr(t.inicio)}
                  {t.fim && ` até ${dataBr(t.fim)}`}
                </p>
              </div>
              <FormSituacaoTurma turma={t} />
            </li>
          ))}
          {turmas.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nenhuma turma cadastrada.</li>}
        </ul>
      </section>

      <section aria-labelledby="escolas" className="space-y-3">
        <h2 id="escolas" className="text-xl font-semibold">
          Escolas ({escolas.length})
        </h2>
        <ul className="divide-y rounded-lg border bg-white text-sm shadow-sm">
          {escolas.map((e) => (
            <li key={e.id} className="p-3">
              {e.nome} · {e.categoria} · {e.cidade}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
