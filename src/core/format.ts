const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** Inteiro no formato brasileiro: 13200 → "13.200". */
export function formatNumber(n: number): string {
  return inteiro.format(Math.round(n) + 0); // + 0 normaliza -0, que o Intl exibiria como "-0"
}
