"use client";

import { useCallback, useEffect, useState } from "react";
import { GAME_KEYS, GAME_LABELS, type GameKey, type GameSessionSummaryRow } from "@/lib/api/game-telemetry-types";

type PeriodKey = "7d" | "30d" | "90d" | "tudo";

const PERIODS: { key: PeriodKey; label: string; hint: string; days: number | null }[] = [
  { key: "7d", label: "7 dias", hint: "Últimos 7 dias", days: 7 },
  { key: "30d", label: "30 dias", hint: "Últimos 30 dias", days: 30 },
  { key: "90d", label: "90 dias", hint: "Últimos 90 dias", days: 90 },
  { key: "tudo", label: "Tudo", hint: "Todo o período", days: null },
];

function rangeFor(period: PeriodKey): { from?: string; to?: string } {
  const entry = PERIODS.find((item) => item.key === period);
  if (!entry?.days) return {};
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - entry.days);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatInteger(value: number | null): string {
  return value === null || value === undefined ? "—" : value.toLocaleString("pt-BR");
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes} min ${rest}s` : `${rest}s`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function GameResearchPanel() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [game, setGame] = useState<GameKey | "todos">("todos");
  const [includeText, setIncludeText] = useState(true);
  const [summary, setSummary] = useState<GameSessionSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = rangeFor(period);
      const params = new URLSearchParams({ format: "resumo" });
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);
      const response = await fetch(`/api/games/export?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Não foi possível carregar o panorama.");
      setSummary((body.resumo ?? []) as GameSessionSummaryRow[]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Erro ao carregar o panorama.");
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  async function baixarCsv() {
    setDownloading(true);
    setFeedback(null);
    setError(null);
    try {
      const range = rangeFor(period);
      const params = new URLSearchParams({ format: "csv" });
      if (game !== "todos") params.set("game", game);
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);
      if (!includeText) params.set("texto", "false");

      const response = await fetch(`/api/games/export?${params.toString()}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Não foi possível gerar o arquivo.");
      }
      const total = response.headers.get("X-Total-Respostas");
      const blob = await response.blob();
      const stamp = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `respostas-jogos-${game}-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setFeedback(
        total && Number(total) > 50000
          ? `Arquivo gerado com as primeiras 50.000 respostas de ${Number(total).toLocaleString("pt-BR")}. Reduza o período para levar o restante.`
          : "Arquivo gerado.",
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Erro ao gerar o arquivo.");
    } finally {
      setDownloading(false);
    }
  }

  const totals = summary.reduce(
    (acc, row) => ({
      sessions: acc.sessions + row.sessions,
      answers: acc.answers + (row.answers ?? 0),
      concluidas: acc.concluidas + row.sessions_concluidas,
    }),
    { sessions: 0, answers: 0, concluidas: 0 },
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Respostas dos jogos</h2>
        <p className="mt-1 text-sm text-gray-600">
          Cada partida jogada no Academy fica registrada com o que o aluno escolheu, em que ordem e
          com que resultado. O arquivo sai em formato de planilha, com uma linha por resposta.
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <fieldset className="min-w-0">
            <legend className="text-sm font-bold text-gray-700">Período</legend>
            <div
              role="group"
              aria-label="Período do panorama"
              className="mt-2 inline-flex flex-wrap gap-1 rounded-xl bg-purple-50 p-1"
            >
              {PERIODS.map((item) => {
                const ativo = period === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPeriod(item.key)}
                    aria-pressed={ativo}
                    title={item.hint}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${
                      ativo
                        ? "bg-purple-700 text-white shadow-sm"
                        : "text-purple-800 hover:bg-purple-100"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex flex-col text-sm font-bold text-gray-700">
            Jogo
            <select
              value={game}
              onChange={(event) => setGame(event.target.value as GameKey | "todos")}
              className="mt-2 rounded-xl border border-purple-200 px-3 py-2.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="todos">Todos os jogos</option>
              {GAME_KEYS.map((key) => (
                <option key={key} value={key}>{GAME_LABELS[key]}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 pb-2.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeText}
              onChange={(event) => setIncludeText(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
            />
            Incluir o que os alunos escreveram
          </label>

          <button
            type="button"
            onClick={baixarCsv}
            disabled={downloading}
            className="rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? "Gerando…" : "Baixar planilha"}
          </button>

          <button
            type="button"
            onClick={() => void loadSummary()}
            className="rounded-xl border border-purple-300 px-4 py-2.5 text-sm font-bold text-purple-800 transition hover:bg-purple-50"
          >
            Atualizar
          </button>
        </div>

        {feedback && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{feedback}</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-gray-900">
            Panorama · {PERIODS.find((item) => item.key === period)?.hint}
          </h3>
          <p className="text-sm text-gray-600">
            {formatInteger(totals.sessions)} partidas · {formatInteger(totals.concluidas)} concluídas ·{" "}
            {formatInteger(totals.answers)} respostas
          </p>
        </div>

        {loading && <p className="mt-4 text-sm text-gray-500">Carregando…</p>}

        {!loading && summary.length === 0 && (
          <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            Nenhuma partida registrada neste período. Experimente ampliar para “Tudo”.
          </p>
        )}

        {!loading && summary.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Jogo</th>
                  <th className="py-2 pr-4">Partidas</th>
                  <th className="py-2 pr-4">Concluídas</th>
                  <th className="py-2 pr-4">Alunos</th>
                  <th className="py-2 pr-4">Respostas</th>
                  <th className="py-2 pr-4">Duração média</th>
                  <th className="py-2 pr-4">Pontuação média</th>
                  <th className="py-2">Última partida</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.game_key} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {GAME_LABELS[row.game_key] ?? row.game_key}
                    </td>
                    <td className="py-2 pr-4">{formatInteger(row.sessions)}</td>
                    <td className="py-2 pr-4">{formatInteger(row.sessions_concluidas)}</td>
                    <td className="py-2 pr-4">{formatInteger(row.students)}</td>
                    <td className="py-2 pr-4">{formatInteger(row.answers)}</td>
                    <td className="py-2 pr-4">{formatDuration(row.media_duracao_segundos)}</td>
                    <td className="py-2 pr-4">
                      {row.media_pontuacao === null ? "—" : Number(row.media_pontuacao).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2">{formatDate(row.ultima_partida)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
