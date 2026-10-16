import { describe, expect, it } from 'vitest';
import { geometriaPerfil, type DadosPerfil } from './perfil';

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
  it('a corda amarela é a do flap superior na reta', () => {
    expect(g.amarela).toEqual([[1431.2, 612.9], [1737.3, 578.6]]);
  });
  it('o arco liga os dois ângulos em volta da dobradiça', () => {
    expect(g.arco.centro).toEqual([1467.9, 608.8]);
    expect(g.arco.de).toBeCloseTo(Math.atan2(578.6 - 612.9, 1737.3 - 1431.2), 10);
    expect(g.arco.ate).toBeCloseTo(Math.atan2(444.8 - 631.2, 1681.1 - 1438.8), 10);
  });
});
