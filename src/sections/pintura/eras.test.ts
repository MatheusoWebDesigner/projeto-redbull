import { describe, expect, it } from 'vitest';
import { brilhoRender, encaixeDaEra, eraAtiva, ERAS, estadoBarras, PONTOS_PINTURA, pistola, progressoNaEra } from './eras';

const amostras = (n: number) => Array.from({ length: n + 1 }, (_, k) => k / n);

describe('ERAS', () => {
  it('tem as 5 eras na ordem', () => {
    expect(ERAS.map((e) => e.ano)).toEqual(['2005', '2010–2013', '2016', '2023', '2026']);
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
  it('em cada encaixe, a era mostrada e o marco ativo batem, e nenhuma passada de tinta está pela metade', () => {
    ERAS.forEach((_, i) => {
      const p = encaixeDaEra(i);
      expect(eraAtiva(p)).toBe(i);
      expect(estadoBarras(eraAtiva(p))[i]).toBe('ativa');
      expect(pistola(p)).toBeNull();
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

describe('pistola (passada de tinta entre duas eras)', () => {
  it('vai de 3/4 da era anterior até 1/4 da seguinte, e a frente cruza a fronteira no meio', () => {
    expect(pistola(0.2)).toEqual({ de: 0, para: 1, frente: 0.5 });
    expect(pistola(0.8)).toEqual({ de: 3, para: 4, frente: 0.5 });
    expect(pistola(0.15 + 0.025)?.frente).toBeCloseTo(0.25, 10);
    expect(pistola(0.2 + 0.04)?.frente).toBeCloseTo(0.9, 10);
  });
  it('fora da janela não há tinta nova (as bordas são exclusivas)', () => {
    expect(pistola(0.15)).toBeNull();
    expect(pistola(0.25)).toBeNull();
    expect(pistola(0.1)).toBeNull();
  });
  it('antes da primeira era, depois da última e com NaN não há passada', () => {
    expect([0, 0.04, 0.97, 1, Number.NaN, -1, 2].map(pistola)).toEqual([null, null, null, null, null, null, null]);
  });
  it('a frente só avança enquanto o pin desce e fica entre 0 e 1', () => {
    let anterior = -1;
    for (const p of amostras(1000).filter((x) => x > 0.15 && x < 0.25)) {
      const f = pistola(p)!.frente;
      expect(f).toBeGreaterThanOrEqual(anterior);
      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThan(1);
      anterior = f;
    }
  });
});
