import { describe, expect, it } from 'vitest';
import { faixaX } from './faixas';

describe('faixaX', () => {
  it('começa toda fora da tela à esquerda e termina toda fora à direita', () => {
    expect(faixaX(0, 1440, 900) + 900).toBeLessThanOrEqual(0);
    expect(faixaX(1, 1440, 900)).toBeGreaterThanOrEqual(1440);
  });
  it('anda sempre para a direita conforme a rolagem desce', () => {
    expect(faixaX(0.5, 1440, 900)).toBeGreaterThan(faixaX(0.25, 1440, 900));
    expect(faixaX(0.75, 390, 600)).toBeGreaterThan(faixaX(0.5, 390, 600));
  });
  it('progresso inválido ou fora de 0–1 fica nas pontas', () => {
    expect(faixaX(NaN, 1440, 900)).toBe(faixaX(0, 1440, 900));
    expect(faixaX(3, 1440, 900)).toBe(faixaX(1, 1440, 900));
  });
});
