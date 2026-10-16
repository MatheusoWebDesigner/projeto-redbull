import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../../three/convert';
import { arrasto, GIRO_MAX, INCLINA_MAX, orbitar } from './orbit';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('arrasto', () => {
  it('converte pixels em graus', () => {
    expect(arrasto({ giro: 0, inclina: 0 }, 100, 0)).toEqual({ giro: 15, inclina: 0 });
  });
  it('limita a ±25° de giro e ±10° de inclinação', () => {
    expect(arrasto({ giro: 0, inclina: 0 }, 10000, 10000)).toEqual({ giro: GIRO_MAX, inclina: INCLINA_MAX });
    expect(arrasto({ giro: 0, inclina: 0 }, -10000, -10000)).toEqual({ giro: -GIRO_MAX, inclina: -INCLINA_MAX });
  });
});

describe('orbitar', () => {
  const alvo: Vec3 = [1, 0, 0];
  it('sem giro devolve a mesma posição', () => {
    const r = orbitar([2, 0, 0], alvo, 0, 0);
    r.forEach((v, k) => expect(v).toBeCloseTo([2, 0, 0][k], 10));
  });
  it('gira em torno do eixo vertical do alvo', () => {
    const r = orbitar([2, 0, 0], alvo, 90, 0);
    r.forEach((v, k) => expect(v).toBeCloseTo([1, 0, -1][k], 10));
  });
  it('preserva a distância ao alvo', () => {
    const p: Vec3 = [-4.6, 3.3, 6.0];
    expect(dist(orbitar(p, alvo, 20, 8), alvo)).toBeCloseTo(dist(p, alvo), 10);
  });
  it('inclinação positiva sobe a câmera', () => {
    expect(orbitar([3, 1, 0], alvo, 0, 10)[1]).toBeGreaterThan(1);
  });
});
