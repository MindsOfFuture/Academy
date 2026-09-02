"use client";

import { useEffect, useState } from "react";
import { brl, calcExtrato, diagnosticar, lookupSalario } from "./calculations";
import {
  ESTADO_INICIAL,
  SESSOES_STORAGE_KEY,
  type GameState,
  type PetKey,
  type StreamingKey,
  type LazerKey,
} from "./data";

const STAGE_DECISIONS = [2, 1, 3, 2, 3, 1, 1, 1, 0];

type SavedSession = {
  nome: string;
  profissao: string;
  perfil: string;
  saldo: number;
  data: string;
};

function loadSessions(userId: string): SavedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(`${SESSOES_STORAGE_KEY}:${userId}`) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function FinancityGame({ userId }: { userId: string }) {
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState(0);
  const [game, setGame] = useState<GameState>({ ...ESTADO_INICIAL });
  const [finished, setFinished] = useState(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useEffect(() => setSessions(loadSessions(userId)), [userId]);

  const update = (patch: Partial<GameState>) => setGame((current) => ({ ...current, ...patch }));
  const answered = STAGE_DECISIONS.slice(0, stage).reduce((sum, value) => sum + value, 0);

  function next() {
    setStage((current) => current + 1);
  }

  function finish() {
    const extrato = calcExtrato(game);
    const perfil = diagnosticar(game, extrato);
    const nextSessions = [
      ...loadSessions(userId),
      { nome: game.nome, profissao: game.profissao, perfil: perfil.titulo, saldo: extrato.saldo, data: new Date().toISOString() },
    ];
    try {
      window.localStorage.setItem(
        `${SESSOES_STORAGE_KEY}:${userId}`,
        JSON.stringify(nextSessions),
      );
      setSessions(nextSessions);
    } catch {
      // A partida continua mesmo quando o armazenamento do navegador está bloqueado.
    }
    setFinished(true);
  }

  function restart() {
    setGame({ ...ESTADO_INICIAL });
    setStage(0);
    setFinished(false);
    setStarted(true);
  }

  if (!started) {
    return (
      <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-widest text-[#E8473A]">Educação Financeira</p>
        <h2 className="mt-3 text-3xl font-bold text-purple-900 sm:text-4xl">Simule uma vida. Descubra um perfil financeiro.</h2>
        <p className="mt-4 max-w-2xl text-gray-600">
          Escolha profissão, família, moradia, consumo e reserva. As 14 decisões formam um orçamento e um diagnóstico entre quatro perfis.
        </p>
        <div className="mt-6 grid max-w-xl grid-cols-3 gap-3 text-center">
          <Stat value="14" label="decisões" />
          <Stat value="6" label="temas" />
          <Stat value="4" label="perfis" />
        </div>
        <button type="button" onClick={() => setStarted(true)} className="mt-8 rounded-xl bg-purple-700 px-6 py-3 font-bold text-white hover:bg-purple-800">
          Iniciar Nova Sessão
        </button>
        {sessions.length > 0 && (
          <div className="mt-8 max-w-xl rounded-2xl border border-purple-100 p-4">
            <h3 className="font-bold text-purple-900">Sessões recentes</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {sessions.slice(-3).reverse().map((session) => (
                <li key={`${session.data}-${session.nome}`} className="flex flex-wrap justify-between gap-2">
                  <span><strong>{session.nome}</strong> · {session.profissao}</span>
                  <span>{session.perfil} · {brl(session.saldo)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  if (finished) {
    const extrato = calcExtrato(game);
    const perfil = diagnosticar(game, extrato);
    return (
      <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Diagnóstico Financeiro</p>
        <h2 className="mt-2 text-4xl font-bold text-purple-800" data-testid="financity-perfil">{perfil.titulo}</h2>
        <p className="mt-3 max-w-2xl text-gray-700">{perfil.descricao}</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <MoneyStat label="Salário líquido" value={extrato.salarioLiquido} />
          <MoneyStat label="Despesas de consumo" value={extrato.totalDespesas} />
          <MoneyStat label="Saldo mensal" value={extrato.saldo} />
        </div>
        <div className="mt-7 overflow-x-auto rounded-2xl border border-gray-200 p-5">
          <h3 className="text-xl font-bold text-gray-900">Extrato completo · {game.nome}</h3>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Profissão" value={game.profissao} />
            <Row label="Regime" value={game.regime ?? "—"} />
            <Row label="Salário bruto" value={brl(extrato.salarioBruto)} />
            {extrato.inss > 0 && <Row label="INSS" value={`− ${brl(extrato.inss)}`} />}
            <Row label={game.regime === "PJ" ? "DAS mensal" : "IRRF mensal"} value={`− ${brl(extrato.impostoRendaMensal)}`} />
            {extrato.rendaExtra > 0 && <Row label="Renda do cônjuge" value={brl(extrato.rendaExtra)} />}
            {extrato.valeRefeicao > 0 && <Row label="Vale-refeição" value={brl(extrato.valeRefeicao)} />}
            <Row label="Família e pets" value={`− ${brl(extrato.despesasFamilia)}`} />
            <Row label="Moradia" value={`− ${brl(extrato.despesasMoradia)}`} />
            <Row label="Transporte" value={`− ${brl(extrato.despesasTransporte)}`} />
            <Row label="Assinaturas" value={`− ${brl(extrato.despesasStreaming)}`} />
            <Row label="Alimentação" value={`− ${brl(extrato.despesasAlimentacao)}`} />
            <Row label="Lazer" value={`− ${brl(extrato.despesasLazer)}`} />
            {extrato.despesasSeguro > 0 && <Row label="Seguro" value={`− ${brl(extrato.despesasSeguro)}`} />}
            <Row label="Reserva mensal" value={brl(extrato.reservaMensal)} />
          </dl>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => window.print()} className="rounded-xl border border-purple-300 px-5 py-3 font-bold text-purple-800">Imprimir extrato</button>
          <button type="button" onClick={restart} className="rounded-xl bg-purple-700 px-5 py-3 font-bold text-white">Nova sessão</button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
      <div className="bg-purple-900 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-4 text-sm font-bold">
          <span>{Math.min(answered + 1, 14)} de 14 decisões</span>
          <span>{Math.round((answered / 14) * 100)}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"
          role="progressbar"
          aria-label="Progresso das decisões"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={14}
          aria-valuetext={`${answered} de 14 decisões concluídas`}
        >
          <div className="h-full bg-amber-300" style={{ width: `${(answered / 14) * 100}%` }} />
        </div>
      </div>
      <div className="mx-auto max-w-4xl p-5 sm:p-8">{renderStage(stage, game, update, next, finish)}</div>
    </section>
  );
}

function renderStage(
  stage: number,
  game: GameState,
  update: (patch: Partial<GameState>) => void,
  next: () => void,
  finish: () => void,
) {
  if (stage === 0) {
    return <Stage title="Você no futuro" subtitle="Comece pela profissão que sustentará suas escolhas.">
      <label className="block font-bold text-gray-800">Nome<input aria-label="Nome" value={game.nome} onChange={(event) => update({ nome: event.target.value })} className="mt-2 block w-full rounded-xl border border-gray-300 px-4 py-3 font-normal" /></label>
      <label className="mt-4 block font-bold text-gray-800">Profissão<input aria-label="Profissão" value={game.profissao} onChange={(event) => { const found = lookupSalario(event.target.value); update({ profissao: event.target.value, salarioBruto: found.salario, profissaoReconhecida: found.reconhecida }); }} className="mt-2 block w-full rounded-xl border border-gray-300 px-4 py-3 font-normal" /></label>
      {game.profissao && <p className="mt-3 rounded-xl bg-purple-50 p-3 text-sm">Salário bruto estimado: <strong>{brl(game.salarioBruto)}</strong></p>}
      <Continue onClick={next} disabled={!game.nome || !game.profissao} />
    </Stage>;
  }
  if (stage === 1) return <Stage title="Forma de trabalho"><Options options={[{ label: "CLT — carteira assinada", value: "CLT" }, { label: "PJ — pessoa jurídica", value: "PJ" }]} selected={game.regime} onSelect={(regime) => update({ regime: regime as GameState["regime"] })} /><Continue onClick={next} disabled={!game.regime} /></Stage>;
  if (stage === 2) return <Stage title="Família"><Options options={[{ label: "Solteiro(a)", value: "solteiro" }, { label: "Casado(a)", value: "casado" }]} selected={game.estadoCivil} onSelect={(estadoCivil) => update({ estadoCivil: estadoCivil as GameState["estadoCivil"] })} /><h3 className="mt-6 font-bold">Filhos</h3><Options options={["0", "1", "2", "3+"].map((v) => ({ label: v, value: v }))} selected={game.filhos} onSelect={(filhos) => update({ filhos: filhos as GameState["filhos"] })} /><h3 className="mt-6 font-bold">Pets (quantidade por tipo)</h3><PetCounters selected={game.pets} onChange={(pets) => update({ pets })} /><Continue onClick={next} disabled={!game.estadoCivil || !game.filhos} /></Stage>;
  if (stage === 3) return <Stage title="Moradia"><Options options={[{ label: "Apartamento", value: "apartamento" }, { label: "Casa", value: "casa" }, { label: "Mansão", value: "mansao" }, { label: "Sítio", value: "sitio" }]} selected={game.imovel} onSelect={(imovel) => update({ imovel: imovel as GameState["imovel"] })} /><h3 className="mt-6 font-bold">Como será o imóvel?</h3><Options options={[{ label: "Alugada", value: "alugada" }, { label: "Financiada", value: "financiada" }, { label: "Própria (quitada)", value: "propria" }]} selected={game.aquisicao} onSelect={(aquisicao) => update({ aquisicao: aquisicao as GameState["aquisicao"] })} /><Continue onClick={next} disabled={!game.imovel || !game.aquisicao} /></Stage>;
  if (stage === 4) return <Stage title="Estilo de vida"><h3 className="font-bold">Transporte</h3><Options options={[{ label: "Carro", value: "carro" }, { label: "Moto", value: "moto" }, { label: "Bicicleta", value: "bicicleta" }, { label: "Transporte público", value: "publico" }]} selected={game.transporte} onSelect={(transporte) => update({ transporte: transporte as GameState["transporte"] })} /><h3 className="mt-6 font-bold">Assinaturas</h3><MultiOptions options={[{ label: "Netflix", value: "netflix" }, { label: "Disney+", value: "disney" }, { label: "Spotify", value: "spotify" }, { label: "Prime", value: "prime" }, { label: "Academia", value: "academia" }]} selected={game.streaming} onChange={(streaming) => update({ streaming: streaming as StreamingKey[] })} /><h3 className="mt-6 font-bold">Alimentação</h3><Options options={[{ label: "Cozinho em casa", value: "masterchef" }, { label: "Peço delivery", value: "delivery" }, { label: "Restaurantes gourmet", value: "gourmet" }]} selected={game.alimentacao} onSelect={(alimentacao) => update({ alimentacao: alimentacao as GameState["alimentacao"] })} /><Continue onClick={next} disabled={!game.transporte || !game.alimentacao} /></Stage>;
  if (stage === 5) return <Stage title="Reserva mensal"><Options options={[{ label: "Não guardar agora", value: "nao" }, { label: "5% da renda", value: "5%" }, { label: "10% da renda", value: "10%" }, { label: "20% da renda", value: "20%" }]} selected={game.poupanca} onSelect={(poupanca) => update({ poupanca: poupanca as GameState["poupanca"] })} /><Continue onClick={next} disabled={!game.poupanca} /></Stage>;
  if (stage === 6) return <Stage title="Lazer"><MultiOptions options={[{ label: "Cinema", value: "cinema" }, { label: "Restaurantes", value: "restaurantes" }, { label: "Shopping", value: "shopping" }, { label: "Viagens", value: "viagens" }]} selected={game.lazer} onChange={(lazer) => update({ lazer: lazer as LazerKey[] })} /><Continue onClick={next} /></Stage>;
  if (stage === 7) return <Stage title="Imprevistos"><Options options={[{ label: "Contratar seguro", value: "seguro" }, { label: "Confiar na reserva", value: "reserva" }, { label: "Não me preparar", value: "nenhum" }]} selected={game.imprevisto} onSelect={(imprevisto) => update({ imprevisto: imprevisto as GameState["imprevisto"] })} /><Continue label="Ver diagnóstico" onClick={next} disabled={!game.imprevisto} /></Stage>;
  return <Stage title="Imposto de renda" subtitle="O extrato considera os descontos básicos do seu regime e apresenta o resultado mensal."><div className="rounded-2xl bg-amber-50 p-5 text-gray-700">Revise suas escolhas. O objetivo não é acertar uma vida ideal, mas perceber como cada decisão afeta o orçamento.</div><Continue label="Finalizar e ver extrato completo" onClick={finish} /></Stage>;
}

function Stage({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) { return <div><h2 className="text-2xl font-bold text-purple-900 sm:text-3xl">{title}</h2>{subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}<div className="mt-6">{children}</div></div>; }
function Options({ options, selected, onSelect }: { options: { label: string; value: string }[]; selected: string | null; onSelect: (value: string) => void }) { return <div className="mt-3 grid gap-3 sm:grid-cols-2">{options.map((option) => { const active = selected === option.value; return <button key={option.value} type="button" aria-pressed={active} onClick={() => onSelect(option.value)} className={`rounded-xl border-2 p-4 text-left font-semibold ${active ? "border-purple-600 bg-purple-50" : "border-gray-200"}`}>{option.label}</button>; })}</div>; }
function PetCounters({ selected, onChange }: { selected: readonly PetKey[]; onChange: (values: PetKey[]) => void }) {
  const options: { label: string; plural: string; value: PetKey }[] = [
    { label: "cachorro", plural: "cachorros", value: "cachorro" },
    { label: "gato", plural: "gatos", value: "gato" },
    { label: "outro animal", plural: "outros animais", value: "outros" },
  ];
  return <div className="mt-3 grid gap-3 sm:grid-cols-3">{options.map((option) => {
    const count = selected.filter((value) => value === option.value).length;
    const description = `${count} ${count === 1 ? option.label : option.plural}`;
    return <div key={option.value} className="rounded-xl border-2 border-gray-200 p-4 text-center">
      <span className="block font-semibold capitalize">{option.label}</span>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" aria-label={`Remover ${option.label}`} disabled={count === 0} onClick={() => { const index = selected.indexOf(option.value); onChange(selected.filter((_, itemIndex) => itemIndex !== index)); }} className="h-9 w-9 rounded-lg border border-purple-300 font-bold text-purple-800 disabled:cursor-not-allowed disabled:opacity-30">−</button>
        <output aria-live="polite" className="min-w-24 text-sm font-semibold">{description}</output>
        <button type="button" aria-label={`Adicionar ${option.label}`} onClick={() => onChange([...selected, option.value])} className="h-9 w-9 rounded-lg bg-purple-700 font-bold text-white">+</button>
      </div>
    </div>;
  })}</div>;
}
function MultiOptions({ options, selected, onChange }: { options: { label: string; value: string }[]; selected: readonly string[]; onChange: (values: string[]) => void }) { return <div className="mt-3 grid gap-3 sm:grid-cols-2">{options.map((option) => { const active = selected.includes(option.value); return <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange(active ? selected.filter((value) => value !== option.value) : [...selected, option.value])} className={`rounded-xl border-2 p-4 text-left font-semibold ${active ? "border-purple-600 bg-purple-50" : "border-gray-200"}`}>{option.label}</button>; })}</div>; }
function Continue({ onClick, disabled, label = "Continuar" }: { onClick: () => void; disabled?: boolean; label?: string }) { return <div className="mt-8 flex justify-end"><button type="button" onClick={onClick} disabled={disabled} className="rounded-xl bg-purple-700 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{label}</button></div>; }
function Stat({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-purple-50 p-3"><strong className="block text-2xl text-purple-800">{value}</strong><span className="text-sm text-gray-600">{label}</span></div>; }
function MoneyStat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-purple-50 p-4"><span className="text-xs font-bold uppercase text-gray-500">{label}</span><strong className="mt-1 block text-xl text-purple-900">{brl(value)}</strong></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div><dt className="text-gray-500">{label}</dt><dd className="font-semibold text-gray-900">{value}</dd></div>; }
