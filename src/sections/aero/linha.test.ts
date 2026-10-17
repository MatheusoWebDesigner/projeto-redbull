import { describe, expect, it } from 'vitest';
import { etapaAero, linhaAero, modoDoPeso, pesoAutomatico } from './linha';

describe('etapaAero', () => {
  it('divide o pin em quatro', () => {
    expect([0, 0.24, 0.25, 0.5, 0.74, 0.75, 1].map(etapaAero)).toEqual([0, 0, 1, 2, 2, 3, 3]);
  });
  it('NaN é o início', () => expect(etapaAero(Number.NaN)).toBe(0));
  it('fora de 0..1 fica na primeira ou na última etapa', () => {
    expect(etapaAero(-0.5)).toBe(0);
    expect(etapaAero(1.5)).toBe(3);
  });
});

describe('pesoAutomatico', () => {
  it('curva até 30%, reta a partir de 45%', () => {
    expect(pesoAutomatico(0.1)).toBe(0);
    expect(pesoAutomatico(0.3)).toBe(0);
    expect(pesoAutomatico(0.375)).toBeCloseTo(0.5, 10);
    expect(pesoAutomatico(0.45)).toBe(1);
    expect(pesoAutomatico(0.9)).toBe(1);
  });
  it('fora de 0..1 e NaN não saem de 0..1', () => {
    expect(pesoAutomatico(-1)).toBe(0);
    expect(pesoAutomatico(Number.NaN)).toBe(0);
    expect(pesoAutomatico(2)).toBe(1);
  });
  it('a asa só abre conforme a rolagem avança, nunca volta', () => {
    const p = Array.from({ length: 1001 }, (_, k) => k / 1000);
    p.slice(1).forEach((v, k) => expect(pesoAutomatico(v)).toBeGreaterThanOrEqual(pesoAutomatico(p[k])));
  });
});

describe('modoDoPeso', () => {
  it('metade para cima é reta', () => {
    expect(modoDoPeso(0.49)).toBe('curva');
    expect(modoDoPeso(0.5)).toBe('reta');
  });
});

describe('linhaAero', () => {
  it('perfil some fora da etapa 2 e aparece inteiro no meio dela', () => {
    expect(linhaAero(0.2).perfil).toBe(0);
    expect(linhaAero(0.6).perfil).toBe(1);
    expect(linhaAero(0.525).perfil).toBeCloseTo(0.5, 10);
    expect(linhaAero(0.735).perfil).toBeCloseTo(0.5, 10);
    expect(linhaAero(0.9).perfil).toBe(0);
  });
  it('câmera fica em A e viaja para C na última etapa', () => {
    expect(linhaAero(0.5).viagem).toBe(0);
    expect(linhaAero(0.825).viagem).toBeCloseTo(0.5, 10);
    expect(linhaAero(0.95).viagem).toBe(1);
  });
  it('fora de 0..1 e NaN ficam nas pontas', () => {
    expect(linhaAero(Number.NaN)).toEqual({ perfil: 0, viagem: 0 });
    expect(linhaAero(-1)).toEqual({ perfil: 0, viagem: 0 });
    expect(linhaAero(2)).toEqual({ perfil: 0, viagem: 1 });
  });
  it('o perfil some antes de a câmera começar a viajar, e a viagem só avança', () => {
    const p = Array.from({ length: 1001 }, (_, k) => k / 1000);
    p.forEach((v) => {
      const { perfil, viagem } = linhaAero(v);
      expect(perfil).toBeGreaterThanOrEqual(0);
      expect(perfil).toBeLessThanOrEqual(1);
      if (viagem > 0) expect(perfil).toBe(0);
    });
    p.slice(1).forEach((v, k) => expect(linhaAero(v).viagem).toBeGreaterThanOrEqual(linhaAero(p[k]).viagem));
  });
});
