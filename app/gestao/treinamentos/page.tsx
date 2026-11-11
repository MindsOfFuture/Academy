import { listarTreinamentos, resumoTreinamentos } from "@/lib/api/gestao/treinamentos";
import { exigirMembro } from "../guard";
import { FormTreinamento } from "./form";
import { PlayerTreinamento } from "./player";

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const quando = (valor: string | null) => (valor ? dataHora.format(new Date(valor)) : "—");

export default async function TreinamentosPage() {
  const papel = await exigirMembro("/gestao/treinamentos");
  const coordenacao = papel === "coordenacao";
  const [videos, linhas] = await Promise.all([listarTreinamentos(), coordenacao ? resumoTreinamentos() : Promise.resolve([])]);
  const proximo = videos.reduce((maior, v) => Math.max(maior, v.numero), 0) + 1;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Treinamentos</h1>
        <p className="text-sm text-muted-foreground">Vídeos de formação da equipe do Minds. A coordenação acompanha quem já assistiu.</p>
      </div>
      {coordenacao && <FormTreinamento proximo={proximo} />}
      {videos.length === 0 ? (
        <p className="rounded-xl border bg-white p-6 text-center text-muted-foreground">Nenhum vídeo publicado ainda.</p>
      ) : (
        <div className="space-y-4">{videos.map((v) => <PlayerTreinamento key={v.id} video={v} />)}</div>
      )}
      {coordenacao && videos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Quem assistiu</h2>
          {videos.map((v) => {
            const doVideo = linhas.filter((l) => l.numero === v.numero);
            const abriram = doVideo.filter((l) => l.abertoEm).length;
            return (
              <div key={v.id} className="overflow-x-auto rounded-xl border bg-white">
                <p className="border-b bg-gray-50 px-4 py-3 text-sm font-semibold">Vídeo {v.numero} · {abriram} de {doVideo.length} bolsistas abriram</p>
                <table className="w-full text-left text-sm">
                  <thead className="border-b"><tr>{["Bolsista", "Abriu em", "Último acesso", "Acessos", "Viu até o fim"].map((x) => <th key={x} className="px-4 py-2 font-semibold">{x}</th>)}</tr></thead>
                  <tbody>{doVideo.map((l) => (
                    <tr key={l.email} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{l.nome}</td>
                      <td className="px-4 py-2">{l.abertoEm ? quando(l.abertoEm) : "não abriu"}</td>
                      <td className="px-4 py-2">{quando(l.ultimoAcessoEm)}</td>
                      <td className="px-4 py-2">{l.acessos}</td>
                      <td className="px-4 py-2">{l.concluidoEm ? "sim" : "não"}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {doVideo.length === 0 && <p className="p-4 text-center text-muted-foreground">Nenhum bolsista cadastrado na aba Equipe.</p>}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
