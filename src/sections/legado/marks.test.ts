import { describe, expect, it } from 'vitest';
import { CONSTRUTORES, PILOTOS, titleMarks } from './marks';

describe('titleMarks', () => {
  const m = titleMarks(2005, 2026, CONSTRUTORES, PILOTOS);
  it('um marco por ano, de 2005 a 2026', () => {
    expect(m).toHaveLength(22);
    expect(m[0].ano).toBe(2005);
    expect(m.at(-1)?.ano).toBe(2026);
  });
  it('posição vai de 0 a 1', () => {
    expect(m[0].x).toBe(0);
    expect(m.at(-1)?.x).toBe(1);
  });
  it('conta 6 títulos de construtores e 8 de pilotos', () => {
    expect(m.filter((a) => a.construtores)).toHaveLength(6);
    expect(m.filter((a) => a.pilotos)).toHaveLength(8);
  });
  it('2021 e 2024 têm só título de pilotos', () => {
    for (const ano of [2021, 2024]) {
      const a = m.find((x) => x.ano === ano);
      expect(a?.pilotos).toBe(true);
      expect(a?.construtores).toBe(false);
    }
  });
  it('anos espaçados por igual', () => {
    for (let i = 1; i < m.length; i++) expect(m[i].x - m[i - 1].x).toBeCloseTo(1 / 21);
  });
  it('intervalo de um ano só não gera posição inválida', () => {
    expect(titleMarks(2010, 2010, CONSTRUTORES, PILOTOS)).toEqual([{ ano: 2010, x: 0, construtores: true, pilotos: true }]);
  });
});
