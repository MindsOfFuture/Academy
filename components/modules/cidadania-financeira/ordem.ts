export const LETRAS = ["A", "B", "C", "D", "E", "F"] as const;

/**
 * Ordem em que as opções aparecem na tela. A ordem autoral fica nos dados (e é
 * ela que vai para o acervo via `origLabel`); na tela cada partida sorteia uma
 * ordem própria, para que a posição da resposta certa não vire pista.
 */
export function ordemDasOpcoes(total: number, semente: number, cenarioId: number): number[] {
  let estado = (semente ^ Math.imul(cenarioId, 0x9e3779b1)) >>> 0;
  const aleatorio = () => {
    estado = (Math.imul(estado ^ (estado >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0;
    return estado / 0x100000000;
  };
  const ordem = Array.from({ length: total }, (_, index) => index);
  for (let index = total - 1; index > 0; index -= 1) {
    const troca = Math.floor(aleatorio() * (index + 1));
    [ordem[index], ordem[troca]] = [ordem[troca], ordem[index]];
  }
  return ordem;
}
