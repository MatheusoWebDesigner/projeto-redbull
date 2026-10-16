import type { Vec3 } from '../../three/convert';

export const GIRO_MAX = 25;
export const INCLINA_MAX = 10;
const GRAUS_POR_PX = 0.15;
const POLO = 0.05; // nunca alinha a câmera com o eixo vertical

export interface Orbita { giro: number; inclina: number }

const limitar = (v: number, max: number) => Math.min(max, Math.max(-max, v));

/** Soma o arraste (px) à órbita atual, com os limites da spec. */
export function arrasto(base: Orbita, dx: number, dy: number): Orbita {
  return {
    giro: limitar(base.giro + dx * GRAUS_POR_PX, GIRO_MAX),
    inclina: limitar(base.inclina + dy * GRAUS_POR_PX, INCLINA_MAX),
  };
}

/** Gira a posição da câmera em torno do alvo: giro no eixo vertical e inclinação para cima. */
export function orbitar(pos: Vec3, alvo: Vec3, giroGraus: number, inclinaGraus: number): Vec3 {
  const rel = [pos[0] - alvo[0], pos[1] - alvo[1], pos[2] - alvo[2]];
  const r = Math.hypot(rel[0], rel[1], rel[2]);
  const theta = Math.atan2(rel[0], rel[2]) + (giroGraus * Math.PI) / 180;
  const phi = Math.min(Math.PI - POLO, Math.max(POLO, Math.acos(rel[1] / r) - (inclinaGraus * Math.PI) / 180));
  return [
    alvo[0] + r * Math.sin(phi) * Math.sin(theta),
    alvo[1] + r * Math.cos(phi),
    alvo[2] + r * Math.sin(phi) * Math.cos(theta),
  ];
}
