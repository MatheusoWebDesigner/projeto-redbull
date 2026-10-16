import { easeInOut } from '../showroom/rail';

export const PONTOS_AERO = [0, 0.48, 0.62, 1];
export type Modo = 'curva' | 'reta';

const clamp01 = (p: number) => Math.min(1, Math.max(0, p)) || 0; // NaN vira o início
/** 0 antes de `a`, 1 depois de `b`, rampa linear entre os dois. */
const rampa = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

export function etapaAero(p: number): number {
  return Math.min(3, Math.floor(clamp01(p) * 4));
}

/** Peso do morph "reta" comandado pela rolagem (a etapa 2 sobrepõe com o laço). */
export function pesoAutomatico(p: number): number {
  return easeInOut(rampa(clamp01(p), 0.3, 0.45));
}

export function modoDoPeso(w: number): Modo {
  return w >= 0.5 ? 'reta' : 'curva';
}

/** Opacidade do perfil (o canvas usa 1 − perfil) e quanto a câmera já viajou de A para C. */
export function linhaAero(p: number): { perfil: number; viagem: number } {
  const q = clamp01(p);
  return {
    perfil: Math.min(rampa(q, 0.5, 0.55), 1 - rampa(q, 0.72, 0.75)),
    viagem: easeInOut(rampa(q, 0.75, 0.9)),
  };
}
