import { clamp01 } from './scrub';

export const LIGHT_COUNT = 5;

export function litLights(fraction: number, total = LIGHT_COUNT): number {
  return Math.min(total, Math.floor(clamp01(fraction) * total));
}
