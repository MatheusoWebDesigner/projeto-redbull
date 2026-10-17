import { describe, expect, it } from 'vitest';
import { alvoAreaBlender, blenderToThree, fitFov, radianciaArea, viewOffset } from './convert';

describe('blenderToThree', () => {
  it('troca Z para cima por Y para cima: (x, y, z) -> (x, z, -y)', () => {
    expect(blenderToThree([1, 2, 3])).toEqual([1, 3, -2]);
  });
  it('não produz -0', () => {
    expect(Object.is(blenderToThree([0, 0, 0])[2], 0)).toBe(true);
  });
});

describe('viewOffset', () => {
  it('desloca em fração do maior lado; y invertido (tela cresce para baixo)', () => {
    const o = viewOffset(-0.1965, -0.0362, 1440, 900);
    expect(o.x).toBeCloseTo(-282.96, 2);
    expect(o.y).toBeCloseTo(52.128, 2);
  });
  it('em retrato o maior lado é a altura', () => {
    const o = viewOffset(0.0358, 0.2204, 390, 844);
    expect(o.x).toBeCloseTo(30.215, 2);
    expect(o.y).toBeCloseTo(-186.018, 2);
  });
  it('sem shift não desloca (e não gera -0)', () => {
    const o = viewOffset(0, 0, 1440, 900);
    expect(Object.is(o.x, 0) && Object.is(o.y, 0)).toBe(true);
  });
});

describe('fitFov', () => {
  it('mantém o fov vertical quando a tela é igual ou mais larga que o render', () => {
    expect(fitFov(31.312, 1.6, 1.6)).toBe(31.312);
    expect(fitFov(31.312, 1.6, 2.2)).toBe(31.312);
  });
  it('abre o fov vertical quando a tela é mais estreita, para não cortar nas laterais', () => {
    expect(fitFov(31.312, 1.6, 1.2)).toBeCloseTo(40.979, 2);
    expect(fitFov(48.119, 1080 / 2340, 0.4)).toBeCloseTo(54.512, 2);
  });
  it('não salta ao cruzar o aspecto do render', () => {
    expect(fitFov(31.312, 1.6, 1.6 - 1e-9)).toBeCloseTo(31.312, 6);
  });
  it('quanto mais estreita a tela, mais aberto o fov, sem chegar a 180°', () => {
    const aspectos = [1.5, 1.2, 0.9, 0.6, 0.3, 0.1, 0.01];
    const fovs = aspectos.map((a) => fitFov(31.312, 1.6, a));
    fovs.slice(1).forEach((f, k) => expect(f).toBeGreaterThan(fovs[k]));
    expect(fovs[fovs.length - 1]).toBeLessThan(180);
  });
});

describe('radianciaArea', () => {
  it('espalha a potência da luz de área do Blender pela área e pelo hemisfério (P / (π·A))', () => {
    expect(radianciaArea(1200, 6.5, 3)).toBeCloseTo(1200 / (Math.PI * 19.5), 10);
  });
  it('área zero não vira infinito', () => {
    expect(radianciaArea(100, 0, 1)).toBe(0);
  });
});

describe('alvoAreaBlender', () => {
  it('sem rotação a luz de área aponta para baixo (−Z do Blender)', () => {
    const a = alvoAreaBlender([1, 2, 5], [0, 0, 0]);
    [1, 2, 4].forEach((v, k) => expect(a[k]).toBeCloseTo(v, 10));
  });
  it('euler XYZ (72,6°, 0, 119,8°) do recorte traseiro aponta para o carro', () => {
    const a = alvoAreaBlender([0, 0, 0], [72.6, 0, 119.8]);
    [-0.828, -0.474, -0.299].forEach((v, k) => expect(a[k]).toBeCloseTo(v, 3));
  });
});
