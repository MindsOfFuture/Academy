import { BOTAO_SECUNDARIO, classeFiltro } from "@/components/ui/botoes";
import Link from "next/link";
import { calendarioDaEquipe, listarEspacos } from "@/lib/api/gestao/alocacao";
import { colegasDaEquipe } from "@/lib/api/gestao/relatorio";
import type { EncontroDoCalendario } from "@/lib/api/gestao/types";
import { GradeDoMes } from "../grade-do-mes";
import { exigirMembro } from "../guard";
import { SeletorMes } from "../seletor-mes";
import { hojeIso, mesDaUrl, TIPO_ENCONTRO } from "../alocacao/rotulos";
import { FormEncontroDoBolsista } from "./forms";

/**
 * Calendário do bolsista: os próprios encontros do mês ou os da equipe toda.
 * Os próprios abrem a página do encontro. Daqui o bolsista cria encontro sem
 * escola nem turma.
 */

function Cartao({ e }: { e: EncontroDoCalendario }) {
  const estilo = e.cancelado
    ? "bg-gray-50 text-gray-500 line-through"
    : e.concluido
      ? "border-green-300 bg-green-50 text-green-900"
      : e.minha
        ? "border-[#684A97] bg-white"
        : "bg-white text-gray-700";
  const conteudo = (
    <>
      {e.concluido && <span className="sr-only">Concluído. </span>}
      <span className="font-semibold">
        {e.concluido && <span aria-hidden>✓ </span>}
        {e.horario}
      </span>{" "}
      · {e.modalidade}
      {e.numeroAula !== null && ` · Aula ${e.numeroAula}`}
      {e.tipo !== "aula" && <span className="block text-gray-600">{TIPO_ENCONTRO[e.tipo]}</span>}
      {e.turmaNome && <span className="block text-gray-600">{e.turmaNome}</span>}
      {e.escolaNome && <span className="block text-gray-600">{e.escolaNome}</span>}
      {e.espacoNome && <span className="block text-gray-600">{e.espacoNome}</span>}
      <span className="mt-1 block">{e.equipe.length ? e.equipe.map((n) => n.split(" ")[0]).join(", ") : "Sem equipe"}</span>
    </>
  );
  const classe = `block rounded-md border p-2 text-xs ${estilo}`;
  return e.minha ? (
    <Link href={`/gestao/encontro/${e.id}`} className={`${classe} hover:bg-[#684A97]/5`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ mes?: string; ver?: string }> }) {
  await exigirMembro("/gestao/calendario");
  const params = await searchParams;
  const mes = mesDaUrl(params.mes);
  const equipe = params.ver === "equipe";
  const [encontros, colegas, espacos] = await Promise.all([calendarioDaEquipe(mes), colegasDaEquipe(), listarEspacos()]);
  const hoje = hojeIso();
  const visiveis = equipe ? encontros : encontros.filter((e) => e.minha);

  const filtros: [string, string, boolean][] = [
    [`?${new URLSearchParams({ mes })}`, "Só os meus", !equipe],
    [`?${new URLSearchParams({ mes, ver: "equipe" })}`, "Equipe toda", equipe],
  ];

  return (
    <div className="space-y-6">
      <SeletorMes mes={mes} parametros={equipe ? { ver: "equipe" } : undefined} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Encontros" className="flex flex-wrap gap-2 text-sm">
          {filtros.map(([href, rotulo, atual]) => (
            <Link
              key={rotulo}
              href={href}
              scroll={false}
              aria-current={atual ? "page" : undefined}
              className={classeFiltro(atual)}
            >
              {rotulo}
            </Link>
          ))}
        </nav>
        {/* Link comum: o navegador baixa o .ics dos próprios encontros do mês. */}
        <a
          href={`/gestao/calendario/exportar?mes=${mes}&meus=1`}
          className={BOTAO_SECUNDARIO}
        >
          Exportar para o Google Agenda
        </a>
      </div>

      <FormEncontroDoBolsista
        key={mes}
        dataPadrao={hoje.startsWith(mes) ? hoje : `${mes}-01`}
        colegas={colegas}
        espacos={espacos.filter((e) => e.ativo)}
      />

      <GradeDoMes
        mes={mes}
        itens={visiveis}
        cartao={(e) => <Cartao e={e} />}
        vazio={equipe ? "Nenhum encontro da equipe neste mês." : "Nenhum encontro seu neste mês."}
      />
    </div>
  );
}
