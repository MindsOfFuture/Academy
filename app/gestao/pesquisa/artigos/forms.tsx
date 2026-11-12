"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ArtigoGestao, EstadoAcao } from "@/lib/api/gestao/types";
import { Aviso, campoSelect, rotuloCampo } from "../../equipe/forms";
import { separarMetadados } from "@/lib/utils/artigo-metadados";
import { salvarArtigoAction } from "./actions";

const areaTexto =
  "flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function FormArtigo({ artigo }: { artigo: ArtigoGestao | null }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao | null, FormData>(salvarArtigoAction, null);
  const { corpo, metadados } = separarMetadados(artigo?.conteudo ?? "");
  return (
    <form action={acao} className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
      <input type="hidden" name="id" value={artigo?.id ?? ""} />
      <label className="block space-y-1">
        <span className={rotuloCampo}>Título</span>
        <Input name="titulo" required maxLength={200} defaultValue={artigo?.titulo} />
      </label>
      <label className="block space-y-1">
        <span className={rotuloCampo}>Resumo</span>
        <textarea name="resumo" rows={3} maxLength={500} className={areaTexto} defaultValue={artigo?.resumo ?? ""} />
      </label>
      <label className="block space-y-1">
        <span className={rotuloCampo}>Conteúdo</span>
        <textarea name="conteudo" rows={20} className={areaTexto} defaultValue={corpo} />
      </label>
      <fieldset className="space-y-3 rounded-md border p-3">
        <legend className={`${rotuloCampo} px-1`}>Informações da Publicação</legend>
        {(
          [
            ["autores", "Autores", "text"],
            ["publicadoEm", "Publicado em", "text"],
            ["doi", "DOI", "url"],
            ["palavrasChave", "Palavras-chave", "text"],
            ["link", "Link", "url"],
          ] as const
        ).map(([nome, rotulo, tipo]) => (
          <label key={nome} className="block space-y-1">
            <span className={rotuloCampo}>{rotulo}</span>
            <Input name={nome} type={tipo} maxLength={500} defaultValue={metadados[nome] ?? ""} />
          </label>
        ))}
      </fieldset>
      <div className="space-y-1">
        <label htmlFor="capa-artigo" className={rotuloCampo}>
          Capa
        </label>
        {artigo?.capaUrl && (
          <Image src={artigo.capaUrl} alt="Capa atual" width={320} height={180} className="rounded-md object-cover" />
        )}
        <Input id="capa-artigo" name="capa" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <label className="block space-y-1 sm:w-60">
        <span className={rotuloCampo}>Status</span>
        <select name="status" className={campoSelect} defaultValue={artigo?.status ?? "draft"}>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
        {artigo?.status === "published" && (
          <Link href={`/artigos?slug=${encodeURIComponent(artigo.slug)}`} className="text-sm text-[#684A97] hover:underline">
            Ver no site
          </Link>
        )}
      </div>
      <Aviso estado={estado} />
    </form>
  );
}
