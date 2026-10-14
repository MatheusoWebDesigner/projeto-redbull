import { describe, expect, it } from 'vitest';
import { coverRect } from './cover';

describe('coverRect', () => {
  it('mesma proporção ocupa o canvas inteiro', () => {
    expect(coverRect(1280, 720, 1920, 1080)).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
  });
  it('tela mais estreita corta as laterais, respeitando o foco horizontal', () => {
    // imagem 16:9 em tela 4:3 (1440x1080): escala 1.5 -> 1920x1080, sobra 480 px
    expect(coverRect(1280, 720, 1440, 1080, 0.5)).toEqual({ x: -240, y: 0, w: 1920, h: 1080 });
    expect(coverRect(1280, 720, 1440, 1080, 1)).toEqual({ x: -480, y: 0, w: 1920, h: 1080 });
  });
  it('tela mais larga corta em cima e embaixo, centralizado', () => {
    // 16:9 em 21:9 (2520x1080): escala 1.96875 -> 2520x1417.5
    const r = coverRect(1280, 720, 2520, 1080);
    expect(r.w).toBeCloseTo(2520);
    expect(r.h).toBeCloseTo(1417.5);
    expect(r.y).toBeCloseTo(-168.75);
  });
});

describe('coverRect nas bordas', () => {
  const telas: [number, number][] = [
    [390, 844], // celular retrato
    [320, 2000], // faixa muito alta
    [3840, 400], // faixa muito larga
    [1, 1],
  ];

  it('sempre cobre o canvas inteiro, sem faixas vazias', () => {
    for (const [dstW, dstH] of telas) {
      for (const focusX of [0, 0.5, 1]) {
        const r = coverRect(1920, 1080, dstW, dstH, focusX);
        expect(r.x).toBeLessThanOrEqual(0);
        expect(r.y).toBeLessThanOrEqual(0);
        expect(r.x + r.w).toBeGreaterThanOrEqual(dstW - 1e-9);
        expect(r.y + r.h).toBeGreaterThanOrEqual(dstH - 1e-9);
      }
    }
  });
  it('preserva a proporção da imagem', () => {
    for (const [dstW, dstH] of telas) {
      const r = coverRect(1920, 1080, dstW, dstH);
      expect(r.w / r.h).toBeCloseTo(1920 / 1080);
    }
  });
  it('foco 0 encosta a esquerda e foco 1 encosta a direita', () => {
    const left = coverRect(1920, 1080, 390, 844, 0);
    const right = coverRect(1920, 1080, 390, 844, 1);
    expect(left.x).toBeCloseTo(0);
    expect(right.x + right.w).toBeCloseTo(390);
  });
  it('quando o corte é vertical, o foco horizontal não desloca a imagem', () => {
    for (const focusX of [0, 0.5, 1]) {
      expect(coverRect(1920, 1080, 3840, 400, focusX).x).toBeCloseTo(0);
    }
  });
});
