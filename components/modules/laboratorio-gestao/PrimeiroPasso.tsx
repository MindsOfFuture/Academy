"use client";

import { useEffect, useMemo, useState } from "react";
import { APP, ETAPAS, FECHAMENTO, STORAGE_KEY, type Etapa, type Pergunta } from "./data";

type AnswerData = Record<string, string | string[] | number | boolean> & { __ok?: boolean };
type Answers = Record<string, AnswerData>;
type View = "cover" | "journey" | "stage" | "result" | "plan";

function loadAnswers(): Answers {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

function parseNumber(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PrimeiroPasso() {
  const [answers, setAnswers] = useState<Answers>({});
  const [view, setView] = useState<View>("cover");
  const [activeId, setActiveId] = useState(1);

  useEffect(() => setAnswers(loadAnswers()), []);

  const completed = useMemo(
    () => ETAPAS.filter((stage) => Boolean(answers[String(stage.id)]?.__ok)).length,
    [answers],
  );
  const active = ETAPAS.find((stage) => stage.id === activeId) ?? ETAPAS[0];

  function save(next: Answers) {
    setAnswers(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // A jornada continua sem persistência quando o navegador a bloqueia.
    }
  }

  function patchStage(id: number, key: string, value: string | string[] | number) {
    const stageKey = String(id);
    save({ ...answers, [stageKey]: { ...(answers[stageKey] ?? {}), [key]: value } });
  }

  function openStage(id: number) {
    setActiveId(id);
    setView("stage");
  }

  function completeStage(stage: Etapa) {
    const data = answers[String(stage.id)] ?? {};
    const missing = stage.perguntas.find(
      (question) => question.obrigatorio && parseNumber(data[question.id]) === null,
    );
    if (missing) {
      window.alert(`Preencha: ${missing.p}`);
      return;
    }
    save({ ...answers, [String(stage.id)]: { ...data, __ok: true } });
    setView("result");
  }

  function reset() {
    if (!window.confirm("Apagar suas respostas e recomeçar?")) return;
    setAnswers({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Sem ação adicional quando o armazenamento não está disponível.
    }
    setView("cover");
  }

  return (
    <section className="mx-auto min-w-0 max-w-5xl overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-lg">
      {view === "cover" && (
        <div className="grid min-h-[520px] place-items-center bg-gradient-to-br from-purple-800 to-purple-950 p-6 text-center text-white sm:p-12">
          <div className="max-w-xl">
            <span className="text-6xl" aria-hidden="true">💡</span>
            <h2 className="mt-5 text-4xl font-bold sm:text-5xl">{APP.nome}</h2>
            <p className="mt-2 text-lg font-semibold text-amber-300">{APP.tagline}</p>
            <p className="mt-5 text-purple-100">Dez etapas curtas para organizar sua ideia e dar o primeiro passo com mais segurança.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => setView("journey")} className="rounded-xl bg-amber-300 px-6 py-3 font-bold text-purple-950">
                {completed ? "Continuar" : "Começar"}
              </button>
              {completed > 0 && <button type="button" onClick={reset} className="rounded-xl border border-white/40 px-6 py-3 font-bold text-white">Recomeçar do zero</button>}
            </div>
            {completed > 0 && <p className="mt-5 text-sm font-semibold">{completed} de 10 etapas concluídas</p>}
          </div>
        </div>
      )}

      {view === "journey" && (
        <div>
          <JourneyHeader completed={completed} onBack={() => setView("cover")} />
          <div className="p-5 sm:p-8">
            {completed === 10 && <button type="button" onClick={() => setView("plan")} className="mb-5 w-full rounded-xl bg-purple-700 px-5 py-3 font-bold text-white">Ver meu plano ✨</button>}
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Todas as etapas</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {ETAPAS.map((stage) => {
                const done = Boolean(answers[String(stage.id)]?.__ok);
                return (
                  <button key={stage.id} type="button" onClick={() => openStage(stage.id)} className="flex min-w-0 items-start gap-3 rounded-2xl border border-gray-200 p-4 text-left transition hover:border-purple-300 hover:shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-white" style={{ backgroundColor: stage.cor }}>{done ? "✓" : stage.icone}</span>
                    <span className="min-w-0"><strong className="block text-gray-900">{stage.id}. {stage.titulo}</strong><span className="mt-1 block text-sm text-gray-600">{stage.resumo}</span></span>
                  </button>
                );
              })}
            </div>
            {completed > 0 && completed < 10 && <button type="button" onClick={() => setView("plan")} className="mt-6 rounded-xl border border-purple-300 px-5 py-3 font-bold text-purple-800">Ver meu plano parcial</button>}
            <p className="mt-7 rounded-xl bg-amber-50 p-4 text-sm text-gray-700">{APP.aviso}</p>
          </div>
        </div>
      )}

      {view === "stage" && (
        <div>
          <StageHeader stage={active} label={`etapa ${active.id} de 10 · ${active.grupo}`} onBack={() => setView("journey")} />
          <div className="p-5 sm:p-8">
            <p className="rounded-xl bg-purple-50 p-4 text-gray-700">{active.intro}</p>
            <div className="mt-6 space-y-6">
              {active.perguntas.map((question) => (
                <Field key={question.id} question={question} value={answers[String(active.id)]?.[question.id]} onChange={(value) => patchStage(active.id, question.id, value)} />
              ))}
            </div>
            <button type="button" onClick={() => completeStage(active)} className="mt-8 rounded-xl bg-[#E8473A] px-6 py-3 font-bold text-white">
              {active.calculo ? "Ver a estimativa" : "Ver o resultado"}
            </button>
          </div>
        </div>
      )}

      {view === "result" && (
        <StageResult stage={active} data={answers[String(active.id)] ?? {}} onJourney={() => setView("journey")} onNext={() => { const next = ETAPAS.find((stage) => stage.id > active.id); if (next) openStage(next.id); else setView("plan"); }} />
      )}

      {view === "plan" && (
        <Plan answers={answers} completed={completed} onBack={() => setView("journey")} />
      )}
    </section>
  );
}

function JourneyHeader({ completed, onBack }: { completed: number; onBack: () => void }) {
  return <header className="bg-purple-800 p-5 text-white sm:p-8"><button type="button" onClick={onBack} className="text-sm font-bold">← início</button><p className="mt-4 text-sm font-bold uppercase tracking-wider text-amber-300">sua jornada</p><h2 className="mt-1 text-3xl font-bold">{completed === 10 ? "Você chegou ao fim 🎉" : "Dez etapas, uma de cada vez"}</h2><div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-amber-300" style={{ width: `${completed * 10}%` }} /></div><p className="mt-2 text-sm font-semibold">{completed} de 10 concluídas</p></header>;
}

function StageHeader({ stage, label, onBack }: { stage: Etapa; label: string; onBack: () => void }) {
  return <header className="p-5 text-white sm:p-8" style={{ backgroundColor: stage.cor }}><button type="button" onClick={onBack} className="text-sm font-bold">← jornada</button><p className="mt-4 text-sm font-bold uppercase tracking-wider">{label}</p><h2 className="mt-1 text-3xl font-bold">{stage.icone} {stage.titulo}</h2></header>;
}

function Field({ question, value, onChange }: { question: Pergunta; value: unknown; onChange: (value: string | string[] | number) => void }) {
  if (question.tipo === "escala") return <fieldset><legend className="font-bold text-gray-900">{question.p}</legend><p className="mt-1 text-sm text-gray-500">{question.ajuda}</p><div className="mt-3 flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" aria-label={`Nota ${score} de 5`} onClick={() => onChange(score)} className={`h-11 w-11 rounded-full border-2 font-bold ${value === score ? "border-purple-600 bg-purple-600 text-white" : "border-gray-300"}`}>{score}</button>)}</div></fieldset>;
  if (question.tipo === "escolha" || question.tipo === "multi") {
    const multiValues = Array.isArray(value) ? value : [];
    return <fieldset><legend className="font-bold text-gray-900">{question.p}</legend><p className="mt-1 text-sm text-gray-500">{question.ajuda}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.opcoes?.map((option) => { const active = question.tipo === "multi" ? multiValues.includes(option) : value === option; return <button key={option} type="button" aria-pressed={active} onClick={() => { if (question.tipo === "multi") onChange(active ? multiValues.filter((item) => item !== option) : [...multiValues, option]); else onChange(option); }} className={`rounded-xl border-2 p-3 text-left font-semibold ${active ? "border-purple-600 bg-purple-50" : "border-gray-200"}`}>{option}</button>; })}</div></fieldset>;
  }
  return <label className="block font-bold text-gray-900">{question.p}<span className="mt-1 block text-sm font-normal text-gray-500">{question.ajuda}</span><input aria-label={question.p} inputMode={question.tipo === "numero" ? "decimal" : "text"} value={typeof value === "string" || typeof value === "number" ? value : ""} placeholder={question.placeholder} onChange={(event) => onChange(event.target.value)} className="mt-3 block w-full rounded-xl border border-gray-300 px-4 py-3 font-normal" /></label>;
}

function StageResult({ stage, data, onJourney, onNext }: { stage: Etapa; data: AnswerData; onJourney: () => void; onNext: () => void }) {
  let estimate: React.ReactNode = null;
  if (stage.calculo === "preco") { const cost = parseNumber(data.custo); const margin = parseNumber(data.margem); if (cost !== null && margin !== null) estimate = <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: stage.cor }}><span className="text-sm font-bold">preço estimado por unidade</span><strong className="mt-1 block text-3xl">{brl(cost * (1 + margin / 100))}</strong></div>; }
  if (stage.calculo === "caixa") { const investment = parseNumber(data.investimento); const monthly = parseNumber(data.gasto_mes); if (investment !== null && monthly !== null) estimate = <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: stage.cor }}><span className="text-sm font-bold">para abrir e aguentar 3 meses</span><strong className="mt-1 block text-3xl">{brl(investment + monthly * 3)}</strong></div>; }
  return <div><StageHeader stage={stage} label={`etapa ${stage.id} · resultado`} onBack={onJourney} /><div className="space-y-4 p-5 sm:p-8">{estimate}{stage.resposta.titulo && <h3 className="text-2xl font-bold text-gray-900">{stage.resposta.titulo}</h3>}{stage.resposta.texto && <p className="text-gray-700">{stage.resposta.texto}</p>}<div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4"><strong>⚠️ Atenção</strong><p className="mt-1">{stage.resposta.alerta}</p></div><div className="rounded-xl border-l-4 border-purple-600 bg-purple-50 p-4"><strong>👉 Próximo passo</strong><p className="mt-1">{stage.resposta.proximo}</p></div>{stage.resposta.encaminha && <div className="rounded-xl bg-blue-50 p-4"><strong>Onde confirmar</strong><p>{stage.resposta.encaminha.texto} {stage.resposta.encaminha.fonte}</p></div>}<div className="flex flex-wrap gap-3"><button type="button" onClick={onNext} className="rounded-xl bg-purple-700 px-5 py-3 font-bold text-white">{stage.id === 10 ? "Ver meu plano ✨" : "Próxima etapa"}</button><button type="button" onClick={onJourney} className="rounded-xl border border-purple-300 px-5 py-3 font-bold text-purple-800">Voltar à jornada</button></div></div></div>;
}

function Plan({ answers, completed, onBack }: { answers: Answers; completed: number; onBack: () => void }) {
  const d1 = answers["1"] ?? {}; const d2 = answers["2"] ?? {}; const d5 = answers["5"] ?? {}; const d6 = answers["6"] ?? {}; const d10 = answers["10"] ?? {};
  const phrase = String(d10.frase ?? d1.oque ?? "");
  const cost = parseNumber(d5.custo); const margin = parseNumber(d5.margem); const investment = parseNumber(d6.investimento); const monthly = parseNumber(d6.gasto_mes);
  return <div><header className="bg-purple-800 p-5 text-white sm:p-8"><button type="button" onClick={onBack} className="text-sm font-bold">← jornada</button><p className="mt-4 text-sm font-bold uppercase tracking-wider text-amber-300">seu resumo</p><h2 className="mt-1 text-3xl font-bold">✨ Meu plano</h2></header><div className="space-y-6 p-5 sm:p-8"><p className="rounded-xl bg-purple-50 p-4">{completed === 10 ? FECHAMENTO.completo : FECHAMENTO.parcial}</p>{phrase && <div className="rounded-2xl bg-purple-800 p-5 text-white"><span className="text-sm font-bold text-amber-300">meu negócio</span><p className="mt-2 text-2xl font-bold">“{phrase}”</p>{d2.publico && <p className="mt-2">para {String(d2.publico).toLowerCase()}</p>}</div>}{((cost !== null && margin !== null) || (investment !== null && monthly !== null)) && <div className="grid gap-3 sm:grid-cols-2">{cost !== null && margin !== null && <MoneyCard value={brl(cost * (1 + margin / 100))} label="preço estimado" />}{investment !== null && monthly !== null && <MoneyCard value={brl(investment + monthly * 3)} label="para abrir e ter fôlego" />}</div>}<section><h3 className="text-lg font-bold text-gray-900">Seus próximos passos</h3><div className="mt-3 space-y-3">{ETAPAS.filter((stage) => answers[String(stage.id)]?.__ok).map((stage) => <div key={stage.id} className="rounded-xl border border-gray-200 p-4"><strong>{stage.titulo}</strong><p className="mt-1 text-gray-700">{stage.resposta.proximo}</p></div>)}</div></section>{d10.prioridade && <div className="rounded-xl bg-amber-50 p-4"><strong>🎯 Sua prioridade</strong><p>{String(d10.prioridade)}</p></div>}<p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">{APP.aviso}</p><div className="flex flex-wrap gap-3"><button type="button" onClick={() => globalThis.print()} className="rounded-xl bg-purple-700 px-5 py-3 font-bold text-white">Salvar / imprimir 🖨️</button><button type="button" onClick={onBack} className="rounded-xl border border-purple-300 px-5 py-3 font-bold text-purple-800">Voltar à jornada</button></div></div></div>;
}

function MoneyCard({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-purple-50 p-4"><strong className="block text-xl text-purple-900">{value}</strong><span className="text-sm text-gray-600">{label}</span></div>; }
