import { describe, expect, it } from 'vitest';
import { etapaAero, linhaAero, modoDoPeso, pesoAutomatico } from './linha';

describe('etapaAero', () => {
  it('divide o pin em quatro', () => {
    expect([0, 0.24, 0.25, 0.5, 0.74, 0.75, 1].map(etapaAero)).toEqual([0, 0, 1, 2, 2, 3, 3]);
  });
  it('NaN é o início', () => expect(etapaAero(Number.NaN)).toBe(0));
});

describe('pesoAutomatico', () => {
  it('curva até 30%, reta a partir de 45%', () => {
    expect(pesoAutomatico(0.1)).toBe(0);
    expect(pesoAutomatico(0.3)).toBe(0);
    expect(pesoAutomatico(0.375)).toBeCloseTo(0.5, 10);
    expect(pesoAutomatico(0.45)).toBe(1);
    expect(pesoAutomatico(0.9)).toBe(1);
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
});
