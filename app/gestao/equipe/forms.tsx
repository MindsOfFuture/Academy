"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoAcao, GestaoPapel } from "@/lib/api/gestao/types";
import {
  alterarPapelAction,
  cadastrarBolsaAction,
  concederPapelAction,
  desligamentoAction,
  removerMembroAction,
} from "./actions";

type Acao = (anterior: EstadoAcao | null, form: FormData) => Promise<EstadoAcao>;

function Aviso({ estado }: { estado: EstadoAcao | null }) {
  if (!estado) return null;
  return (
    <p role={estado.ok ? "status" : "alert"} className={`text-sm ${estado.ok ? "text-green-700" : "text-red-700"}`}>
      {estado.mensagem}
    </p>
  );
}

const rotuloCampo = "text-sm font-medium text-gray-700";
const campoSelect =
  "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function FormConcederPapel() {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(concederPapelAction, null);
  return (
    <form action={acao} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Adicionar pessoa à equipe</h3>
      <p className="text-sm text-muted-foreground">
        A pessoa precisa ter conta no site. Use o e-mail completo com que ela entra.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="space-y-1">
          <span className={rotuloCampo}>E-mail</span>
          <Input name="email" type="email" required autoComplete="off" placeholder="nome@estudante.ufjf.br" />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Papel</span>
          <select name="papel" defaultValue="bolsista" className={campoSelect}>
            <option value="bolsista">Bolsista</option>
            <option value="coordenacao">Coordenação</option>
          </select>
        </label>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Adicionando…" : "Adicionar"}
        </Button>
      </div>
      <Aviso estado={estado} />
    </form>
  );
}

export function FormBolsa({ bolsistas }: { bolsistas: { id: string; nome: string }[] }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(cadastrarBolsaAction, null);
  if (bolsistas.length === 0) return null;
  return (
    <form action={acao} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Cadastrar bolsa</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 sm:col-span-3">
          <span className={rotuloCampo}>Bolsista</span>
          <select name="bolsistaId" required className={campoSelect} defaultValue="">
            <option value="" disabled>
              Escolha…
            </option>
            {bolsistas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Modalidade</span>
          <select name="modalidade" required className={campoSelect} defaultValue="graduacao">
            <option value="graduacao">Graduação</option>
            <option value="mestrado">Mestrado</option>
            <option value="bdcti">BDCTI</option>
            <option value="critt">CRITT</option>
            <option value="outra">Outra</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Horas por semana</span>
          <Input name="cargaSemanalHoras" inputMode="decimal" required placeholder="20" />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Valor mensal (R$)</span>
          <Input name="valorMensal" inputMode="decimal" required placeholder="700,00" />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Início</span>
          <Input name="inicio" type="date" required />
        </label>
        <label className="space-y-1">
          <span className={rotuloCampo}>Fim</span>
          <Input name="fim" type="date" required />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? "Salvando…" : "Salvar bolsa"}
          </Button>
        </div>
      </div>
      <Aviso estado={estado} />
    </form>
  );
}

function BotaoAcao({
  acao,
  campos,
  rotulo,
  confirmar,
  variante = "outline",
}: {
  acao: Acao;
  campos: Record<string, string>;
  rotulo: string;
  confirmar?: string;
  variante?: "outline" | "destructive";
}) {
  const [estado, executar, enviando] = useActionState<EstadoAcao | null, FormData>(acao, null);
  return (
    <form
      action={executar}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      {Object.entries(campos).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <Button type="submit" size="sm" variant={variante} disabled={enviando}>
        {rotulo}
      </Button>
      {estado && !estado.ok && <Aviso estado={estado} />}
    </form>
  );
}

export function AcoesMembro({
  userProfileId,
  nome,
  papel,
  desligado,
  temAlocacao,
}: {
  userProfileId: string;
  nome: string;
  papel: GestaoPapel;
  desligado: boolean;
  temAlocacao: boolean;
}) {
  const outroPapel: GestaoPapel = papel === "coordenacao" ? "bolsista" : "coordenacao";
  return (
    <div className="flex flex-wrap gap-2">
      {!desligado && (
        <BotaoAcao
          acao={alterarPapelAction}
          campos={{ userProfileId, papel: outroPapel }}
          rotulo={outroPapel === "coordenacao" ? "Tornar coordenação" : "Tornar bolsista"}
        />
      )}
      <BotaoAcao
        acao={desligamentoAction}
        campos={{ userProfileId, acao: desligado ? "reativar" : "desligar" }}
        rotulo={desligado ? "Reativar" : "Desligar"}
        confirmar={desligado ? undefined : `Desligar ${nome}? O acesso é cortado agora e o histórico fica.`}
      />
      {!temAlocacao && (
        <BotaoAcao
          acao={removerMembroAction}
          campos={{ userProfileId }}
          rotulo="Remover"
          variante="destructive"
          confirmar={`Remover ${nome} da equipe? Só é possível porque a pessoa nunca foi alocada.`}
        />
      )}
    </div>
  );
}
