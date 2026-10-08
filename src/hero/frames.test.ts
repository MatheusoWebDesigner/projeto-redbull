import { describe, expect, it } from 'vitest';
import { frameUrl, nearestLoaded, splitLoadOrder } from './frames';

describe('frameUrl', () => {
  it('usa numeração de 3 dígitos a partir de 1', () => {
    expect(frameUrl('desktop', 0)).toBe('/hero/frames/desktop/f_001.webp');
    expect(frameUrl('mobile', 239)).toBe('/hero/frames/mobile/f_240.webp');
  });
});

describe('splitLoadOrder', () => {
  it('carrega primeiro 1 a cada 4 quadros e o último', () => {
    expect(splitLoadOrder(10, 4)).toEqual({
      priority: [0, 4, 8, 9],
      rest: [1, 2, 3, 5, 6, 7],
    });
  });
  it('cobre todos os quadros exatamente uma vez', () => {
    const { priority, rest } = splitLoadOrder(240);
    const all = [...priority, ...rest].sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: 240 }, (_, i) => i));
  });
});

describe('nearestLoaded', () => {
  it('devolve o próprio quadro quando já carregou', () => {
    expect(nearestLoaded(new Set([3, 5]), 5, 10)).toBe(5);
  });
  it('devolve o carregado mais próximo, preferindo o anterior no empate', () => {
    expect(nearestLoaded(new Set([0, 4]), 2, 10)).toBe(0);
    expect(nearestLoaded(new Set([0, 4]), 3, 10)).toBe(4);
  });
  it('devolve null quando nada carregou', () => {
    expect(nearestLoaded(new Set(), 2, 10)).toBeNull();
  });
});
