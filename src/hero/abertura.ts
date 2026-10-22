/** Abertura renderizada no Blender: 39 quadros novos; o 40º seria o próprio quadro 1 da Hero. */
export const QUADROS_ABERTURA = 39;
export const FPS_ABERTURA = 30;

/** Quadro da abertura para o tempo decorrido (ms), ou null quando ela acabou. */
export function quadroDaAbertura(ms: number, total = QUADROS_ABERTURA, fps = FPS_ABERTURA): number | null {
  const i = Math.floor((Math.max(0, ms) * fps) / 1000);
  return i < total ? i : null;
}
