import { describe, expect, it } from 'vitest';
import { POSICOES_ROTULOS, pontoDeSaida, pontoNoCover } from './rotulos';

describe('pontoDeSaida', () => {
  const caixa = { x: 100, y: 100, w: 150, h: 45 };
  it('peça abaixo e à direita: sai do canto inferior direito', () => {
    expect(pontoDeSaida(caixa, [400, 300])).toEqual([250, 145]);
  });
  it('peça logo abaixo: sai da borda de baixo, na mesma vertical', () => {
    expect(pontoDeSaida(caixa, [180, 300])).toEqual([180, 145]);
  });
  it('peça à esquerda e acima: sai do canto superior esquerdo', () => {
    expect(pontoDeSaida(caixa, [10, 10])).toEqual([100, 100]);
  });
  it('peça atrás da caixa: a linha guia sai do próprio alvo', () => {
    expect(pontoDeSaida(caixa, [150, 120])).toEqual([150, 120]);
  });
});

describe('pontoNoCover', () => {
  it('render com o mesmo formato da tela só escala', () => {
    expect(pontoNoCover([960, 600], [1920, 1200], [1440, 900])).toEqual([720, 450]);
  });
  it('tela mais larga: corta em cima e embaixo', () => {
    const [x, y] = pontoNoCover([0, 0], [1920, 1200], [1920, 900]);
    expect(x).toBe(0);
    expect(y).toBe(-150);
  });
  it('tela mais alta (celular): corta nas laterais, por igual, e preenche a altura', () => {
    // escala 844/1200: o render fica com 1350,4 px de largura, sobram 480,2 px de cada lado
    const cantoA = pontoNoCover([0, 0], [1920, 1200], [390, 844]);
    const cantoB = pontoNoCover([1920, 1200], [1920, 1200], [390, 844]);
    const centro = pontoNoCover([960, 600], [1920, 1200], [390, 844]);
    [-480.2, 0].forEach((v, k) => expect(cantoA[k]).toBeCloseTo(v, 9));
    [870.2, 844].forEach((v, k) => expect(cantoB[k]).toBeCloseTo(v, 9));
    [195, 422].forEach((v, k) => expect(centro[k]).toBeCloseTo(v, 9));
  });
});

describe('POSICOES_ROTULOS', () => {
  it('as 5 peças têm posição nas 4 etapas, dentro do quadro', () => {
    for (const ap of ['desktop', 'mobile'] as const) {
      const { quadro, etapas } = POSICOES_ROTULOS[ap];
      expect(etapas).toHaveLength(4);
      for (const e of etapas) {
        expect(Object.keys(e).sort()).toEqual(['bateria', 'eletronica', 'mgu-k', 'turbo', 'v6']);
        for (const [x, y] of Object.values(e)) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(quadro[0]);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThan(quadro[1]);
        }
      }
    }
  });
});
