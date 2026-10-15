import { describe, expect, it } from 'vitest';
import { DIM, LIT_END, wordOpacity } from './words';

describe('wordOpacity', () => {
  it('tudo apagado no início', () => {
    for (let i = 0; i < 39; i++) expect(wordOpacity(i, 39, 0)).toBe(DIM);
  });
  it('tudo aceso a partir de LIT_END', () => {
    for (let i = 0; i < 39; i++) expect(wordOpacity(i, 39, LIT_END)).toBe(1);
    expect(wordOpacity(38, 39, 1)).toBe(1);
  });
  it('acende em ordem: palavra anterior nunca é mais apagada que a seguinte', () => {
    for (const p of [0.1, 0.33, 0.5, 0.7]) {
      for (let i = 1; i < 39; i++) expect(wordOpacity(i - 1, 39, p)).toBeGreaterThanOrEqual(wordOpacity(i, 39, p));
    }
  });
  it('palavra no limiar fica parcialmente acesa', () => {
    const v = wordOpacity(19, 39, (19.5 / 39) * LIT_END);
    expect(v).toBeGreaterThan(DIM);
    expect(v).toBeLessThan(1);
  });
  it('progresso fora de 0–1 ou inválido fica no limite', () => {
    expect(wordOpacity(0, 39, -0.5)).toBe(DIM);
    expect(wordOpacity(38, 39, 1.5)).toBe(1);
    expect(wordOpacity(0, 39, NaN)).toBe(DIM);
  });
  it('rolar para a frente nunca apaga uma palavra', () => {
    for (const i of [0, 19, 38]) {
      let anterior = DIM;
      for (let p = 0; p <= 1; p += 0.01) {
        const v = wordOpacity(i, 39, p);
        expect(v).toBeGreaterThanOrEqual(anterior);
        anterior = v;
      }
    }
  });
  it('com uma palavra só, ela acende ao longo de todo o trecho até LIT_END', () => {
    const meio = wordOpacity(0, 1, LIT_END / 2);
    expect(meio).toBeGreaterThan(DIM);
    expect(meio).toBeLessThan(1);
    expect(wordOpacity(0, 1, LIT_END)).toBe(1);
  });
});
