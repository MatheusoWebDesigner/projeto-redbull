export interface Faixa {
  top: number;
  bottom: number;
}

/**
 * O palco fixado tem altura da tela e corta o que vaza (overflow: hidden).
 * Se algum capítulo não couber entre o topo do palco e `limite`, a Hero precisa
 * empilhar os capítulos — senão parte do texto some (zoom alto, espaçamento de texto).
 */
export function textoCabeNoPalco(capitulos: readonly Faixa[], limite: number): boolean {
  return capitulos.every((c) => c.top >= 0 && c.bottom <= limite);
}
