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
