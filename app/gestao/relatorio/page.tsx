import { atividadesDoMes, encontrosDoMes } from "@/lib/api/gestao/relatorio";
import { exigirMembro } from "../guard";
import { diaCurto, hojeIso, mesCorrente, mesDaUrl, mesEditavel } from "../alocacao/rotulos";
import { FormAtividade, FormLinkEncontro, LinhaAtividade } from "./forms";
import { jaComecou } from "../alocacao/resumo";
import { SeletorMes } from "../seletor-mes";
import { RegistroDoMes } from "./registro";

/**
 * Relatório do mês de quem está logado (bolsista ou coordenação): os encontros
 * em que esteve e as atividades que cadastrou para o projeto.
 */
export default async function RelatorioPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirMembro("/gestao/relatorio");
  const mes = mesDaUrl((await searchParams).mes);
  const [encontros, atividades] = await Promise.all([encontrosDoMes(mes), atividadesDoMes(mes)]);

  const hoje = hojeIso();
  const dataPadrao = hoje.startsWith(mes) ? hoje : `${mes}-01`;
  // Mês que já terminou fica como foi para o relatório.
  const editavel = mesEditavel(mes);
  const dataMinima = `${mesCorrente()}-01`;

  return (
    <div className="space-y-8">
      <SeletorMes mes={mes} titulo="Relatório de" />

      <div className="flex flex-wrap justify-end gap-2">
        {/* Link comum: o navegador baixa o arquivo que a rota devolve. */}
        <a
          href={`/gestao/relatorio/pdf?mes=${mes}`}
          className="rounded-md bg-[#684A97] px-4 py-2 text-sm font-medium text-white hover:bg-[#684A97]/90"
        >
          Baixar relatório (.pdf)
        </a>
        <a
          href={`/gestao/relatorio/docx?mes=${mes}`}
          className="rounded-md border border-[#684A97] px-4 py-2 text-sm font-medium text-[#684A97] hover:bg-[#684A97]/10"
        >
          Baixar relatório (.docx)
        </a>
        <a
          href={`/gestao/calendario?mes=${mes}&meus=1`}
          className="rounded-md border border-[#684A97] px-4 py-2 text-sm font-medium text-[#684A97] hover:bg-[#684A97]/10"
        >
          Exportar meus encontros para o Google Agenda
        </a>
      </div>

      <RegistroDoMes
        encontros={encontros}
        atividades={atividades}
        linhaEncontro={(e) =>
          (e.situacao === "prevista" || e.situacao === "cumprida") &&
          jaComecou(e) && <FormLinkEncontro key={`${e.encontroId}-${e.meuLink}`} encontroId={e.encontroId} link={e.meuLink} />
        }
        linhaAtividade={
          editavel ? (a) => <LinhaAtividade atividade={a} dataMinima={dataMinima} dia={diaCurto(a.data)} /> : undefined
        }
      >
        <FormAtividade key={mes} dataPadrao={dataPadrao} />
      </RegistroDoMes>
    </div>
  );
}
