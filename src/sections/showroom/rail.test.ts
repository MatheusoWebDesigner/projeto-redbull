import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../../three/convert';
import { catmullRom, easeInOut, encaixeMaisProximo, estadoBarras, paradaAtiva, railU } from './rail';

describe('easeInOut (power2.inOut)', () => {
  it('fixa as pontas e o meio', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.25)).toBe(0.125);
  });
});

describe('railU', () => {
  it('passa exatamente pelas 6 paradas', () => {
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((p) => expect(railU(p)).toBeCloseTo(p, 10));
  });
  it('desacelera perto da parada', () => {
    expect(railU(0.05)).toBeCloseTo(0.025, 10);
    expect(railU(0.25)).toBeCloseTo(0.225, 10);
  });
  it('limita progresso fora de 0..1 e trata NaN como início', () => {
    expect(railU(-1)).toBe(0);
    expect(railU(2)).toBe(1);
    expect(railU(Number.NaN)).toBe(0);
  });
});

describe('paradaAtiva', () => {
  it('troca na metade do caminho entre paradas', () => {
    expect(paradaAtiva(0)).toBe(0);
    expect(paradaAtiva(0.09)).toBe(0);
    expect(paradaAtiva(0.1)).toBe(1);
    expect(paradaAtiva(1)).toBe(5);
  });
});

describe('catmullRom', () => {
  const pts: Vec3[] = [[0, 0, 0], [1, 2, 0], [3, 2, 1], [4, 0, 1]];
  it('passa pelos pontos de controle', () => {
    pts.forEach((p, i) => {
      const r = catmullRom(pts, i / (pts.length - 1));
      r.forEach((v, k) => expect(v).toBeCloseTo(p[k], 10));
    });
  });
  it('é contínua entre os pontos', () => {
    const a = catmullRom(pts, 0.5 - 1e-6);
    const b = catmullRom(pts, 0.5 + 1e-6);
    a.forEach((v, k) => expect(v).toBeCloseTo(b[k], 4));
  });
});

describe('estadoBarras', () => {
  it('na visão geral fica tudo apagado', () => {
    expect(estadoBarras(0)).toEqual(['apagada', 'apagada', 'apagada', 'apagada', 'apagada']);
  });
  it('na parada 3 tem duas vistas e uma ativa', () => {
    expect(estadoBarras(3)).toEqual(['vista', 'vista', 'ativa', 'apagada', 'apagada']);
  });
});

describe('encaixeMaisProximo', () => {
  const pontos = [0, 0.48, 0.62, 1];
  it('devolve o ponto mais próximo', () => {
    expect(encaixeMaisProximo(0.2, pontos)).toBe(0);
    expect(encaixeMaisProximo(0.3, pontos)).toBe(0.48);
    expect(encaixeMaisProximo(0.9, pontos)).toBe(1);
  });
});
