import { describe, expect, it } from 'vitest';
import { nivelDeVelocidade, suavizar } from './velocidade';

describe('nivelDeVelocidade', () => {
  it('normaliza para −1…1 com sinal (descendo é positivo)', () => {
    expect(nivelDeVelocidade(30)).toBe(0.5);
    expect(nivelDeVelocidade(-200)).toBe(-1);
    expect(nivelDeVelocidade(0)).toBe(0);
  });
  it('velocidade inválida vale parado', () => {
    expect(nivelDeVelocidade(NaN)).toBe(0);
  });
});

describe('suavizar', () => {
  it('meia-vida de 90 ms, sem depender da taxa de quadros', () => {
    expect(suavizar(0, 1, 90)).toBeCloseTo(0.5);
    expect(suavizar(0, 1, 45)).toBeCloseTo(1 - 2 ** -0.5);
    expect(suavizar(suavizar(0, 1, 45), 1, 45)).toBeCloseTo(suavizar(0, 1, 90));
  });
  it('quase parado vira exatamente 0 (para de escrever no DOM)', () => {
    expect(suavizar(0.001, 0, 16)).toBe(0);
    expect(suavizar(-0.001, 0, 16)).toBe(0);
  });
  it('intervalo inválido não mexe no valor', () => {
    expect(suavizar(0.4, 1, NaN)).toBe(0.4);
  });
});
