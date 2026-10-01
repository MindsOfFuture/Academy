/* Módulos do Laboratório de Gestão II por turma.
   Cada módulo pronto é uma página estática em public/lg2/turma-<a|b>/mNN/, gerada a partir
   da planilha do grupo. */

export const MODULOS = [
  { numero: 1, nome: "Perfil do empreendedor e definição da ideia" },
  { numero: 2, nome: "Clientes, necessidades e comportamento de compra" },
  { numero: 3, nome: "Mercado, concorrentes e oportunidades" },
  { numero: 4, nome: "Produto, proposta de valor e teste da ideia" },
  { numero: 5, nome: "Custos, despesas, preço e margem" },
  { numero: 6, nome: "Investimento, capital de giro e fluxo de caixa" },
  { numero: 7, nome: "Operação, fornecedores, capacidade e qualidade" },
  { numero: 8, nome: "Formalização, enquadramento e tributação básica" },
  { numero: 9, nome: "Licenças, endereço e atividades reguladas" },
  { numero: 10, nome: "Comunicação, vendas, pessoas e plano de ação" },
] as const;

export type TurmaId = "a" | "b";

// ponytail: lista fixa no código; cada módulo novo é um commit. Upgrade: ler public/lg2/ no build.
export const PRONTOS: Record<TurmaId, readonly number[]> = {
  a: [1, 2, 5, 6],
  b: [8, 9],
};

export function caminhoModulo(turma: TurmaId, numero: number) {
  return `/lg2/turma-${turma}/m${String(numero).padStart(2, "0")}/index.html`;
}
