import type { GameState } from "./data";

export type Extrato = {
  salarioBruto: number;
  salarioLiquido: number;
  totalDespesas: number;
  reservaMensal: number;
  saldo: number;
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

function inss(bruto: number) {
  if (bruto <= 1412) return bruto * 0.075;
  if (bruto <= 2666.68) return 105.9 + (bruto - 1412) * 0.09;
  if (bruto <= 4000.03) return 218.82 + (bruto - 2666.68) * 0.12;
  return Math.min(908.86, 378.82 + (bruto - 4000.03) * 0.14);
}

export function calcExtrato(g: GameState): Extrato {
  const salarioLiquido = g.regime === "CLT" ? Math.max(0, g.salarioBruto - inss(g.salarioBruto)) : g.salarioBruto;
  const rendaConjuge = g.estadoCivil === "casado" ? 1500 : 0;
  const filhos = g.filhos === "1" ? 1 : g.filhos === "2" ? 2 : g.filhos === "3+" ? 3 : 0;
  const familia = filhos * 600 + g.pets.length * 120;
  const moradiaBase = { apartamento: 480, casa: 330, mansao: 1300, sitio: 300 }[g.imovel ?? "casa"];
  const moradiaContrato = g.aquisicao === "alugada" ? (g.imovel === "mansao" || g.imovel === "sitio" ? 3500 : 1200) : g.aquisicao === "financiada" ? (g.imovel === "mansao" || g.imovel === "sitio" ? 4500 : 1600) : 0;
  const transporte = { carro: 1200, moto: 500, bicicleta: 30, publico: 220 }[g.transporte ?? "publico"];
  const streaming = g.streaming.length * 35;
  const baseAlimentacao = { masterchef: 0.25, delivery: 0.35, gourmet: 0.45 }[g.alimentacao ?? "masterchef"] * Math.min(g.salarioBruto, 12000);
  const lazer = g.lazer.reduce((sum, item) => sum + ({ cinema: 80, restaurantes: 250, shopping: 300, viagens: 500 }[item]), 0);
  const seguro = g.imprevisto === "seguro" ? 200 : 0;
  const totalDespesas = familia + moradiaBase + moradiaContrato + transporte + streaming + baseAlimentacao + lazer + seguro;
  const percentualReserva = { nao: 0, "5%": 0.05, "10%": 0.1, "20%": 0.2 }[g.poupanca ?? "nao"];
  const reservaMensal = salarioLiquido * percentualReserva;
  const saldo = salarioLiquido + rendaConjuge - totalDespesas - reservaMensal;
  return { salarioBruto: g.salarioBruto, salarioLiquido, totalDespesas, reservaMensal, saldo };
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
