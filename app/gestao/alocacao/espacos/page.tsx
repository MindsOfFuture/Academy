import { AcaoComFormulario } from "@/components/ui/acao-formulario";
import { CABECALHO_SECAO } from "@/components/ui/botoes";
import { listarEspacos } from "@/lib/api/gestao/alocacao";
import { exigirMembro } from "../../guard";
import { FormEspaco } from "../forms";

/** Espaços da agenda (salas e outros lugares). Nada se apaga: espaço fora de uso fica inativo. */
export default async function EspacosPage() {
  await exigirMembro("/gestao/alocacao/espacos", "coordenacao");
  const espacos = await listarEspacos();

  return (
    <div className="space-y-6">
      <section aria-labelledby="espacos" className="space-y-3">
        <div className={CABECALHO_SECAO}>
        <h2 id="espacos" className="text-xl font-semibold">
          Espaços ({espacos.length})
        </h2>
        <AcaoComFormulario rotulo="Novo espaço"><FormEspaco /></AcaoComFormulario>
        </div>
        <ul className="divide-y rounded-lg border bg-white text-sm shadow-sm">
          {espacos.map((s) => (
            <li key={s.id} className="space-y-2 p-3">
              <p className="font-medium">
                {s.nome}
                {!s.ativo && (
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Inativo</span>
                )}
              </p>
              <details>
                <summary className="min-h-11 md:min-h-8 flex items-center cursor-pointer font-medium text-[#684A97]">Editar</summary>
                <div className="pt-3">
                  <FormEspaco key={`${s.nome}|${s.ativo}`} espaco={s} />
                </div>
              </details>
            </li>
          ))}
          {espacos.length === 0 && <li className="p-3 text-muted-foreground">Nenhum espaço cadastrado.</li>}
        </ul>
      </section>
    </div>
  );
}
