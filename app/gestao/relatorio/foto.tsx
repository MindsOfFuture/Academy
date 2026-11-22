"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { rotuloCampo } from "../equipe/forms";

const BUCKET = "gestao-comprovacao";
const LIMITE = 20 * 1024 * 1024;
const EXTENSAO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Foto de comprovação: envia direto do navegador para o bucket privado, na
 * pasta de quem está logado (a policy do Storage confere), e guarda o caminho
 * no campo escondido `foto`. `onEnviando` trava o botão de salvar no meio do envio.
 */
export function CampoFoto({
  inicial,
  onEnviando,
}: {
  inicial: string | null;
  onEnviando?: (enviando: boolean) => void;
}) {
  const id = useId();
  const arquivo = useRef<HTMLInputElement>(null);
  const [caminho, setCaminho] = useState(inicial ?? "");
  const [previa, setPrevia] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(file: File) {
    setErro(null);
    const ext = EXTENSAO[file.type];
    if (!ext) return setErro("Envie uma foto em JPG, PNG ou WebP.");
    if (file.size > LIMITE) return setErro("A foto pode ter até 20 MB.");
    setEnviando(true);
    onEnviando?.(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Entre de novo para enviar a foto.");
      const nome = `${data.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(nome, file, { contentType: file.type });
      if (error) throw new Error("Não foi possível enviar a foto. Tente de novo.");
      setCaminho(nome);
      setPrevia(URL.createObjectURL(file));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a foto.");
      if (arquivo.current) arquivo.current.value = "";
    } finally {
      setEnviando(false);
      onEnviando?.(false);
    }
  }

  function remover() {
    setCaminho("");
    setPrevia(null);
    if (arquivo.current) arquivo.current.value = "";
  }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className={rotuloCampo}>
        Foto (opcional)
      </label>
      <input type="hidden" name="foto" value={caminho} />
      <input
        id={id}
        ref={arquivo}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={enviando}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void enviar(file);
        }}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-[#684A97] file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-[#684A97]"
      />
      {enviando && <p className="text-sm text-muted-foreground">Enviando a foto…</p>}
      {erro && (
        <p role="alert" className="text-sm text-red-700">
          {erro}
        </p>
      )}
      {caminho && !enviando && (
        <div className="flex items-center gap-3">
          {previa ? (
            // Prévia local (blob:), antes de salvar; não passa pelo otimizador.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previa} alt="Foto escolhida" className="h-16 w-16 rounded-md object-cover" />
          ) : (
            <span className="text-sm text-muted-foreground">Foto enviada</span>
          )}
          <Button type="button" size="sm" variant="outline" onClick={remover}>
            Remover foto
          </Button>
        </div>
      )}
    </div>
  );
}
