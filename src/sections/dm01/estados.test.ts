import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../../three/convert';
import { barra5050, estadoContinuo, etapaDm01, giroGraus, interpolarNumero, interpolarVetor, rotulosVisiveis } from './estados';

describe('etapaDm01', () => {
  it('divide o pin em quatro e trata NaN como início', () => {
    expect([0, 0.24, 0.25, 0.5, 0.75, 1, Number.NaN].map(etapaDm01)).toEqual([0, 0, 1, 2, 3, 3, 0]);
  });
});

describe('estadoContinuo', () => {
  it('fica montado (E0) na primeira etapa', () => {
    expect(estadoContinuo(0.1)).toEqual({ de: 'E0', para: 'E1', t: 0 });
  });
  it('abre E0 → E1 entre 25% e 35%', () => {
    expect(estadoContinuo(0.3)).toEqual({ de: 'E0', para: 'E1', t: 0.5 });
    expect(estadoContinuo(0.4)).toEqual({ de: 'E1', para: 'E2', t: 0 });
  });
  it('abre E1 → E2 entre 50% e 60% e E2 → E3 entre 75% e 85%', () => {
    const a = estadoContinuo(0.55);
    expect([a.de, a.para]).toEqual(['E1', 'E2']);
    expect(a.t).toBeCloseTo(0.5, 10);
    const b = estadoContinuo(0.8);
    expect([b.de, b.para]).toEqual(['E2', 'E3']);
    expect(b.t).toBeCloseTo(0.5, 10);
    expect(estadoContinuo(1)).toEqual({ de: 'E2', para: 'E3', t: 1 });
  });
});

describe('interpolarVetor e interpolarNumero', () => {
  const tab: Record<'E0' | 'E1' | 'E2' | 'E3', Vec3> = { E0: [0, 0, 0], E1: [1, 0, 0], E2: [2, 0, 0], E3: [3, 1, 0] };
  it('segue os estados ao longo do pin', () => {
    expect(interpolarVetor(tab, 0.1)).toEqual([0, 0, 0]);
    expect(interpolarVetor(tab, 0.3)).toEqual([0.5, 0, 0]);
    expect(interpolarVetor(tab, 0.45)).toEqual([1, 0, 0]);
    expect(interpolarVetor(tab, 0.9)).toEqual([3, 1, 0]);
  });
  it('números, como a potência das luzes', () => {
    expect(interpolarNumero({ E0: 650, E1: 650, E2: 650, E3: 480 }, 0.8)).toBeCloseTo(565, 10);
  });
});

describe('giroGraus', () => {
  it('gira até 8° durante a primeira etapa e para', () => {
    expect(giroGraus(0)).toBe(0);
    expect(giroGraus(0.125)).toBeCloseTo(4, 10);
    expect(giroGraus(0.25)).toBe(8);
    expect(giroGraus(0.9)).toBe(8);
  });
});

describe('barra5050', () => {
  it('preenche entre 85% e 95%', () => {
    expect(barra5050(0.8)).toBe(0);
    expect(barra5050(0.9)).toBeCloseTo(0.5, 10);
    expect(barra5050(1)).toBe(1);
  });
});

describe('rotulosVisiveis', () => {
  it('vermelhos a partir de Fogo, azuis a partir de Faísca', () => {
    expect(rotulosVisiveis(0)).toEqual({ termico: false, eletrico: false });
    expect(rotulosVisiveis(1)).toEqual({ termico: true, eletrico: false });
    expect(rotulosVisiveis(2)).toEqual({ termico: true, eletrico: true });
    expect(rotulosVisiveis(3)).toEqual({ termico: true, eletrico: true });
  });
});
