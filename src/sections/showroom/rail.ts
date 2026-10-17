import type { Vec3 } from '../../three/convert';
import { lerpPose, type Pose } from '../../three/cameras';

export const PARADAS = 6;
export const PONTOS_SHOWROOM = [0, 0.2, 0.4, 0.6, 0.8, 1];

const clamp01 = (p: number) => Math.min(1, Math.max(0, p)) || 0; // NaN vira o início

/** Mesma curva do power2.inOut do GSAP. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
}

/** Parâmetro no trilho (0..1): passa pelas paradas e desacelera perto de cada uma. */
export function railU(progress: number, paradas = PARADAS): number {
  const s = clamp01(progress) * (paradas - 1);
  const i = Math.min(Math.floor(s), paradas - 2);
  return (i + easeInOut(s - i)) / (paradas - 1);
}

/** Índice da parada cujo texto aparece (troca na metade do caminho). */
export function paradaAtiva(progress: number, paradas = PARADAS): number {
  return Math.round(clamp01(progress) * (paradas - 1));
}

/** Catmull-Rom uniforme pelos pontos; u = 0 no primeiro e u = 1 no último. */
export function catmullRom(pontos: Vec3[], u: number): Vec3 {
  const n = pontos.length - 1;
  const s = clamp01(u) * n;
  const i = Math.min(Math.floor(s), n - 1);
  const t = s - i;
  const p0 = pontos[Math.max(i - 1, 0)];
  const p1 = pontos[i];
  const p2 = pontos[i + 1];
  const p3 = pontos[Math.min(i + 2, n)];
  const t2 = t * t;
  const t3 = t2 * t;
  return [0, 1, 2].map((k) =>
    0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
  ) as Vec3;
}

/** Pose da câmera no trilho: posição e alvo pela curva, lente e shift interpolados no trecho. */
export function poseNoTrilho(poses: Pose[], progress: number): Pose {
  const u = railU(progress, poses.length);
  const s = u * (poses.length - 1);
  const i = Math.min(Math.floor(s), poses.length - 2);
  const base = lerpPose(poses[i], poses[i + 1], s - i);
  return {
    ...base,
    pos: catmullRom(poses.map((p) => p.pos), u),
    alvo: catmullRom(poses.map((p) => p.alvo), u),
  };
}

export type EstadoBarra = 'apagada' | 'vista' | 'ativa';

/** Barras das 5 peças: as já passadas ficam "vistas" e a da parada atual, ativa. */
export function estadoBarras(parada: number, total = PARADAS - 1): EstadoBarra[] {
  return Array.from({ length: total }, (_, i) => (i + 1 < parada ? 'vista' : i + 1 === parada ? 'ativa' : 'apagada'));
}

const EMPATE = 1e-12; // absorve o erro de ponto flutuante (0,4 − 0,3 ≠ 0,3 − 0,2)

/** Ponto de encaixe mais próximo; no empate vai para o seguinte, como o Math.round de `paradaAtiva`. */
export function encaixeMaisProximo(progress: number, pontos: number[]): number {
  return pontos.reduce((melhor, p) => (Math.abs(p - progress) <= Math.abs(melhor - progress) + EMPATE ? p : melhor), pontos[0]);
}
