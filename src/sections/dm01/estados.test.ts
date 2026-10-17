import { describe, expect, it } from 'vitest';
import dados from '../../data/dm01.json';
import type { Vec3 } from '../../three/convert';
import { barra5050, type Estado, ESTADOS, estadoContinuo, etapaDm01, giroGraus, interpolarNumero, interpolarVetor, PONTOS_DM01, rotulosVisiveis } from './estados';

const tab: Record<Estado, Vec3> = { E0: [0, 0, 0], E1: [1, 0, 0], E2: [2, 0, 0], E3: [3, 1, 0] };
const amostras = (n: number) => Array.from({ length: n + 1 }, (_, k) => k / n);

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
  it('segue os estados ao longo do pin', () => {
    expect(interpolarVetor(tab, 0.1)).toEqual([0, 0, 0]);
    expect(interpolarVetor(tab, 0.3)).toEqual([0.5, 0, 0]);
    expect(interpolarVetor(tab, 0.45)).toEqual([1, 0, 0]);
    expect(interpolarVetor(tab, 0.9)).toEqual([3, 1, 0]);
  });
  it('não salta nas fronteiras das janelas: um passo de 1e-4 no pin move no máximo 3 mm', () => {
    // inclinação máxima: easeInOut (2) × rampa (1 / 0,1) × maior salto da tabela (√2) ≈ 2,83e-3 por passo
    const v = amostras(10_000).map((p) => interpolarVetor(tab, p));
    const maiorPasso = Math.max(...v.slice(1).map((b, k) => Math.hypot(b[0] - v[k][0], b[1] - v[k][1], b[2] - v[k][2])));
    expect(maiorPasso).toBeLessThan(3e-3);
  });
  it('com as tabelas reais do dm01.json, nenhuma peça volta em direção ao motor enquanto o pin avança', () => {
    const pecas = dados.pecas as unknown as Record<string, Record<Estado, Vec3>>;
    const voltas: string[] = [];
    for (const [nome, t] of Object.entries(pecas)) {
      const d = amostras(1000).map((p) => Math.hypot(...interpolarVetor(t, p)));
      d.slice(1).forEach((b, k) => { if (b < d[k] - 1e-12) voltas.push(`${nome} em p=${(k + 1) / 1000}`); });
    }
    expect(voltas).toEqual([]);
  });
  it('números, como a potência das luzes', () => {
    expect(interpolarNumero({ E0: 650, E1: 650, E2: 650, E3: 480 }, 0.8)).toBeCloseTo(565, 10);
  });
});

describe('PONTOS_DM01', () => {
  it('cada encaixe mostra a sua etapa, com o motor já no estado dela', () => {
    PONTOS_DM01.forEach((p, i) => {
      expect(etapaDm01(p)).toBe(i);
      expect(interpolarVetor(tab, p)).toEqual(tab[ESTADOS[i]]);
    });
  });
});

describe('NaN e p fora de 0..1', () => {
  it('estadoContinuo para no motor montado antes do pin e no E3 depois dele', () => {
    for (const p of [Number.NaN, -1, -Infinity]) expect(estadoContinuo(p)).toEqual({ de: 'E0', para: 'E1', t: 0 });
    for (const p of [1.5, Infinity]) expect(estadoContinuo(p)).toEqual({ de: 'E2', para: 'E3', t: 1 });
  });
  it('etapa, giro e barra também param nas pontas', () => {
    expect([-1, 2].map(etapaDm01)).toEqual([0, 3]);
    expect([Number.NaN, -1, 2].map(giroGraus)).toEqual([0, 0, 8]);
    expect([Number.NaN, -1, 2].map(barra5050)).toEqual([0, 0, 1]);
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
