"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoAcao, GestaoPapel, PapeisMembro, UsuarioEncontrado } from "@/lib/api/gestao/types";
import {
  buscarPessoasAction,
  cadastrarBolsaAction,
  concederPapelAction,
  definirPapelAction,
  desligamentoAction,
  removerMembroAction,
} from "./actions";

type Acao = (anterior: EstadoAcao | null, form: FormData) => Promise<EstadoAcao>;

export function Aviso({ estado }: { estado: EstadoAcao | null }) {
  if (!estado) return null;
  return (
    <p role={estado.ok ? "status" : "alert"} className={`text-sm ${estado.ok ? "text-green-700" : "text-red-700"}`}>
      {estado.mensagem}
    </p>
  );
}

export const rotuloCampo = "text-sm font-medium text-gray-700";
export const campoSelect =
  "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/**
 * Caixa de busca com lista (spec 015): digita parte do nome, escolhe a pessoa.
 * A lista vem do servidor a cada pausa na digitação; teclado: setas, Enter, Esc.
 */
function BuscaPessoa() {
  const idLista = useId();
  const [termo, setTermo] = useState("");
  const [opcoes, setOpcoes] = useState<UsuarioEncontrado[]>([]);
  const [escolhida, setEscolhida] = useState<UsuarioEncontrado | null>(null);
  const [aberta, setAberta] = useState(false);
  const [ativa, setAtiva] = useState(0);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const t = termo.trim();
    if (escolhida || t.length < 3) {
      setOpcoes([]);
      return;
    }
    let viva = true;
    setBuscando(true);
    const espera = setTimeout(async () => {
      const achadas = await buscarPessoasAction(t);
      if (!viva) return;
      setOpcoes(achadas);
      setAtiva(0);
      setAberta(true);
      setBuscando(false);
    }, 250);
    return () => {
      viva = false;
      clearTimeout(espera);
    };
  }, [termo, escolhida]);

  function escolher(pessoa: UsuarioEncontrado) {
    setEscolhida(pessoa);
    setTermo(pessoa.nome);
    setAberta(false);
  }

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && opcoes.length) {
      e.preventDefault();
      setAberta(true);
      setAtiva((i) => (i + 1) % opcoes.length);
    } else if (e.key === "ArrowUp" && opcoes.length) {
      e.preventDefault();
      setAtiva((i) => (i - 1 + opcoes.length) % opcoes.length);
    } else if (e.key === "Enter" && aberta && opcoes[ativa]) {
      e.preventDefault();
      escolher(opcoes[ativa]);
    } else if (e.key === "Escape") {
      setAberta(false);
    }
  }

  const curto = termo.trim().length < 3;
  const mostrarLista = aberta && !escolhida && !curto;

  return (
    <div className="relative space-y-1">
      <label htmlFor={`${idLista}-campo`} className={rotuloCampo}>
        Pessoa
      </label>
      <Input
        id={`${idLista}-campo`}
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={mostrarLista && opcoes[ativa] ? `${idLista}-${ativa}` : undefined}
        autoComplete="off"
        placeholder="Digite parte do nome"
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setEscolhida(null);
        }}
        onKeyDown={teclado}
        onFocus={() => setAberta(true)}
        onBlur={() => setTimeout(() => setAberta(false), 150)}
      />
      <input type="hidden" name="userProfileId" value={escolhida?.id ?? ""} />
      <input type="hidden" name="nome" value={escolhida?.nome ?? ""} />
      {mostrarLista && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-white py-1 text-sm shadow-lg"
        >
          {opcoes.map((p, i) => (
            <li
              key={p.id}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={i === ativa}
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(p);
              }}
              onMouseEnter={() => setAtiva(i)}
              className={`cursor-pointer px-3 py-2 ${i === ativa ? "bg-[#684A97]/10" : ""}`}
            >
              <span className="font-medium">{p.nome}</span>
              <span className="ml-2 text-muted-foreground">{p.emailParcial}</span>
              {p.naEquipe && <span className="ml-2 text-xs text-[#684A97]">já na equipe</span>}
            </li>
          ))}
          {!buscando && opcoes.length === 0 && (
            <li className="px-3 py-2 text-muted-foreground">Ninguém encontrado. A pessoa precisa ter conta no site.</li>
          )}
        </ul>
      )}
      {!escolhida && curto && termo.length > 0 && (
        <p className="text-xs text-muted-foreground">Digite pelo menos 3 letras.</p>
      )}
    </div>
  );
}

export function FormConcederPapel() {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(concederPapelAction, null);
  return (
    <form action={acao} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Adicionar pessoa à equipe</h3>
      <p className="text-sm text-muted-foreground">
        Busque pelo nome ou pelo começo do e-mail; a pessoa precisa ter conta no site. Se ela já está na equipe, o
        papel escolhido é somado ao que ela já tem.
      </p>
      <div className="space-y-3">
        {/* Remonta depois de adicionar, para a caixa voltar vazia. */}
        <BuscaPessoa key={estado?.ok ? estado.mensagem : "busca"} />
        <label className="block space-y-1">
          <span className={rotuloCampo}>Papel</span>
          <select name="papel" defaultValue="bolsista" className={campoSelect}>
            <option value="bolsista">Bolsista</option>
            <option value="coordenacao">Coordenação</option>
            <option value="ambos">Coordenação e bolsista</option>
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
