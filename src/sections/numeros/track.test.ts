import { describe, expect, it } from 'vitest';
import { rangeLabel, trackShift, visibleRange } from './track';

describe('trackShift', () => {
  it('não anda no início e anda tudo no fim', () => {
    expect(trackShift(0, 3048, 1296)).toBe(-0);
    expect(trackShift(1, 3048, 1296)).toBe(-1752);
  });
  it('não anda quando tudo cabe na tela', () => expect(trackShift(1, 800, 1296)).toBe(-0));
  it('limita o progresso', () => expect(trackShift(2, 3048, 1296)).toBe(-1752));
});

describe('visibleRange', () => {
  it('início, meio e fim com 3 por vez', () => {
    expect(visibleRange(0, 8, 3)).toEqual([1, 3]);
    expect(visibleRange(0.5, 8, 3)).toEqual([4, 6]);
    expect(visibleRange(1, 8, 3)).toEqual([6, 8]);
  });
  it('um por vez no celular', () => expect(visibleRange(1, 8, 1)).toEqual([8, 8]));
});

describe('rangeLabel', () => {
  it('faixa no desktop', () => expect(rangeLabel(1, 3, 8)).toBe('01–03 / 08'));
  it('um cartão no celular', () => expect(rangeLabel(6, 6, 8)).toBe('06 / 08'));
});
