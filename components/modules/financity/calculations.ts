import type { GameState } from "./data";

export type Extrato = {
  salarioBruto: number;
  salarioLiquido: number;
  inss: number;
  fgts: number;
  rendaExtra: number;
  valeRefeicao: number;
  despesasFamilia: number;
  despesasPets: number;
  despesasMoradia: number;
  despesasTransporte: number;
  despesasStreaming: number;
  despesasAlimentacao: number;
  despesasLazer: number;
  despesasSeguro: number;
  impostoRendaMensal: number;
  totalDespesas: number;
  reservaMensal: number;
  saldo: number;
  integrantesAdicionais: number;
};

const SALARIOS: Record<string, number> = {
  "analista de sistemas": 6500,
  analista: 5500,
  medico: 12000,
  professor: 4500,
  engenheiro: 8500,
  advogado: 7000,
  designer: 5000,
  vendedor: 3500,
};

function normalizar(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function lookupSalario(profissao: string) {
  let key = normalizar(profissao);
  if (key.endsWith("a") && SALARIOS[`${key.slice(0, -1)}o`]) key = `${key.slice(0, -1)}o`;
  const match = Object.keys(SALARIOS).find((item) => key.includes(item) || item.includes(key));
  return { salario: match ? SALARIOS[match] : 4000, reconhecida: Boolean(match) };
}

const INSS_FAIXAS = [
  { ate: 1412, aliquota: 0.075 },
  { ate: 2666.68, aliquota: 0.09 },
  { ate: 4000.03, aliquota: 0.12 },
  { ate: 7786.02, aliquota: 0.14 },
] as const;

function descontosCLT(bruto: number) {
  let anterior = 0;
  let inss = 0;
  for (const faixa of INSS_FAIXAS) {
    if (bruto <= anterior) break;
    inss += (Math.min(bruto, faixa.ate) - anterior) * faixa.aliquota;
    anterior = faixa.ate;
  }
  return {
    inss: Math.min(908.86, Math.round(inss * 100) / 100),
    fgts: Math.round(bruto * 0.08 * 100) / 100,
  };
}

function qtdFilhos(g: GameState) {
  return g.filhos === "1" ? 1 : g.filhos === "2" ? 2 : g.filhos === "3+" ? 3 : 0;
}

const IRRF_FAIXAS = [
  { ate: 2259.2, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Number.POSITIVE_INFINITY, aliquota: 0.275, deducao: 896 },
] as const;

function irrfSobreBase(base: number) {
  const faixa = IRRF_FAIXAS.find((item) => base <= item.ate) ?? IRRF_FAIXAS.at(-1)!;
  return Math.max(0, base * faixa.aliquota - faixa.deducao);
}

export function calcDasPJ(bruto: number) {
  if (!bruto) return 0;
  return bruto <= 6750 ? 85 : Math.round(bruto * 0.06 * 100) / 100;
}

function impostoMensal(g: GameState, inss: number) {
  if (g.regime === "PJ") return calcDasPJ(g.salarioBruto);
  if (g.regime !== "CLT") return 0;

  const deducaoDependentes = qtdFilhos(g) * 189.59;
  const deducaoSaude = g.imprevisto === "seguro" ? 200 : 0;
  const baseCompleta = Math.max(0, g.salarioBruto - inss - deducaoDependentes - deducaoSaude);
  const baseSimplificada = Math.max(0, g.salarioBruto - 564.8);
  return Math.round(Math.min(irrfSobreBase(baseCompleta), irrfSobreBase(baseSimplificada)) * 100) / 100;
}

const CUSTO_PET = { cachorro: 150, gato: 100, outros: 80 } as const;
const CUSTO_FILHOS = { "0": 0, "1": 600, "2": 1100, "3+": 1600 } as const;
const MORADIA = { apartamento: 480, casa: 330, mansao: 1300, sitio: 300 } as const;
const TRANSPORTE = { carro: 1200, moto: 500, bicicleta: 30, publico: 220 } as const;
const STREAMING = { netflix: 45, disney: 34, spotify: 25, prime: 20, academia: 110 } as const;
const ALIMENTACAO = { masterchef: 0.25, delivery: 0.35, gourmet: 0.45 } as const;
const LAZER = { cinema: 80, restaurantes: 250, shopping: 300, viagens: 500 } as const;

export function calcExtrato(g: GameState): Extrato {
  const descontos = g.regime === "CLT" ? descontosCLT(g.salarioBruto) : { inss: 0, fgts: 0 };
  const salarioLiquido = g.regime ? Math.max(0, g.salarioBruto - descontos.inss) : 0;
  const rendaExtra = g.estadoCivil === "casado" ? 1500 : 0;
  const valeRefeicao = g.regime === "CLT" ? 600 : 0;
  const despesasPets = g.pets.reduce((total, pet) => total + CUSTO_PET[pet], 0);
  const despesasFamilia = (g.filhos ? CUSTO_FILHOS[g.filhos] : 0) + despesasPets;
  const integrantesAdicionais = (g.estadoCivil === "casado" ? 1 : 0) + qtdFilhos(g);
  const moradiaBase = g.imovel ? MORADIA[g.imovel] : 0;
  const luxo = g.imovel === "mansao" || g.imovel === "sitio";
  const moradiaContrato = g.aquisicao === "alugada" ? (luxo ? 3500 : 1200) : g.aquisicao === "financiada" ? (luxo ? 4500 : 1600) : 0;
  const despesasMoradia = moradiaBase + moradiaContrato;
  const despesasTransporte = g.transporte ? TRANSPORTE[g.transporte] : 0;
  const despesasStreaming = g.streaming.reduce((total, item) => total + STREAMING[item], 0);
  const alimentacaoBase = g.alimentacao ? Math.min(g.salarioBruto, 12000) * ALIMENTACAO[g.alimentacao] : 0;
  const despesasAlimentacao = Math.max(0, alimentacaoBase * (1 + 0.3 * integrantesAdicionais) - valeRefeicao);
  const despesasLazer = g.lazer.reduce((total, item) => total + LAZER[item], 0);
  const despesasSeguro = g.imprevisto === "seguro" ? 200 : 0;
  const totalDespesas = despesasFamilia + despesasMoradia + despesasTransporte + despesasStreaming + despesasAlimentacao + despesasLazer + despesasSeguro;
  const percentualReserva = { nao: 0, "5%": 0.05, "10%": 0.1, "20%": 0.2 }[g.poupanca ?? "nao"];
  const reservaMensal = salarioLiquido * percentualReserva;
  const impostoRendaMensal = impostoMensal(g, descontos.inss);
  const saldo = salarioLiquido + rendaExtra - totalDespesas - impostoRendaMensal - reservaMensal;

  return {
    salarioBruto: g.salarioBruto,
    salarioLiquido,
    inss: descontos.inss,
    fgts: descontos.fgts,
    rendaExtra,
    valeRefeicao,
    despesasFamilia,
    despesasPets,
    despesasMoradia,
    despesasTransporte,
    despesasStreaming,
    despesasAlimentacao,
    despesasLazer,
    despesasSeguro,
    impostoRendaMensal,
    totalDespesas,
    reservaMensal,
    saldo,
    integrantesAdicionais,
  };
}

export function diagnosticar(g: GameState, e: Extrato) {
  if (e.saldo < 0) return { id: "superendividado" as const, titulo: "Superendividado", descricao: "Suas despesas superam sua renda. Reveja os gastos fixos e as assinaturas antes de assumir novas parcelas." };
  if (e.reservaMensal > 0 && e.saldo > e.salarioLiquido * 0.3 && g.lazer.length === 0) return { id: "poupador" as const, titulo: "Poupador Extremo", descricao: "Você guarda bastante e fecha o mês no azul, mas pode reservar uma parte responsável para qualidade de vida." };
  if (e.reservaMensal > 0 && g.lazer.length > 0) return { id: "equilibrado" as const, titulo: "Equilibrado", descricao: "Você poupa, mantém lazer e termina o mês no azul. Continue revisando o orçamento." };
  return { id: "gastador" as const, titulo: "Gastador Livre", descricao: "Você não fecha no vermelho, mas ainda não construiu uma reserva. Comece guardando uma pequena parte da renda." };
}

export function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}
