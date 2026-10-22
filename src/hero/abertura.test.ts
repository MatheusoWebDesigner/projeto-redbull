import { describe, expect, it } from 'vitest';
import { quadroDaAbertura } from './abertura';

describe('quadroDaAbertura', () => {
  it('30 fps: um quadro a cada 33,3 ms', () => {
    expect(quadroDaAbertura(0)).toBe(0);
    expect(quadroDaAbertura(33.4)).toBe(1);
    expect(quadroDaAbertura(1299)).toBe(38);
  });
  it('acaba depois do quadro 39 (o 40º é o quadro 1 da Hero); tempo negativo é o início', () => {
    expect(quadroDaAbertura(1300)).toBeNull();
    expect(quadroDaAbertura(-5)).toBe(0);
  });
});
