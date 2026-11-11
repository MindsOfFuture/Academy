"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoTreinamento } from "@/lib/api/gestao/treinamentos";
import { registrarTreinamentoAction } from "./actions";

const ORIGEM = "https://www.youtube-nocookie.com";

/**
 * Vídeo fechado até a pessoa tocar em "Assistir": o toque registra que ela abriu.
 * O fim do vídeo chega pelas mensagens do próprio player do YouTube (estado 0).
 */
export function PlayerTreinamento({ video }: { video: VideoTreinamento }) {
  const [aberto, setAberto] = useState(false);
  const [concluido, setConcluido] = useState(video.concluido);
  const quadro = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!aberto || concluido) return;
    function ouvir(evento: MessageEvent) {
      if (evento.origin !== ORIGEM || evento.source !== quadro.current?.contentWindow) return;
      let dados: { info?: { playerState?: number } };
      try {
        dados = typeof evento.data === "string" ? JSON.parse(evento.data) : evento.data;
      } catch {
        return;
      }
      if (dados?.info?.playerState === 0) {
        setConcluido(true);
        void registrarTreinamentoAction(video.id, true);
      }
    }
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, [aberto, concluido, video.id]);

  function abrir() {
    setAberto(true);
    void registrarTreinamentoAction(video.id, false);
  }

  function avisarPlayer() {
    quadro.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: video.id, channel: "widget" }), ORIGEM);
  }

  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="font-semibold"><span className="text-[#684A97]">Vídeo {video.numero}</span> · {video.titulo}</h2>
        {concluido && <span className="rounded-full bg-[#684A97] px-3 py-1 text-xs font-semibold text-white">Assistido</span>}
      </div>
      {aberto ? (
        <div className="aspect-video bg-black">
          <iframe
            ref={quadro}
            onLoad={avisarPlayer}
            src={`${ORIGEM}/embed/${video.youtubeId}?enablejsapi=1&rel=0&autoplay=1&origin=${encodeURIComponent(window.location.origin)}`}
            title={`Vídeo ${video.numero}: ${video.titulo}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="p-4">
          <button type="button" onClick={abrir} className="rounded-lg bg-[#684A97] px-4 py-2 text-sm font-semibold text-white">Assistir</button>
        </div>
      )}
    </article>
  );
}
