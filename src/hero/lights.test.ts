import { describe, expect, it } from 'vitest';
import { combinarProgresso, litLights } from './lights';

describe('litLights', () => {
  it('nenhuma luz no começo', () => {
    expect(litLights(0)).toBe(0);
  });
  it('acende uma a cada 20%', () => {
    expect(litLights(0.19)).toBe(0);
    expect(litLights(0.2)).toBe(1);
    expect(litLights(0.99)).toBe(4);
  });
  it('as 5 acesas quando carregou tudo', () => {
    expect(litLights(1)).toBe(5);
    expect(litLights(1.3)).toBe(5);
  });
});

describe('litLights nas bordas', () => {
  it('fração negativa ou NaN deixa tudo apagado', () => {
    expect(litLights(-0.5)).toBe(0);
    expect(litLights(NaN)).toBe(0);
  });
  it('nunca diminui enquanto o carregamento avança', () => {
    let last = 0;
    for (let i = 0; i <= 100; i++) {
      const lit = litLights(i / 100);
      expect(lit).toBeGreaterThanOrEqual(last);
      last = lit;
    }
  });
});

describe('combinarProgresso', () => {
  it('combina carregamentos pelo peso de cada um', () => {
    expect(combinarProgresso([{ fracao: 1, peso: 31 }, { fracao: 0, peso: 39 }])).toBeCloseTo(31 / 70);
    expect(combinarProgresso([{ fracao: 0.5, peso: 10 }, { fracao: 0.5, peso: 30 }])).toBe(0.5);
  });
  it('fração fora de 0–1 ou NaN não estraga a soma; sem partes, está carregado', () => {
    expect(combinarProgresso([{ fracao: 2, peso: 1 }, { fracao: NaN, peso: 1 }])).toBe(0.5);
    expect(combinarProgresso([])).toBe(1);
  });
});
