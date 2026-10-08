import { clamp01 } from './scrub';

export const TOP_SPEED = 320;
export const GEARS = 8;
/** Quadro 45 de 240 (índice 44 de 239): fim do carro parado. */
export const LAUNCH_PROGRESS = 44 / 239;

const IDLE_RPM = 4500;
const SHIFT_LOW = 10500;
const SHIFT_HIGH = 15000;

export function speedKmh(progress: number): number {
  const t = (clamp01(progress) - LAUNCH_PROGRESS) / (1 - LAUNCH_PROGRESS);
  if (t <= 0) return 0;
  const eased = t * t * (3 - 2 * t); // smoothstep
  return Math.round(TOP_SPEED * eased);
}

function gearPosition(progress: number): number {
  return (speedKmh(progress) / TOP_SPEED) * GEARS;
}

export function gear(progress: number): string {
  const g = gearPosition(progress);
  if (g === 0) return 'N';
  return String(Math.min(GEARS, Math.floor(g) + 1));
}

export function rpm(progress: number): number {
  const g = gearPosition(progress);
  if (g === 0) return IDLE_RPM;
  const within = g >= GEARS ? 1 : g - Math.floor(g);
  return Math.round(SHIFT_LOW + (SHIFT_HIGH - SHIFT_LOW) * within);
}
