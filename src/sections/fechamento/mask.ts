/** A partir deste progresso o título está no tamanho final e entram texto e botões. */
export const REVEAL_AT = 0.7;
const clamp01 = (p: number) => Math.min(1, Math.max(0, p)) || 0; // || 0: NaN vira o início

export function reverseFrame(progress: number, count: number): number {
  return Math.round((1 - clamp01(progress)) * (count - 1));
}

export function titleScale(progress: number): number {
  const t = Math.min(1, clamp01(progress) / REVEAL_AT);
  return 1.4 - 0.4 * t;
}
