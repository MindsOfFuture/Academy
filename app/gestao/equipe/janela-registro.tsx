"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Janela do registro de atividades de um bolsista. Abre quando o endereço tem
 * `?registro=<id>` (assim trocar de mês é só trocar o link) e, ao fechar, tira
 * o parâmetro. O conteúdo vem pronto do servidor.
 */
export function JanelaRegistro({ titulo, children }: { titulo: string; children: ReactNode }) {
  const janela = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!janela.current?.open) janela.current?.showModal();
  }, []);

  return (
    <dialog
      ref={janela}
      aria-labelledby="registro-titulo"
      // Esc e o botão fecham; os dois passam por aqui.
      onClose={() => router.replace("/gestao/equipe", { scroll: false })}
      className="w-[min(48rem,calc(100vw-2rem))] rounded-lg bg-gray-50 p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="space-y-6 p-5">
        <div className="flex items-start justify-between gap-3">
          <p id="registro-titulo" className="text-sm font-medium text-muted-foreground">
            {titulo}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => janela.current?.close()}>
            Fechar
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
