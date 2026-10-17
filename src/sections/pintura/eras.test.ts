import { describe, expect, it } from 'vitest';
import { brilhoRender, encaixeDaEra, eraAtiva, ERAS, estadoBarras, FIM_TRAVESSIA, opacidadeRender, PONTOS_PINTURA, posicaoReflexo, progressoNaEra, reflexoVisivel } from './eras';

const amostras = (n: number) => Array.from({ length: n + 1 }, (_, k) => k / n);

describe('ERAS', () => {
  it('tem as 5 eras na ordem, com o acabamento de cada uma', () => {
    expect(ERAS.map((e) => e.ano)).toEqual(['2005', '2010–2013', '2016', '2023', '2026']);
    expect(ERAS.map((e) => e.acabamento)).toEqual(['brilhante', 'brilhante', 'fosco', 'fosco', 'brilhante']);
  });
  it('usa a cor-base da tabela da spec no chip', () => {
    expect(ERAS.map((e) => e.cor)).toEqual(['#102154', '#14204A', '#1B2A6B', '#121F45', '#153380']);
  });
});

describe('eraAtiva', () => {
  it('cada era ocupa 20% do pin', () => {
    expect(eraAtiva(0)).toBe(0);
    expect(eraAtiva(0.1)).toBe(0);
    expect(eraAtiva(0.3)).toBe(1);
    expect(eraAtiva(0.5)).toBe(2);
    expect(eraAtiva(0.7)).toBe(3);
    expect(eraAtiva(0.9)).toBe(4);
    expect(eraAtiva(1)).toBe(4);
  });
  it('troca na metade do caminho entre dois encaixes', () => {
    expect(eraAtiva(0.19999)).toBe(0);
    expect(eraAtiva(0.2)).toBe(1);
    expect(eraAtiva(0.6)).toBe(3);
    expect(eraAtiva(0.8)).toBe(4);
  });
  it('NaN e valores fora de 0..1 caem nas pontas', () => {
    expect(eraAtiva(Number.NaN)).toBe(0);
    expect(eraAtiva(-1)).toBe(0);
    expect(eraAtiva(2)).toBe(4);
  });
  it('nunca volta para uma era anterior enquanto o pin avança, e passa pelas 5', () => {
    const v = amostras(1000).map(eraAtiva);
    v.slice(1).forEach((e, k) => expect(e).toBeGreaterThanOrEqual(v[k]));
    expect([...new Set(v)]).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('PONTOS_PINTURA e encaixeDaEra', () => {
  it('o encaixe fica no meio de cada era', () => {
    expect(PONTOS_PINTURA).toEqual([0.1, 0.3, 0.5, 0.7, 0.9]);
    PONTOS_PINTURA.forEach((p, i) => expect(eraAtiva(p)).toBe(i));
  });
  it('encaixeDaEra devolve o ponto de cada era e limita o índice', () => {
    expect(encaixeDaEra(0)).toBe(0.1);
    expect(encaixeDaEra(4)).toBe(0.9);
    expect(encaixeDaEra(9)).toBe(0.9);
    expect(encaixeDaEra(-3)).toBe(0.1);
  });
  it('encaixeDaEra(NaN) vai para o encaixe da primeira era, nunca undefined', () => {
    expect(encaixeDaEra(Number.NaN)).toBe(0.1);
  });
  it('em cada encaixe, a era mostrada, o marco ativo e o reflexo parado no centro do chip batem', () => {
    ERAS.forEach((_, i) => {
      const p = encaixeDaEra(i);
      expect(eraAtiva(p)).toBe(i);
      expect(estadoBarras(eraAtiva(p))[i]).toBe('ativa');
      if (i < ERAS.length - 1) expect(posicaoReflexo(p)).toBeCloseTo(0.5, 10);
    });
  });
});

describe('progressoNaEra', () => {
  it('vai de 0 a 1 dentro de cada era', () => {
    expect(progressoNaEra(0)).toBe(0);
    expect(progressoNaEra(0.1)).toBeCloseTo(0.5, 10);
    expect(progressoNaEra(0.25)).toBeCloseTo(0.25, 10);
    expect(progressoNaEra(0.9)).toBeCloseTo(0.5, 10);
    expect(progressoNaEra(1)).toBe(1);
  });
  it('NaN vira o início', () => {
    expect(progressoNaEra(Number.NaN)).toBe(0);
  });
});

describe('posicaoReflexo', () => {
  it('nas eras 0 a 3 a faixa atravessa o chip uma vez por era', () => {
    expect(posicaoReflexo(0)).toBe(0);
    expect(posicaoReflexo(0.1)).toBeCloseTo(0.5, 10);
    expect(posicaoReflexo(0.3)).toBeCloseTo(0.5, 10);
    expect(posicaoReflexo(0.39)).toBeCloseTo(0.95, 10);
  });
  it('na última era atravessa só até o chip se expandir e para do outro lado', () => {
    expect(posicaoReflexo(0.8)).toBe(0);
    expect(posicaoReflexo(0.8 + 0.2 * FIM_TRAVESSIA / 2)).toBeCloseTo(0.5, 10);
    expect(posicaoReflexo(0.8 + 0.2 * FIM_TRAVESSIA)).toBeCloseTo(1, 10);
    expect(posicaoReflexo(1)).toBe(1);
  });
  it('fica sempre entre 0 e 1', () => {
    amostras(400).forEach((p) => {
      expect(posicaoReflexo(p)).toBeGreaterThanOrEqual(0);
      expect(posicaoReflexo(p)).toBeLessThanOrEqual(1);
    });
  });
});

describe('reflexoVisivel', () => {
  it('só aparece nas eras brilhantes e some quando o chip vira render', () => {
    expect([0.1, 0.3, 0.5, 0.7].map(reflexoVisivel)).toEqual([true, true, false, false]);
    expect(reflexoVisivel(0.81)).toBe(true);
    expect(reflexoVisivel(0.9)).toBe(false);
  });
});

describe('NaN e p fora de 0..1 no reflexo e no render', () => {
  it('antes do pin: chip da primeira era, faixa na borda esquerda; depois: render no brilho_b', () => {
    expect([Number.NaN, -1, 2].map(posicaoReflexo)).toEqual([0, 0, 1]);
    expect([Number.NaN, -1, 2].map(reflexoVisivel)).toEqual([true, true, false]);
    expect([Number.NaN, -1, 2].map(opacidadeRender)).toEqual([0, 0, 1]);
    expect([-1, 2].map(brilhoRender)).toEqual([0, 1]);
  });
});

describe('opacidadeRender', () => {
  it('0 antes da travessia da última era e 1 depois', () => {
    expect(opacidadeRender(0)).toBe(0);
    expect(opacidadeRender(0.7)).toBe(0);
    expect(opacidadeRender(0.8)).toBe(0);
    expect(opacidadeRender(0.8 + 0.2 * FIM_TRAVESSIA - 1e-6)).toBe(0);
    expect(opacidadeRender(0.8 + 0.2 * FIM_TRAVESSIA)).toBe(1);
    expect(opacidadeRender(0.9)).toBe(1);
    expect(opacidadeRender(1)).toBe(1);
  });
  it('a travessia termina antes do encaixe da última era', () => {
    expect(opacidadeRender(PONTOS_PINTURA[4])).toBe(1);
  });
});

describe('brilhoRender (crossfade brilho_a → brilho_b)', () => {
  it('fica em brilho_a no encaixe e chega a brilho_b no fim do pin', () => {
    expect(brilhoRender(0.5)).toBe(0);
    expect(brilhoRender(0.9)).toBe(0);
    expect(brilhoRender(0.95)).toBeCloseTo(0.5, 10);
    expect(brilhoRender(1)).toBe(1);
  });
  it('é monótono e fica entre 0 e 1', () => {
    const v = amostras(400).map(brilhoRender);
    v.slice(1).forEach((b, k) => expect(b).toBeGreaterThanOrEqual(v[k]));
    v.forEach((b) => { expect(b).toBeGreaterThanOrEqual(0); expect(b).toBeLessThanOrEqual(1); });
  });
  it('NaN vira o início', () => {
    expect(brilhoRender(Number.NaN)).toBe(0);
  });
});

describe('estadoBarras', () => {
  it('marco atual ativo, anteriores passados e seguintes futuros', () => {
    expect(estadoBarras(0)).toEqual(['ativa', 'futura', 'futura', 'futura', 'futura']);
    expect(estadoBarras(2)).toEqual(['passada', 'passada', 'ativa', 'futura', 'futura']);
    expect(estadoBarras(4)).toEqual(['passada', 'passada', 'passada', 'passada', 'ativa']);
  });
});
