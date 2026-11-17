/* Módulos do Laboratório de Gestão II por turma.
   Cada módulo pronto é uma página estática em public/lg2/turma-<a|b>/mNN/, gerada a partir
   da planilha do grupo. */

export const MODULOS = [
  { numero: 1, nome: "Você e a sua ideia de negócio" },
  { numero: 2, nome: "Quem são seus clientes e como compram" },
  { numero: 3, nome: "Mercado, concorrentes e oportunidades" },
  { numero: 4, nome: "Produto, por que comprar de você e teste da ideia" },
  { numero: 5, nome: "Custos, preço e quanto sobra" },
  { numero: 6, nome: "Dinheiro para começar e para os primeiros meses" },
  { numero: 7, nome: "Como você produz, compra e entrega" },
  { numero: 8, nome: "Abrir o seu negócio: CNPJ, MEI e impostos" },
  { numero: 9, nome: "Licenças e endereço" },
  { numero: 10, nome: "Vendas, pessoas e plano de ação" },
] as const;

export type TurmaId = "a" | "b";

// ponytail: lista fixa no código; cada módulo novo é um commit. Upgrade: ler public/lg2/ no build.
export const PRONTOS: Record<TurmaId, readonly number[]> = {
  a: [1, 3, 4, 5],
  b: [2, 6, 7, 8, 9, 10],
};

export function caminhoModulo(turma: TurmaId, numero: number) {
  return `/lg2/turma-${turma}/m${String(numero).padStart(2, "0")}/index.html`;
}
