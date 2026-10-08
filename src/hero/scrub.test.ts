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
