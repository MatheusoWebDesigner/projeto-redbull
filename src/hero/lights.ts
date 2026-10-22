import { clamp01 } from './scrub';

export const LIGHT_COUNT = 5;

export function litLights(fraction: number, total = LIGHT_COUNT): number {
  return Math.min(total, Math.floor(clamp01(fraction) * total));
}

/** Progresso único de vários carregamentos, pesado pela quantidade de quadros de cada um. */
export function combinarProgresso(partes: { fracao: number; peso: number }[]): number {
  const total = partes.reduce((s, p) => s + p.peso, 0);
  return total ? partes.reduce((s, p) => s + clamp01(p.fracao) * p.peso, 0) / total : 1;
}
