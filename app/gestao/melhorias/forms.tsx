"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AreaMelhoria, EstadoAcao, Melhoria, StatusMelhoria } from "@/lib/api/gestao/types";
import {
  apoiarMelhoriaAction,
  criarMelhoriaAction,
  editarMelhoriaAction,
  responderMelhoriaAction,
  retirarMelhoriaAction,
} from "./actions";

/*
 * Os rótulos chegam do servidor como props: este arquivo é cliente e não pode
 * importar `lib/api/gestao/melhorias` (server-only).
 */

function Aviso({ estado }: { estado: EstadoAcao | null }) {
  if (!estado) return null;
  return (
    <p role={estado.ok ? "status" : "alert"} className={`text-sm ${estado.ok ? "text-green-700" : "text-red-700"}`}>
      {estado.mensagem}
    </p>
  );
}

const rotulo = "text-sm font-medium text-gray-700";
const ajuda = "text-xs text-muted-foreground";
const areaTexto =
  "flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const campoSelect =
  "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function CamposPedido({ areas, pedido }: { areas: Record<AreaMelhoria, string>; pedido?: Melhoria }) {
  return (
    <>
      <label className="block space-y-1">
        <span className={rotulo}>Título</span>
        <Input name="titulo" required minLength={3} maxLength={120} defaultValue={pedido?.titulo} placeholder="Ex.: Chamada funcionar sem internet" />
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Sobre o quê?</span>
        <select name="area" required className={campoSelect} defaultValue={pedido?.area ?? ""}>
          <option value="" disabled>
            Escolha…
          </option>
          {(Object.keys(areas) as AreaMelhoria[]).map((a) => (
            <option key={a} value={a}>
              {areas[a]}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Qual é o problema?</span>
        <span className={`block ${ajuda}`}>O que acontece hoje e atrapalha. Pedido sem problema vira lista de desejos.</span>
        <textarea name="problema" required minLength={10} maxLength={2000} className={areaTexto} defaultValue={pedido?.problema} />
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>O que você propõe?</span>
        <textarea name="proposta" required minLength={3} maxLength={2000} className={areaTexto} defaultValue={pedido?.proposta} />
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Quem sofre com isso hoje? (opcional)</span>
        <Input name="quemSofre" maxLength={500} defaultValue={pedido?.quemSofre ?? ""} placeholder="Ex.: bolsistas nas escolas sem sinal" />
      </label>
    </>
  );
}

export function FormNovaMelhoria({ areas }: { areas: Record<AreaMelhoria, string> }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(criarMelhoriaAction, null);
  return (
    <form action={acao} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Pedir uma melhoria</h2>
      <p className="rounded-md bg-[#684A97]/5 p-3 text-sm text-gray-700">
        Este espaço é para melhorar o projeto e o sistema. Toda solicitação recebe resposta da coordenação em até 14
        dias. Questão de conduta ou sobre uma pessoa vai direto à coordenação, fora daqui.
      </p>
      <CamposPedido areas={areas} />
      <Button type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar pedido"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

export function FormEditarMelhoria({ areas, pedido }: { areas: Record<AreaMelhoria, string>; pedido: Melhoria }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(editarMelhoriaAction, null);
  const [estadoRetirar, retirar, retirando] = useActionState<EstadoAcao | null, FormData>(retirarMelhoriaAction, null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setAberto((v) => !v)}>
          {aberto ? "Fechar edição" : "Editar pedido"}
        </Button>
        <form
          action={retirar}
          onSubmit={(e) => {
            if (!window.confirm("Retirar este pedido? Ele some da lista.")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={pedido.id} />
          <Button type="submit" variant="destructive" size="sm" disabled={retirando}>
            Retirar pedido
          </Button>
        </form>
      </div>
      <Aviso estado={estadoRetirar} />
      {aberto && (
        <form action={acao} className="space-y-3 rounded-lg border bg-white p-4">
          <input type="hidden" name="id" value={pedido.id} />
          <CamposPedido areas={areas} pedido={pedido} />
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar"}
          </Button>
          <Aviso estado={estado} />
        </form>
      )}
    </div>
  );
}

export function FormResponderMelhoria({
  pedido,
  proximos,
  rotulosStatus,
  outrosPedidos,
}: {
  pedido: Melhoria;
  proximos: StatusMelhoria[];
  rotulosStatus: Record<StatusMelhoria, string>;
  outrosPedidos: { id: string; titulo: string }[];
}) {
  const [status, setStatus] = useState<StatusMelhoria | "">("");
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(responderMelhoriaAction, null);
  if (proximos.length === 0) return null;
  const exigeMotivo = status === "recusada" || status === "duplicada";

  return (
    <form action={acao} className="space-y-3 rounded-lg border border-[#684A97]/30 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Responder</h2>
      <input type="hidden" name="id" value={pedido.id} />
      <label className="block space-y-1">
        <span className={rotulo}>Resposta</span>
        <select
          name="status"
          required
          className={campoSelect}
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusMelhoria)}
        >
          <option value="" disabled>
            Escolha…
          </option>
          {proximos.map((s) => (
            <option key={s} value={s}>
              {rotulosStatus[s]}
            </option>
          ))}
        </select>
      </label>
      {status === "duplicada" && (
        <label className="block space-y-1">
          <span className={rotulo}>Pedido original</span>
          <select name="duplicadaDe" required className={campoSelect} defaultValue="">
            <option value="" disabled>
              Escolha…
            </option>
            {outrosPedidos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.titulo}
              </option>
            ))}
          </select>
        </label>
      )}
      {(status === "aceita" || status === "entregue") && (
        <label className="block space-y-1">
          <span className={rotulo}>Onde acompanhar (opcional)</span>
          <Input name="linkExecucao" type="url" defaultValue={pedido.linkExecucao ?? ""} placeholder="https://trello.com/c/…" />
        </label>
      )}
      <label className="block space-y-1">
        <span className={rotulo}>{exigeMotivo ? "Motivo (obrigatório)" : "Mensagem para quem pediu (opcional)"}</span>
        <textarea
          name="resposta"
          required={exigeMotivo}
          minLength={exigeMotivo ? 10 : undefined}
          maxLength={2000}
          className={areaTexto}
          defaultValue={pedido.resposta ?? ""}
        />
      </label>
      <Button type="submit" disabled={enviando || !status}>
        {enviando ? "Salvando…" : "Registrar resposta"}
      </Button>
      <Aviso estado={estado} />
    </form>
  );
}

export function BotaoApoio({ id, apoiei, apoios, podeApoiar }: { id: string; apoiei: boolean; apoios: number; podeApoiar: boolean }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(apoiarMelhoriaAction, null);
  const texto = `${apoios} ${apoios === 1 ? "pessoa precisa" : "pessoas precisam"} disso também`;
  if (!podeApoiar) return <p className="text-sm text-muted-foreground">{texto}</p>;
  return (
    <form action={acao} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="apoiar" value={apoiei ? "0" : "1"} />
      <Button type="submit" size="sm" variant="outline" disabled={enviando} aria-pressed={apoiei}>
        {apoiei ? "Retirar apoio" : "Preciso disso também"}
      </Button>
      <span className="text-sm text-muted-foreground">{texto}</span>
      {estado && !estado.ok && <Aviso estado={estado} />}
    </form>
  );
}
