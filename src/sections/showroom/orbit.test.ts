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
  it('o limite vale para a órbita resultante: partindo do limite, arrastar de volta responde na hora', () => {
    const r = arrasto({ giro: GIRO_MAX, inclina: -INCLINA_MAX }, -100, 20);
    expect(r.giro).toBeCloseTo(10, 10);
    expect(r.inclina).toBeCloseTo(-7, 10);
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

describe('orbitar nas bordas', () => {
  const alvo: Vec3 = [1, 0, 0];
  const horizontal = (p: Vec3) => Math.hypot(p[0] - alvo[0], p[2] - alvo[2]);

  it('câmera sobre o próprio alvo (r = 0) não vira NaN', () => {
    expect(orbitar(alvo, alvo, 20, 8)).toEqual(alvo);
  });
  it('câmera exatamente no polo sai do eixo vertical, mantendo a distância', () => {
    const r = orbitar([1, 3, 0], alvo, 0, 0);
    r.forEach((v) => expect(Number.isFinite(v)).toBe(true));
    expect(dist(r, alvo)).toBeCloseTo(3, 10);
    expect(horizontal(r)).toBeGreaterThan(0.1);
  });
  it('inclinação extrema perto do polo para antes dele e não vira para o outro lado', () => {
    const p: Vec3 = [1 + 3 * Math.sin(0.03), 3 * Math.cos(0.03), 0]; // a ~1,7° do eixo
    const r = orbitar(p, alvo, 0, 10);
    expect(dist(r, alvo)).toBeCloseTo(3, 10);
    expect(horizontal(r)).toBeGreaterThan(0.1);
    expect(r[0] - alvo[0]).toBeGreaterThan(0); // mesmo lado de onde partiu
  });
  it('o mesmo vale embaixo, com inclinação negativa', () => {
    const p: Vec3 = [1 + 3 * Math.sin(0.03), -3 * Math.cos(0.03), 0];
    const r = orbitar(p, alvo, 0, -10);
    expect(dist(r, alvo)).toBeCloseTo(3, 10);
    expect(horizontal(r)).toBeGreaterThan(0.1);
    expect(r[0] - alvo[0]).toBeGreaterThan(0);
  });
});
