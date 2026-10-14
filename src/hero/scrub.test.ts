import { describe, expect, it } from 'vitest';
import { chapterIndexFor, frameIndexFor, SNAP_POINTS } from './scrub';

describe('frameIndexFor', () => {
  it('vai do primeiro ao último quadro', () => {
    expect(frameIndexFor(0)).toBe(0);
    expect(frameIndexFor(1)).toBe(239);
  });
  it('arredonda no meio', () => {
    expect(frameIndexFor(0.5)).toBe(120);
  });
  it('limita valores fora de 0..1', () => {
    expect(frameIndexFor(-0.2)).toBe(0);
    expect(frameIndexFor(1.4)).toBe(239);
  });
  it('aceita outra contagem de quadros', () => {
    expect(frameIndexFor(1, 10)).toBe(9);
  });
});

describe('chapterIndexFor', () => {
  it('divide o progresso em 4 capítulos iguais', () => {
    expect(chapterIndexFor(0)).toBe(0);
    expect(chapterIndexFor(0.249)).toBe(0);
    expect(chapterIndexFor(0.25)).toBe(1);
    expect(chapterIndexFor(0.5)).toBe(2);
    expect(chapterIndexFor(0.999)).toBe(3);
  });
  it('o fim da rolagem continua no último capítulo', () => {
    expect(chapterIndexFor(1)).toBe(3);
  });
});

describe('SNAP_POINTS', () => {
  it('encaixa no início de cada capítulo e no fim', () => {
    expect(SNAP_POINTS).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });
});

describe('bordas do progresso', () => {
  it('cada ponto de encaixe abre o capítulo correspondente', () => {
    SNAP_POINTS.slice(0, -1).forEach((snap, i) => {
      expect(chapterIndexFor(snap)).toBe(i);
    });
  });
  it('limita capítulos fora de 0..1', () => {
    expect(chapterIndexFor(-0.5)).toBe(0);
    expect(chapterIndexFor(7)).toBe(3);
  });
  it('todo quadro é alcançável e a sequência nunca volta', () => {
    const seen = new Set<number>();
    let last = -1;
    for (let i = 0; i <= 2390; i++) {
      const frame = frameIndexFor(i / 2390);
      expect(frame).toBeGreaterThanOrEqual(last);
      seen.add(frame);
      last = frame;
    }
    expect(seen.size).toBe(240);
  });
  it('progresso inválido (NaN) cai no início em vez de propagar NaN', () => {
    expect(frameIndexFor(NaN)).toBe(0);
    expect(chapterIndexFor(NaN)).toBe(0);
  });
});
