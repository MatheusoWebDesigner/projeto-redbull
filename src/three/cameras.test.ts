import { describe, expect, it } from 'vitest';
import { lerpPose, toPose, type PoseBruta } from './cameras';

const bruta: PoseBruta = {
  posicao_m: [-4.6322, -6.0304, 3.2899], alvo_m: [1.3982, 0, 0.5189],
  fov_vertical_graus: 31.312, shift_x: -0.1965, shift_y: -0.0362, resolucao: [1920, 1200],
};

describe('toPose', () => {
  it('converte posição e alvo para o Three e guarda o aspecto do render', () => {
    const p = toPose(bruta);
    expect(p.pos).toEqual([-4.6322, 3.2899, 6.0304]);
    expect(p.alvo).toEqual([1.3982, 0.5189, 0]);
    expect(p.fov).toBe(31.312);
    expect(p.shiftX).toBe(-0.1965);
    expect(p.shiftY).toBe(-0.0362);
    expect(p.aspecto).toBeCloseTo(1.6, 6);
  });
});

describe('lerpPose', () => {
  const a = toPose(bruta);
  const b = toPose({ ...bruta, posicao_m: [0, 0, 0], alvo_m: [0, 0, 0], fov_vertical_graus: 41.312, shift_x: 0, shift_y: 0 });
  it('nas pontas devolve as próprias poses', () => {
    expect(lerpPose(a, b, 0)).toEqual(a);
    expect(lerpPose(a, b, 1)).toEqual(b);
  });
  it('fora de 0..1 não extrapola', () => {
    expect(lerpPose(a, b, -0.5)).toEqual(a);
    expect(lerpPose(a, b, 1.5)).toEqual(b);
  });
  it('t NaN é o início, como no resto do trilho', () => {
    expect(lerpPose(a, b, Number.NaN)).toEqual(a);
  });
  it('no meio faz a média de cada campo', () => {
    const m = lerpPose(a, b, 0.5);
    expect(m.fov).toBeCloseTo(36.312, 6);
    expect(m.pos[0]).toBeCloseTo(-2.3161, 6);
    expect(m.shiftX).toBeCloseTo(-0.09825, 6);
  });
});
