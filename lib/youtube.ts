/** Identificador de 11 caracteres de um vídeo do YouTube, a partir do link colado. */
export function youtubeId(link: string): string | null {
  const texto = link.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) return texto;
  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
