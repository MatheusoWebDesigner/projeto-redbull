import { describe, expect, it } from 'vitest';
import { geometriaPerfil, svgPerfil, type DadosPerfil } from './perfil';

const dados: DadosPerfil = {
  resolucao: [1920, 1200],
  curva: {
    plano_principal_fixo: { bordo_de_ataque: [710.7, 658.6], bordo_de_fuga: [1194.8, 764.3] },
    tras_flap1: { bordo_de_ataque: [1161, 709.3], bordo_de_fuga: [1505.7, 664.4] },
    tras_flap2: { bordo_de_ataque: [1438.8, 631.2], bordo_de_fuga: [1681.1, 444.8] },
  },
  reta: {
    plano_principal_fixo: { bordo_de_ataque: [710.7, 658.6], bordo_de_fuga: [1194.8, 764.3] },
    tras_flap1: { bordo_de_ataque: [1160.6, 698.2], bordo_de_fuga: [1508.5, 746.2] },
    tras_flap2: { bordo_de_ataque: [1431.2, 612.9], bordo_de_fuga: [1737.3, 578.6] },
  },
  dobradica_flap2: [1467.9, 608.8],
};

describe('geometriaPerfil', () => {
  const g = geometriaPerfil(dados);
  it('a corda tracejada do flap superior na curva vai além do bordo de fuga', () => {
    const [a, b] = g.tracejada;
    expect(a).toEqual([1438.8, 631.2]);
    expect(b[0]).toBeGreaterThan(1681.1);
    expect(b[1]).toBeLessThan(444.8);
  });
  it('a extensão segue a mesma reta da corda', () => {
    const [a, b] = g.tracejada;
    const fuga = dados.curva.tras_flap2.bordo_de_fuga;
    const cruz = (fuga[0] - a[0]) * (b[1] - a[1]) - (fuga[1] - a[1]) * (b[0] - a[0]);
    expect(cruz).toBeCloseTo(0, 6);
  });
  it('a corda amarela é a do flap superior na reta', () => {
    expect(g.amarela).toEqual([[1431.2, 612.9], [1737.3, 578.6]]);
  });
  it('o arco liga os dois ângulos em volta da dobradiça', () => {
    expect(g.arco.centro).toEqual([1467.9, 608.8]);
    expect(g.arco.de).toBeCloseTo(Math.atan2(578.6 - 612.9, 1737.3 - 1431.2), 10);
    expect(g.arco.ate).toBeCloseTo(Math.atan2(444.8 - 631.2, 1681.1 - 1438.8), 10);
  });
});

describe('svgPerfil', () => {
  const g = geometriaPerfil(dados);
  const svg = svgPerfil(g, dados.resolucao);
  const numeros = (txt: string) => (txt.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi) ?? []).map(Number);

  it('usa a resolução do render como viewBox', () => {
    expect(svg).toMatch(/viewBox="0 0 1920 1200"/);
  });
  it('só tem números finitos nos atributos (nada de NaN ou Infinity)', () => {
    expect(svg).not.toMatch(/NaN|Infinity|undefined/);
    const ds = [...svg.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]);
    expect(ds).toHaveLength(3);
    ds.forEach((d) => {
      expect(d).toMatch(/^M-?[\d.]+ -?[\d.]+ [LA]/);
      const n = numeros(d);
      expect(n.length).toBeGreaterThanOrEqual(4);
      n.forEach((v) => expect(Number.isFinite(v)).toBe(true));
    });
  });
  it('as pontas do arco ficam no raio, em volta da dobradiça', () => {
    const arco = [...svg.matchAll(/ d="([^"]*)"/g)][2][1];
    const n = numeros(arco); // x0 y0 rx ry rot large sweep x1 y1
    expect(n).toHaveLength(9);
    const [cx, cy] = g.arco.centro;
    [[n[0], n[1]], [n[7], n[8]]].forEach(([x, y]) => expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(g.arco.raio, 0));
  });
});
