import { describe, expect, it } from 'vitest';
import { REVEAL_AT, reverseFrame, titleScale } from './mask';

describe('reverseFrame', () => {
  it('toca a Hero de trás para a frente', () => {
    expect(reverseFrame(0, 240)).toBe(239);
    expect(reverseFrame(1, 240)).toBe(0);
    expect(reverseFrame(0.5, 240)).toBe(120);
  });
  it('limita o progresso', () => expect(reverseFrame(2, 240)).toBe(0));
  it('progresso negativo ou inválido fica no último quadro', () => {
    expect(reverseFrame(-0.5, 240)).toBe(239);
    expect(reverseFrame(NaN, 240)).toBe(239);
  });
  it('quadro sempre inteiro, dentro de 0..count-1, e só volta', () => {
    let anterior = 239;
    for (let p = 0; p <= 1; p += 0.003) {
      const q = reverseFrame(p, 240);
      expect(Number.isInteger(q)).toBe(true);
      expect(q).toBeGreaterThanOrEqual(0);
      expect(q).toBeLessThanOrEqual(anterior);
      anterior = q;
    }
  });
  it('com um quadro só, fica sempre nele', () => {
    expect(reverseFrame(0, 1)).toBe(0);
    expect(reverseFrame(1, 1)).toBe(0);
  });
});

describe('titleScale', () => {
  it('encolhe de 1,4 para 1 até REVEAL_AT e depois para', () => {
    expect(titleScale(0)).toBeCloseTo(1.4);
    expect(titleScale(REVEAL_AT)).toBeCloseTo(1);
    expect(titleScale(1)).toBeCloseTo(1);
  });
  it('progresso negativo ou inválido mantém o título grande', () => {
    expect(titleScale(-0.5)).toBeCloseTo(1.4);
    expect(titleScale(NaN)).toBeCloseTo(1.4);
  });
  it('só encolhe conforme o progresso avança', () => {
    let anterior = titleScale(0);
    for (let p = 0; p <= 1; p += 0.01) {
      const s = titleScale(p);
      expect(s).toBeLessThanOrEqual(anterior);
      anterior = s;
    }
  });
});
