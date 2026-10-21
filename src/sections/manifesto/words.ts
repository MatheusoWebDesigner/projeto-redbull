/** Opacidade das palavras ainda não lidas. */
export const DIM = 0.4; // 3,7:1 sobre o fundo (mínimo de 3:1 para texto grande)
/** Progresso em que a última palavra termina de acender (o resto é pausa). */
export const LIT_END = 0.8;

export function wordOpacity(index: number, count: number, progress: number): number {
  const p = Math.min(1, Math.max(0, progress)) || 0; // || 0: NaN vira o início
  const lit = (p / LIT_END) * count - index;
  if (lit >= 1) return 1;
  if (lit <= 0) return DIM;
  return DIM + (1 - DIM) * lit;
}
