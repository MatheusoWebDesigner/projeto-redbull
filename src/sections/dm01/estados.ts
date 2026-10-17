import type { Vec3 } from '../../three/convert';
import { easeInOut } from '../showroom/rail';

export type Estado = 'E0' | 'E1' | 'E2' | 'E3';
export const ESTADOS: Estado[] = ['E0', 'E1', 'E2', 'E3'];
/** Encaixe: cada etapa já com o motor no estado dela. */
export const PONTOS_DM01 = [0, 0.4, 0.65, 1];
/** Fogo 400 kW, faísca 350 kW. */
export const PROPORCAO_FOGO = 400 / 750;

/** Janelas (p) em que o motor passa de um estado para o seguinte. */
const JANELAS: [number, number][] = [[0.25, 0.35], [0.5, 0.6], [0.75, 0.85]];

const clamp01 = (p: number) => Math.min(1, Math.max(0, p)) || 0; // NaN vira o início
const rampa = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

export function etapaDm01(p: number): number {
  return Math.min(3, Math.floor(clamp01(p) * 4));
}

/** Estado de partida, de chegada e quanto da transição já andou (suavizado). */
export function estadoContinuo(p: number): { de: Estado; para: Estado; t: number } {
  const q = clamp01(p);
  let i = 0;
  while (i < JANELAS.length - 1 && q >= JANELAS[i][1]) i++;
  return { de: ESTADOS[i], para: ESTADOS[i + 1], t: easeInOut(rampa(q, ...JANELAS[i])) };
}

export function interpolarVetor(tab: Record<Estado, Vec3>, p: number): Vec3 {
  const { de, para, t } = estadoContinuo(p);
  return [0, 1, 2].map((k) => tab[de][k] + (tab[para][k] - tab[de][k]) * t) as Vec3;
}

export function interpolarNumero(tab: Record<Estado, number>, p: number): number {
  const { de, para, t } = estadoContinuo(p);
  return tab[de] + (tab[para] - tab[de]) * t;
}

/** Giro lento do motor montado na primeira etapa. */
export function giroGraus(p: number): number {
  return 8 * easeInOut(rampa(clamp01(p), 0, 0.25));
}

/** Preenchimento da barra 50/50 (0..1), das pontas para o centro. */
export function barra5050(p: number): number {
  return easeInOut(rampa(clamp01(p), 0.85, 0.95));
}

export function rotulosVisiveis(etapa: number): { termico: boolean; eletrico: boolean } {
  return { termico: etapa >= 1, eletrico: etapa >= 2 };
}
