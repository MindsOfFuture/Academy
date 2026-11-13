import { mascararCpf } from "@/lib/cpf";
import { resumoTestes } from "@/lib/api/gestao/testes";
import { exigirMembro } from "../guard";

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function TestesPage() {
  await exigirMembro("/gestao/testes", "coordenacao");
  const linhas = await resumoTestes();
  const totais = [
    ["Pessoas que acessaram", linhas.length],
    ["Abriram ao menos um módulo", linhas.filter((r) => r.modulosAbertos > 0).length],
    ["Concluíram a jornada", linhas.filter((r) => r.jornadaConcluida).length],
    ["Total de acessos", linhas.reduce((total, r) => total + r.acessos, 0)],
  ] as const;
  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Testes do Laboratório de Gestão</h1><a href="/gestao/testes/csv" className="rounded-lg bg-[#684A97] px-4 py-2 text-sm font-semibold text-white">Baixar planilha</a></div>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{totais.map(([rotulo, valor]) => <article key={rotulo} className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-sm text-muted-foreground">{rotulo}</p><p className="mt-1 text-3xl font-bold text-[#684A97]">{valor}</p></article>)}</section>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="border-b bg-gray-50"><tr>{["Nome", "CPF", "Acessos", "Último acesso", "Módulos abertos", "Módulos concluídos", "Jornada concluída"].map((x) => <th key={x} className="px-4 py-3 font-semibold">{x}</th>)}</tr></thead>
      <tbody>{linhas.map((r) => <tr key={r.userId} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{r.nome}</td><td className="px-4 py-3">{r.cpf ? mascararCpf(r.cpf) : "—"}</td><td className="px-4 py-3">{r.acessos}</td><td className="px-4 py-3">{dataHora.format(new Date(r.ultimoAcessoEm))}</td><td className="px-4 py-3">{r.modulosAbertos}</td><td className="px-4 py-3">{r.modulosConcluidos} de 10</td><td className="px-4 py-3">{r.jornadaConcluida ? "sim" : "não"}</td></tr>)}</tbody></table>
      {linhas.length === 0 && <p className="p-6 text-center text-muted-foreground">Nenhuma participação ainda.</p>}</div>
  </div>;
}
