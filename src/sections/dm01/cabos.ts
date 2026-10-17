import type { Vec3 } from '../../three/convert';

/**
 * Pontos de controle da Bézier cúbica de um cabo de alta tensão, com a mesma regra
 * dos renders (dm01_comum_v01.py): alça = 42% da distância, no mínimo 5 cm.
 */
export function pontosBezier(p0: Vec3, d0: Vec3, p3: Vec3, d3: Vec3): [Vec3, Vec3, Vec3, Vec3] {
  const h = Math.max(0.05, 0.42 * Math.hypot(p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]));
  const p1: Vec3 = [p0[0] + d0[0] * h, p0[1] + d0[1] * h, p0[2] + d0[2] * h];
  const p2: Vec3 = [p3[0] - d3[0] * h, p3[1] - d3[1] * h, p3[2] - d3[2] * h];
  return [p0, p1, p2, p3];
}
