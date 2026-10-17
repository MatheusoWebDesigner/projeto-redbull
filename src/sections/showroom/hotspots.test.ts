import { describe, expect, it } from 'vitest';
import { estadoHotspot, ladoDoRotulo, PECAS } from './hotspots';

const base = { indice: 0, parada: 1, visivelNaPose: true, noQuadro: true, x: 900, zonaTexto: 520 };

describe('estadoHotspot', () => {
  it('a peça da parada atual fica ativa e visível', () => {
    expect(estadoHotspot(base)).toEqual({ ativo: true, visivel: true });
  });
  it('fora do quadro ou oculto na pose não aparece', () => {
    expect(estadoHotspot({ ...base, noQuadro: false }).visivel).toBe(false);
    expect(estadoHotspot({ ...base, visivelNaPose: false }).visivel).toBe(false);
  });
  it('inativo dentro da zona do texto fica oculto; ativo não', () => {
    expect(estadoHotspot({ ...base, parada: 3, x: 400 }).visivel).toBe(false);
    expect(estadoHotspot({ ...base, x: 400 }).visivel).toBe(true);
  });
  it('cada parada de 1 a 5 ativa só a sua peça', () => {
    [1, 2, 3, 4, 5].forEach((parada) => {
      const ativos = PECAS.map((_, i) => estadoHotspot({ ...base, indice: i, parada }).ativo);
      expect(ativos).toEqual(PECAS.map((_, i) => i === parada - 1));
    });
  });
  it('no celular (sem coluna de texto, zonaTexto 0) os inativos no quadro aparecem', () => {
    expect(estadoHotspot({ ...base, parada: 3, x: 40, zonaTexto: 0 }).visivel).toBe(true);
  });
  it('na visão geral (parada 0) nenhum é ativo', () => {
    PECAS.forEach((_, i) => expect(estadoHotspot({ ...base, indice: i, parada: 0 }).ativo).toBe(false));
  });
});

describe('ladoDoRotulo', () => {
  it('o rótulo fica à esquerda do ponto', () => {
    expect(ladoDoRotulo(1200, 160, 520)).toBe('esquerda');
  });
  it('vira para a direita quando invadiria a zona do texto', () => {
    expect(ladoDoRotulo(640, 160, 520)).toBe('direita');
  });
  it('no celular (zonaTexto 0) vira para a direita em vez de sair pela borda esquerda', () => {
    expect(ladoDoRotulo(100, 160, 0)).toBe('direita');
  });
});
