import { describe, expect, it } from 'vitest';
import { cardEntrou, trackShift } from './track';

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
