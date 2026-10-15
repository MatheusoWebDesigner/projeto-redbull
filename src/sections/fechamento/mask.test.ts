import { describe, expect, it } from 'vitest';
import { REVEAL_AT, reverseFrame, titleScale } from './mask';

describe('reverseFrame', () => {
  it('toca a Hero de trás para a frente', () => {
    expect(reverseFrame(0, 240)).toBe(239);
    expect(reverseFrame(1, 240)).toBe(0);
    expect(reverseFrame(0.5, 240)).toBe(120);
  });
  it('limita o progresso', () => expect(reverseFrame(2, 240)).toBe(0));
});

describe('titleScale', () => {
  it('encolhe de 1,4 para 1 até REVEAL_AT e depois para', () => {
    expect(titleScale(0)).toBeCloseTo(1.4);
    expect(titleScale(REVEAL_AT)).toBeCloseTo(1);
    expect(titleScale(1)).toBeCloseTo(1);
  });
});
