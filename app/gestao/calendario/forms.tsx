"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIPO_ENCONTRO, type EstadoAcao, type TipoEncontro } from "@/lib/api/gestao/types";
import { Aviso, campoSelect, rotuloCampo } from "../equipe/forms";
import { EscolhaPessoas, type Pessoa } from "../relatorio/forms";
import { criarEncontroDoBolsistaAction } from "./actions";

/** Novo encontro sem escola nem turma: quem cria entra nele, com os colegas escolhidos. */
export function FormEncontroDoBolsista({
  dataPadrao,
  colegas,
  espacos,
}: {
  dataPadrao: string;
  colegas: Pessoa[];
  espacos: Pessoa[];
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(criarEncontroDoBolsistaAction, null);
  useEffect(() => {
    if (estado?.ok) setAberto(false);
  }, [estado]);

  if (!aberto) {
    return (
      <div className="space-y-2">
        <Button type="button" onClick={() => setAberto(true)}>
          Novo encontro
        </Button>
        {estado?.ok && <Aviso estado={estado} />}
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Novo encontro</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className={rotuloCampo}>Data</span>
          <Input name="data" type="date" required defaultValue={dataPadrao} />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Início</span>
          <Input name="inicio" type="time" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Fim</span>
          <Input name="fim" type="time" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Tipo</span>
          <select name="tipo" defaultValue="outro" className={campoSelect}>
            {(Object.keys(TIPO_ENCONTRO) as TipoEncontro[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_ENCONTRO[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Atividade</span>
          <Input name="modalidade" required minLength={2} maxLength={120} placeholder="Gravação de vídeo" />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={rotuloCampo}>Descrição (opcional)</span>
          <Input name="descricao" maxLength={200} />
        </label>
        {espacos.length > 0 && (
          <label className="space-y-1">
            <span className={rotuloCampo}>Espaço (opcional)</span>
            <select name="espacoId" defaultValue="" className={campoSelect}>
              <option value="">Sem espaço</option>
              {espacos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <EscolhaPessoas name="colegas" rotulo="Quem vai com você" pessoas={colegas} />
      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Criando…" : "Criar encontro"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
      {estado && !estado.ok && <Aviso estado={estado} />}
    </form>
  );
}
