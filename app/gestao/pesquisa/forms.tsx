"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmarEnvio } from "@/components/ui/confirmar";
import type { EstadoAcao, ProducaoPesquisa, ReuniaoPesquisa } from "@/lib/api/gestao/types";
import { TIPO_PRODUCAO } from "@/lib/api/gestao/validacao";
import { Aviso, campoSelect, rotuloCampo } from "../equipe/forms";
import { apagarProducaoAction, apagarReuniaoAction, salvarProducaoAction, salvarReuniaoAction } from "./actions";

const areaTexto =
  "flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Acao = (anterior: EstadoAcao | null, form: FormData) => Promise<EstadoAcao>;

/** Botão "Apagar" num form próprio, com confirmação. */
function Apagar({ id, acao, pergunta }: { id: string; acao: Acao; pergunta: string }) {
  const [estado, apagar, apagando] = useActionState<EstadoAcao | null, FormData>(acao, null);
  return (
    <form action={apagar} onSubmit={confirmarEnvio(pergunta, { rotulo: "Apagar", destrutivo: true })} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" disabled={apagando}>
        {apagando ? "Apagando…" : "Apagar"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

export function FormReuniao({ reuniao, podeApagar }: { reuniao: ReuniaoPesquisa | null; podeApagar: boolean }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(salvarReuniaoAction, null);
  return (
    <div className="space-y-3">
      <form action={acao} className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
        <input type="hidden" name="id" value={reuniao?.id ?? ""} />
        <label className="block space-y-1 sm:w-60">
          <span className={rotuloCampo}>Data</span>
          <Input name="data" type="date" required defaultValue={reuniao?.data} />
        </label>
        <label className="block space-y-1">
          <span className={rotuloCampo}>Participantes</span>
          <textarea name="participantes" rows={2} required maxLength={1000} className={areaTexto} defaultValue={reuniao?.participantes} />
        </label>
        <label className="block space-y-1">
          <span className={rotuloCampo}>O que foi feito</span>
          <textarea name="feito" rows={6} required maxLength={5000} className={areaTexto} defaultValue={reuniao?.feito} />
        </label>
        <label className="block space-y-1">
          <span className={rotuloCampo}>Desdobramentos</span>
          <textarea
            name="desdobramentos"
            rows={4}
            maxLength={5000}
            className={areaTexto}
            defaultValue={reuniao?.desdobramentos ?? ""}
          />
        </label>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
        <Aviso estado={estado} />
      </form>
      {podeApagar && reuniao && <Apagar id={reuniao.id} acao={apagarReuniaoAction} pergunta="Apagar esta reunião?" />}
    </div>
  );
}

export function FormProducao({ producao, podeApagar }: { producao: ProducaoPesquisa | null; podeApagar: boolean }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(salvarProducaoAction, null);
  return (
    <div className="space-y-3">
      <form action={acao} className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
        <input type="hidden" name="id" value={producao?.id ?? ""} />
        <label className="block space-y-1 sm:w-60">
          <span className={rotuloCampo}>Tipo</span>
          <select name="tipo" required className={campoSelect} defaultValue={producao?.tipo ?? "artigo_congresso"}>
            {Object.entries(TIPO_PRODUCAO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className={rotuloCampo}>Título</span>
          <Input name="titulo" required maxLength={300} defaultValue={producao?.titulo} />
        </label>
        <label className="block space-y-1">
          <span className={rotuloCampo}>Autores</span>
          <Input name="autores" required maxLength={1000} defaultValue={producao?.autores} />
        </label>
        <label className="block space-y-1 sm:w-60">
          <span className={rotuloCampo}>Data</span>
          <Input name="data" type="date" required defaultValue={producao?.data} />
        </label>
        <label className="block space-y-1">
          <span className={rotuloCampo}>Onde</span>
          <Input name="onde" maxLength={300} defaultValue={producao?.onde ?? ""} />
        </label>
        <label className="block space-y-1">
          <span className={rotuloCampo}>Link</span>
          <Input name="link" type="url" maxLength={500} defaultValue={producao?.link ?? ""} />
        </label>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
        <Aviso estado={estado} />
      </form>
      {podeApagar && producao && <Apagar id={producao.id} acao={apagarProducaoAction} pergunta="Apagar esta produção?" />}
    </div>
  );
}
