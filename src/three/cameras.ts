import { blenderToThree, type Vec3 } from './convert';

/** Pose como sai dos JSON do Blender (`src/data/*-cameras.json`). */
export interface PoseBruta {
  posicao_m: Vec3;
  alvo_m: Vec3;
  fov_vertical_graus: number;
  shift_x: number;
  shift_y: number;
  resolucao: [number, number];
}

/** Pose já nos eixos do Three. `aspecto` é largura/altura do render de referência. */
export interface Pose {
  pos: Vec3;
  alvo: Vec3;
  fov: number;
  shiftX: number;
  shiftY: number;
  aspecto: number;
}

export function toPose(b: PoseBruta): Pose {
  return {
    pos: blenderToThree(b.posicao_m),
    alvo: blenderToThree(b.alvo_m),
    fov: b.fov_vertical_graus,
    shiftX: b.shift_x,
    shiftY: b.shift_y,
    aspecto: b.resolucao[0] / b.resolucao[1],
  };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    pos: mix3(a.pos, b.pos, t),
    alvo: mix3(a.alvo, b.alvo, t),
    fov: mix(a.fov, b.fov, t),
    shiftX: mix(a.shiftX, b.shiftX, t),
    shiftY: mix(a.shiftY, b.shiftY, t),
    aspecto: mix(a.aspecto, b.aspecto, t),
  };
}
