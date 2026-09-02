"use client";

import { useEffect, useMemo, useState } from "react";
import { BLOCOS, CENARIOS, type OpcaoCenario } from "./data";

const STORAGE_KEY = "academy-cidadania-financeira-v1";

type Answer = { scenarioId: number; type: OpcaoCenario["type"]; points: number };
type SavedState = { completedBlocks: number[] };

function readSaved(userId: string): SavedState {
  if (typeof window === "undefined") return { completedBlocks: [] };
  try {
    return JSON.parse(window.localStorage.getItem(`${STORAGE_KEY}:${userId}`) ?? "null") ?? { completedBlocks: [] };
  } catch {
    return { completedBlocks: [] };
  }
}

export default function CidadaniaFinanceiraGame({ userId }: { userId: string }) {
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([]);
  const [blockId, setBlockId] = useState<number | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState(false);

  useEffect(() => setCompletedBlocks(readSaved(userId).completedBlocks), [userId]);

  const block = BLOCOS.find((item) => item.id === blockId);
  const scenarios = useMemo(
    () => CENARIOS.filter((item) => item.block === blockId),
    [blockId],
  );
  const scenario = scenarios[scenarioIndex];
  const score = answers.reduce((sum, answer) => sum + answer.points, 0);

  function persist(next: number[]) {
    setCompletedBlocks(next);
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify({ completedBlocks: next }));
    } catch {
      // O progresso local é opcional quando o navegador bloqueia armazenamento.
    }
  }

  function start(nextBlockId: number) {
    setBlockId(nextBlockId);
    setScenarioIndex(0);
    setAnswers([]);
    setSelected(null);
    setResult(false);
  }

  function choose(optionIndex: number) {
    if (selected !== null || !scenario) return;
    const option = scenario.options[optionIndex];
    setSelected(optionIndex);
    setAnswers((current) => [
      ...current,
      { scenarioId: scenario.id, type: option.type, points: option.points },
    ]);
  }

  function next() {
    if (scenarioIndex + 1 >= scenarios.length) {
      setResult(true);
      if (blockId !== null && !completedBlocks.includes(blockId)) {
        persist([...completedBlocks, blockId]);
      }
      return;
    }
    setScenarioIndex((current) => current + 1);
    setSelected(null);
  }

  function menu() {
    setBlockId(null);
    setResult(false);
    setSelected(null);
  }

  if (blockId === null || !block) {
    return (
      <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-purple-900">Escolha seu papel</h2>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">
            Tome decisões reais sobre finanças pessoais, serviços públicos, macroeconomia e Estado.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-purple-100 px-5 py-2 font-bold text-purple-800">
            <span className="text-2xl">{CENARIOS.length}</span>
            <span className="ml-2 self-center text-sm">cenários</span>
          </div>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {BLOCOS.map((item) => {
            const count = CENARIOS.filter((scenarioItem) => scenarioItem.block === item.id).length;
            const done = completedBlocks.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => start(item.id)}
                className="min-w-0 rounded-2xl border-2 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                style={{ borderColor: item.color }}
                aria-label={`${item.name}: ${count} questões${done ? ", concluído" : ""}`}
              >
                <span className="text-3xl" aria-hidden="true">{item.emoji}</span>
                <span className="mt-2 block text-xl font-bold text-gray-900">{item.name}</span>
                <span className="block text-sm text-gray-600">{item.subtitle}</span>
                <span className="mt-3 block text-sm font-bold text-purple-700">
                  {count} questões · {done ? "Jogar novamente" : "Assumir papel"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (result) {
    const correct = answers.filter((answer) => answer.type === "correct").length;
    const pct = Math.round((score / (scenarios.length * 10)) * 100);
    const rank = pct >= 90 ? "Mestre" : pct >= 70 ? "Especialista" : pct >= 50 ? "Praticante" : "Em aprendizado";
    return (
      <section className="rounded-3xl border border-purple-100 bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="text-5xl" aria-hidden="true">🏆</span>
        <h2 className="mt-3 text-3xl font-bold text-purple-900">{rank} ({block.name})</h2>
        <p className="mt-3 text-gray-600">Você concluiu este papel com {score} de {scenarios.length * 10} pontos.</p>
        <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-3">
          <Stat value={correct} label="Decisões ideais" />
          <Stat value={answers.filter((a) => a.type === "partial").length} label="Parciais" />
          <Stat value={answers.filter((a) => a.type === "wrong").length} label="Erros" />
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={menu} className="rounded-xl bg-purple-700 px-5 py-3 font-bold text-white">Menu de papéis</button>
          <button type="button" onClick={() => start(block.id)} className="rounded-xl border border-purple-300 px-5 py-3 font-bold text-purple-800">Tentar novamente</button>
        </div>
      </section>
    );
  }

  if (!scenario) return null;
  const selectedOption = selected === null ? null : scenario.options[selected];
  const progress = Math.round(((scenarioIndex + (selected === null ? 0 : 1)) / scenarios.length) * 100);

  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-900 px-4 py-4 text-white sm:px-6">
        <button type="button" onClick={menu} className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-white/10">← Menu</button>
        <div className="text-center">
          <p className="font-bold">{block.emoji} {block.name}</p>
          <p className="text-sm text-purple-200">Questão {scenarioIndex + 1} de {scenarios.length}</p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-2 text-sm font-bold" data-testid="cidadania-score">⭐ {score}</div>
      </div>
      <div className="h-2 bg-purple-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-amber-300 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wider" style={{ color: block.color }}>{scenario.subtitle}</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{scenario.title}</h2>
        <div className="mt-5 rounded-2xl bg-purple-50 p-4 leading-relaxed text-gray-800 sm:p-5">
          <strong className="block text-purple-900">Contexto da decisão</strong>
          {scenario.context}
        </div>
        <fieldset className="mt-6 min-w-0 space-y-3">
          <legend className="mb-3 font-bold text-gray-900">Qual é a sua decisão?</legend>
          {scenario.options.map((option, index) => (
            <button
              key={option.origLabel}
              type="button"
              disabled={selected !== null}
              onClick={() => choose(index)}
              aria-label={`Opção ${option.origLabel}: ${option.text}`}
              className={`flex w-full min-w-0 items-start gap-3 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${selected === index ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"} disabled:cursor-default`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-800">{option.origLabel}</span>
              <span className="min-w-0 break-words">{option.text}</span>
            </button>
          ))}
        </fieldset>
        {selectedOption && (
          <div role="alert" className={`mt-6 rounded-2xl border-l-4 p-5 ${selectedOption.type === "correct" ? "border-green-500 bg-green-50" : selectedOption.type === "partial" ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"}`}>
            <h3 className="font-bold">
              {selectedOption.type === "correct" ? "✅ Decisão Correta!" : selectedOption.type === "partial" ? "⚠️ Quase lá!" : "❌ Decisão Equivocada"}
            </h3>
            <p className="mt-2 leading-relaxed">{selectedOption.feedback}</p>
            <button type="button" onClick={next} className="mt-4 rounded-xl bg-purple-700 px-5 py-3 font-bold text-white">
              {scenarioIndex + 1 === scenarios.length ? "Ver resultado do papel" : "Próxima Questão"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-purple-50 p-3">
      <strong className="block text-2xl text-purple-800">{value}</strong>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
