"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

// Um duplo clique no botão de origem não pode cair já no botão de confirmar.
const ARMA_EM_MS = 400;

type Opcoes = { rotulo?: string; destrutivo?: boolean };
type Pedido = { mensagem: string; opcoes?: Opcoes; resolver: (ok: boolean) => void };

// Registrada pelo host montado; sem host, nada é confirmado.
let abrir: ((p: Pedido) => void) | null = null;

export function confirmar(mensagem: string, opcoes?: Opcoes): Promise<boolean> {
  if (!abrir) return Promise.resolve(false);
  const abrirPedido = abrir;
  return new Promise<boolean>((resolver) => abrirPedido({ mensagem, opcoes, resolver }));
}

const liberados = new WeakSet<HTMLFormElement>();

/** onSubmit síncrono para formulário com server action: pergunta antes de deixar o envio seguir. */
export function confirmarEnvio(mensagem: string, opcoes?: Opcoes) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    if (liberados.delete(form)) return; // segunda passada: o React envia a action
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    void confirmar(mensagem, opcoes).then((ok) => {
      if (!ok) return;
      liberados.add(form);
      try {
        form.requestSubmit(submitter ?? undefined);
      } finally {
        // Se a segunda passada não aconteceu (form fora da página, validação), a marca não pode sobrar.
        liberados.delete(form);
      }
    });
  };
}

export function JanelaConfirmacao() {
  const janela = useRef<HTMLDialogElement>(null);
  const voltar = useRef<HTMLButtonElement>(null);
  const pedido = useRef<Pedido | null>(null);
  const [atual, setAtual] = useState<Pedido | null>(null);
  const idMensagem = useId();
  const abertaEm = useRef(0);
  const caminho = usePathname();

  useEffect(() => {
    abrir = (novo) => {
      pedido.current?.resolver(false);
      pedido.current = novo;
      setAtual(novo);
      const dialog = janela.current;
      if (!dialog) return;
      dialog.returnValue = "";
      abertaEm.current = Date.now();
      if (!dialog.open) dialog.showModal();
      voltar.current?.focus();
    };
    return () => {
      abrir = null;
    };
  }, []);

  // Trocou de página com a pergunta aberta (voltar do navegador): ela não vale mais.
  useEffect(() => {
    if (janela.current?.open) janela.current.close();
  }, [caminho]);

  return (
    <dialog
      ref={janela}
      role="alertdialog"
      aria-labelledby={idMensagem}
      onClose={() => {
        pedido.current?.resolver(janela.current?.returnValue === "ok");
        pedido.current = null;
        setAtual(null);
      }}
      className="w-[min(28rem,calc(100vw-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="space-y-5 p-5">
        <p id={idMensagem} className="whitespace-pre-line text-sm">
          {atual?.mensagem}
        </p>
        <div className="flex justify-end gap-2">
          <Button ref={voltar} type="button" variant="outline" onClick={() => janela.current?.close()}>
            Voltar
          </Button>
          <Button
            type="button"
            variant={atual?.opcoes?.destrutivo ? "destructive" : "default"}
            onClick={() => {
              if (Date.now() - abertaEm.current < ARMA_EM_MS) return;
              janela.current?.close("ok");
            }}
          >
            {atual?.opcoes?.rotulo ?? "Confirmar"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
