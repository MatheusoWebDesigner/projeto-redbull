import { describe, expect, it } from 'vitest';
import { gear, rpm, speedKmh, TOP_SPEED } from './telemetry';

describe('speedKmh', () => {
  it('parado antes da arrancada', () => {
    expect(speedKmh(0)).toBe(0);
    expect(speedKmh(0.15)).toBe(0);
  });
  it('chega à velocidade máxima no fim', () => {
    expect(speedKmh(1)).toBe(TOP_SPEED);
  });
  it('nunca diminui enquanto a rolagem avança', () => {
    let last = 0;
    for (let p = 0; p <= 1; p += 0.01) {
      const s = speedKmh(p);
      expect(s).toBeGreaterThanOrEqual(last);
      last = s;
    }
  });
});

describe('rpm e marcha', () => {
  it('marcha lenta parado', () => {
    expect(rpm(0)).toBe(4500);
    expect(gear(0)).toBe('N');
  });
  it('em movimento fica entre 10.500 e 15.000 rpm', () => {
    for (let p = 0.3; p <= 1; p += 0.05) {
      expect(rpm(p)).toBeGreaterThanOrEqual(10500);
      expect(rpm(p)).toBeLessThanOrEqual(15000);
    }
  });
  it('termina em 8ª marcha', () => {
    expect(gear(1)).toBe('8');
  });
});
