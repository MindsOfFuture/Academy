"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoAcao, GestaoPapel, PapeisMembro } from "@/lib/api/gestao/types";
import {
  buscarPessoasAction,
  cadastrarBolsaAction,
  concederPapelAction,
  definirPapelAction,
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
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<Awaited<ReturnType<typeof buscarPessoasAction>> | null>(null);
  const [selecionado, setSelecionado] = useState("");
  const [buscando, setBuscando] = useState(false);
  const versao = useRef(0);
  async function buscar() {
    const atual = ++versao.current;
    setBuscando(true);
    setSelecionado("");
    setResultado(null);
    try {
      const resposta = await buscarPessoasAction(busca);
      if (atual === versao.current) setResultado(resposta);
    } catch {
      if (atual === versao.current) setResultado({ ok: false, mensagem: "Não foi possível buscar pessoas. Tente novamente.", pessoas: [] });
    } finally { if (atual === versao.current) setBuscando(false); }
  }
  return (
    <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Adicionar pessoa à equipe</h3>
      <p className="text-sm text-muted-foreground">Busque parte do nome ou e-mail de quem já tem conta. Confira o e-mail e selecione a pessoa. O papel escolhido é somado aos que ela já tem.</p>
      <form onSubmit={(e) => { e.preventDefault(); void buscar(); }} className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 space-y-1">
          <span className={rotuloCampo}>Nome ou e-mail</span>
          <Input value={busca} minLength={2} maxLength={100} required autoComplete="off" placeholder="Parte do nome ou e-mail" onChange={(e) => {
            ++versao.current; setBusca(e.target.value); setSelecionado(""); setResultado(null); setBuscando(false);
          }} />
        </label>
        <Button type="submit" disabled={buscando || enviando || busca.trim().length < 2}>{buscando ? "Buscando…" : "Buscar"}</Button>
      </form>
      <Aviso estado={resultado} />
      {resultado && resultado.pessoas.length >= 20 && <p className="text-sm">Mostrando até 20 pessoas. Refine a busca se não encontrar quem procura.</p>}
      <form action={acao} onSubmit={(e) => { if (!selecionado || buscando) e.preventDefault(); }} className="space-y-3">
        <input type="hidden" name="userProfileId" value={selecionado} />
        {!!resultado?.pessoas.length && <fieldset className="space-y-2" disabled={enviando}>
          <legend className={rotuloCampo}>Selecione a pessoa cadastrada</legend>
          {resultado.pessoas.map((p) => <label key={p.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3">
            <input type="radio" name="pessoaEscolhida" value={p.id} checked={selecionado === p.id} onChange={() => setSelecionado(p.id)} required />
            <span className="min-w-0 break-words text-sm"><strong>{p.nome?.trim() || "Pessoa sem nome no cadastro"}</strong> — {p.email}
              <span className="block text-muted-foreground">{p.desligado_em ? "Desligada — será reativada" : p.coordenacao && p.bolsista ? "Coordenação e bolsista" : p.coordenacao ? "Coordenação" : p.bolsista ? "Bolsista" : "Ainda não está na equipe"}</span>
            </span>
          </label>)}
        </fieldset>}
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className={rotuloCampo}>Papel</span>
            <select name="papel" defaultValue="bolsista" className={campoSelect}>
              <option value="bolsista">Bolsista</option>
              <option value="coordenacao">Coordenação</option>
              <option value="ambos">Coordenação e bolsista</option>
            </select>
          </label>
          <Button type="submit" disabled={enviando || buscando || !selecionado}>{enviando ? "Adicionando…" : "Adicionar"}</Button>
        </div>
        <Aviso estado={estado} />
      </form>
    </div>
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

const NOME_PAPEL: Record<GestaoPapel, string> = { coordenacao: "coordenação", bolsista: "bolsista" };

/**
 * Dar o papel que falta ou, para quem tem os dois, tirar um deles (spec 012).
 * Quem tem um papel só não vê "tirar": para tirar o acesso é "Desligar".
 */
function BotoesPapel({ userProfileId, nome, papeis }: { userProfileId: string; nome: string; papeis: PapeisMembro }) {
  const ambos = papeis.coordenacao && papeis.bolsista;
  return (
    <>
      {(["coordenacao", "bolsista"] as const).map((papel) => {
        const outro: GestaoPapel = papel === "coordenacao" ? "bolsista" : "coordenacao";
        if (!papeis[papel]) {
          return (
            <BotaoAcao
              key={papel}
              acao={definirPapelAction}
              campos={{ userProfileId, papel, acao: "dar" }}
              rotulo={`Dar papel de ${NOME_PAPEL[papel]}`}
            />
          );
        }
        if (!ambos) return null;
        return (
          <BotaoAcao
            key={papel}
            acao={definirPapelAction}
            campos={{ userProfileId, papel, acao: "tirar" }}
            rotulo={`Tirar papel de ${NOME_PAPEL[papel]}`}
            confirmar={`Tirar o papel de ${NOME_PAPEL[papel]} de ${nome}? A pessoa continua na equipe como ${NOME_PAPEL[outro]}.`}
          />
        );
      })}
    </>
  );
}

export function AcoesMembro({
  userProfileId,
  nome,
  papeis,
  desligado,
  temAlocacao,
}: {
  userProfileId: string;
  nome: string;
  papeis: PapeisMembro;
  desligado: boolean;
  temAlocacao: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {!desligado && <BotoesPapel userProfileId={userProfileId} nome={nome} papeis={papeis} />}
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
