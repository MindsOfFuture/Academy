"use client";


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import type { EstadoAcao } from "@/lib/api/gestao/types";

/**
 * Um botão salva a página inteira do encontro: cada bloco editável (dados do
 * encontro, cada pessoa da equipe, chamada, presentes, nota) se registra, e o
 * botão manda só os que mudaram, em ordem, mostrando um aviso só. Ações de um
 * clique (concluir, cancelar, remover, alocar, substituir) seguem à parte.
 */

type Enviar = (dados: FormData) => Promise<EstadoAcao | null>;

interface Bloco {
  form: HTMLFormElement;
  enviar: Enviar;
  /** Antes dos outros: menor primeiro (dados do encontro mudam horários). */
  ordem: number;
  /** Prefixo do aviso de erro, quando há vários blocos iguais (uma pessoa da equipe). */
  nome?: string;
  onSalvo?: () => void;
  /** Como o formulário estava quando foi montado ou salvo. */
  retrato: string;
}

/** O que o formulário enviaria agora; arquivo fica de fora (a foto vai pelo caminho, campo `foto`). */
export function retratar(dados: FormData): string {
  return JSON.stringify(
    [...dados.entries()].filter(([, v]) => typeof v === "string"),
  );
}

interface Grupo {
  registrar: (id: string, bloco: Omit<Bloco, "retrato">) => () => void;
  salvar: () => Promise<void>;
  salvando: boolean;
}

const Contexto = createContext<Grupo | null>(null);

export function SalvarTudo({ children }: { children: ReactNode }) {
  const blocos = useRef(new Map<string, Bloco>());
  const [salvando, setSalvando] = useState(false);
  const [avisos, setAvisos] = useState<EstadoAcao[]>([]);

  const registrar = useCallback((id: string, bloco: Omit<Bloco, "retrato">) => {
    blocos.current.set(id, {
      ...bloco,
      retrato: retratar(new FormData(bloco.form)),
    });
    return () => {
      blocos.current.delete(id);
    };
  }, []);

  const salvar = useCallback(async () => {
    const mudaram = [...blocos.current.values()]
      .filter(
        (b) =>
          b.form.isConnected && retratar(new FormData(b.form)) !== b.retrato,
      )
      .sort((a, b) => a.ordem - b.ordem);
    if (mudaram.length === 0) {
      setAvisos([{ ok: true, mensagem: "Nada mudou." }]);
      return;
    }
    for (const b of mudaram) if (!b.form.reportValidity()) return;
    // Lê tudo antes do primeiro envio: a página recarrega no meio e pode remontar blocos.
    const envios = mudaram.map((b) => ({ b, dados: new FormData(b.form) }));
    setSalvando(true);
    setAvisos([]);
    const resultado: EstadoAcao[] = [];
    for (const { b, dados } of envios) {
      let r: EstadoAcao | null;
      try {
        r = await b.enviar(dados);
      } catch {
        r = { ok: false, mensagem: "Não foi possível salvar. Tente de novo." };
      }
      if (!r) continue;
      if (r.ok) {
        b.retrato = retratar(dados);
        b.onSalvo?.();
      }
      resultado.push(
        r.ok || !b.nome
          ? r
          : { ok: false, mensagem: `${b.nome}: ${r.mensagem}` },
      );
    }
    setAvisos(resultado);
    setSalvando(false);
  }, []);

  const falhas = avisos.filter((a) => !a.ok);
  const certos = avisos.filter((a) => a.ok);
  return (
    <Contexto.Provider value={{ registrar, salvar, salvando }}>
      {children}
      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-2 rounded-lg border bg-white/95 p-3 shadow-md backdrop-blur sm:flex-row sm:items-center">
        <Button type="button" onClick={() => void salvar()} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </Button>
        <div className="space-y-0.5 text-sm">
          {certos.length > 0 && (
            <p role="status" className="text-green-700">
              {certos.map((a) => a.mensagem).join(" ")}
            </p>
          )}
          {falhas.map((a, i) => (
            <p key={i} role="alert" className="text-red-700">
              {a.mensagem}
            </p>
          ))}
        </div>
      </div>
    </Contexto.Provider>
  );
}

/**
 * Liga um formulário ao botão da página. Devolve `ref` e `onSubmit` para o
 * `<form>`: Enter num campo também salva tudo.
 */
export function useBloco(
  enviar: Enviar,
  opcoes: { ordem: number; nome?: string; onSalvo?: () => void },
) {
  const grupo = useContext(Contexto);
  if (!grupo) throw new Error("useBloco precisa de <SalvarTudo> em volta.");
  const id = useId();
  const ref = useRef<HTMLFormElement>(null);
  // O último enviar/onSalvo vale sem registrar de novo (o retrato não pode zerar a cada render).
  const atual = useRef({ enviar, onSalvo: opcoes.onSalvo });
  atual.current = { enviar, onSalvo: opcoes.onSalvo };
  const { registrar, salvar, salvando } = grupo;
  const { ordem, nome } = opcoes;

  useEffect(() => {
    if (!ref.current) return;
    return registrar(id, {
      form: ref.current,
      ordem,
      nome,
      enviar: (dados) => atual.current.enviar(dados),
      onSalvo: () => atual.current.onSalvo?.(),
    });
  }, [registrar, id, ordem, nome]);

  return {
    ref,
    salvando,
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void salvar();
    },
  };
}
