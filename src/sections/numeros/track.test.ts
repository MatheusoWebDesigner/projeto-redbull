import { describe, expect, it } from 'vitest';
import { cardEntrou, rangeLabel, trackShift, visibleRange } from './track';

describe('trackShift', () => {
  it('não anda no início e anda tudo no fim', () => {
    expect(trackShift(0, 3048, 1296)).toBe(-0);
    expect(trackShift(1, 3048, 1296)).toBe(-1752);
  });
  it('não anda quando tudo cabe na tela', () => expect(trackShift(1, 800, 1296)).toBe(-0));
  it('limita o progresso', () => expect(trackShift(2, 3048, 1296)).toBe(-1752));
  it('progresso negativo ou inválido não empurra o trilho', () => {
    expect(trackShift(-0.5, 3048, 1296)).toBeCloseTo(0);
    expect(trackShift(NaN, 3048, 1296)).toBeCloseTo(0);
  });
});

describe('visibleRange', () => {
  it('início, meio e fim com 3 por vez', () => {
    expect(visibleRange(0, 8, 3)).toEqual([1, 3]);
    expect(visibleRange(0.5, 8, 3)).toEqual([4, 6]);
    expect(visibleRange(1, 8, 3)).toEqual([6, 8]);
  });
  it('um por vez no celular', () => expect(visibleRange(1, 8, 1)).toEqual([8, 8]));
  it('troca de faixa na metade do caminho entre duas posições', () => {
    expect(visibleRange(0.09, 8, 3)).toEqual([1, 3]);
    expect(visibleRange(0.1, 8, 3)).toEqual([2, 4]);
  });
  it('a faixa fica dentro de 1..count, tem o tamanho da vista e só avança', () => {
    for (const perView of [1, 3]) {
      let primeiroAnterior = 1;
      for (let p = -0.5; p <= 1.5; p += 0.01) {
        const [a, b] = visibleRange(p, 8, perView);
        expect(a).toBeGreaterThanOrEqual(primeiroAnterior);
        expect(b - a + 1).toBe(perView);
        expect(b).toBeLessThanOrEqual(8);
        primeiroAnterior = a;
      }
    }
  });
  it('progresso inválido mostra a primeira faixa', () => expect(visibleRange(NaN, 8, 3)).toEqual([1, 3]));
  it('com menos cartões que a vista, mostra todos a partir do 1', () => {
    expect(visibleRange(0, 2, 3)).toEqual([1, 2]);
    expect(visibleRange(1, 2, 3)).toEqual([1, 2]);
    expect(visibleRange(1, 1, 3)).toEqual([1, 1]);
  });
});

describe('rangeLabel', () => {
  it('faixa no desktop', () => expect(rangeLabel(1, 3, 8)).toBe('01–03 / 08'));
  it('um cartão no celular', () => expect(rangeLabel(6, 6, 8)).toBe('06 / 08'));
});

describe('cardEntrou', () => {
  it('conta quando 60% do cartão está dentro da tela', () => {
    expect(cardEntrou(1440 - 360 * 0.6, 360, 1440)).toBe(true);
    expect(cardEntrou(1440 - 360 * 0.5, 360, 1440)).toBe(false);
  });
  it('o último cartão conta no fim do trilho (desktop e celular)', () => {
    expect(cardEntrou(1440 - 72 - 360, 360, 1440)).toBe(true);
    expect(cardEntrou(24, 300, 390)).toBe(true);
  });
  it('cartão ainda fora da tela não conta', () => expect(cardEntrou(1500, 360, 1440)).toBe(false));
  it('tela mais estreita que o cartão: conta com 80% à vista, não com 55%', () => {
    expect(cardEntrou(0, 400, 320)).toBe(true);
    expect(cardEntrou(100, 400, 320)).toBe(false);
  });
});
