import { describe, expect, it } from 'vitest';
import { pontosBezier } from './cabos';

describe('pontosBezier', () => {
  it('alças de 42% da distância na direção de saída e de chegada', () => {
    const [p0, p1, p2, p3] = pontosBezier([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 1, 0]);
    expect(p0).toEqual([0, 0, 0]);
    expect(p3).toEqual([0, 1, 0]);
    const h = 0.42; // distância 1 m
    [h, 0, 0].forEach((v, k) => expect(p1[k]).toBeCloseTo(v, 10));
    [0, 1 - h, 0].forEach((v, k) => expect(p2[k]).toBeCloseTo(v, 10));
  });
  it('alça mínima de 5 cm para cabos curtos', () => {
    const [, p1] = pontosBezier([0, 0, 0], [0, 0, 1], [0.01, 0, 0], [1, 0, 0]);
    expect(p1[2]).toBeCloseTo(0.05, 10);
  });
  it('pontas no mesmo lugar (L = 0): alças mínimas, sem NaN', () => {
    expect(pontosBezier([1, 2, 3], [1, 0, 0], [1, 2, 3], [0, 0, 1])).toEqual([[1, 2, 3], [1.05, 2, 3], [1, 2, 2.95], [1, 2, 3]]);
  });
});
