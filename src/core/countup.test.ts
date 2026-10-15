import { describe, expect, it } from 'vitest';
import { countFrame, parseValue } from './countup';

describe('parseValue', () => {
  it('lê milhar com ponto', () => expect(parseValue('3.400')).toEqual({ prefix: '', number: 3400, decimals: 0, suffix: '' }));
  it('lê decimal com vírgula', () => expect(parseValue('8,5')).toEqual({ prefix: '', number: 8.5, decimals: 1, suffix: '' }));
  it('lê sinal e porcentagem', () => expect(parseValue('−55%')).toEqual({ prefix: '−', number: 55, decimals: 0, suffix: '%' }));
  it('lê zero', () => expect(parseValue('0')).toEqual({ prefix: '', number: 0, decimals: 0, suffix: '' }));
});

describe('countFrame', () => {
  it('chega ao texto original no fim', () => {
    for (const t of ['768', '3.400', '1.900', '−55%', '350', '8,5', '100%', '130', '6']) {
      expect(countFrame(parseValue(t), 1)).toBe(t);
    }
  });
  it('começa em zero sem sinal', () => {
    expect(countFrame(parseValue('−55%'), 0)).toBe('0%');
    expect(countFrame(parseValue('8,5'), 0)).toBe('0,0');
  });
  it('desacelera no fim (power2.out)', () => {
    expect(countFrame(parseValue('100%'), 0.5)).toBe('75%');
  });
  it('limita t entre 0 e 1', () => {
    expect(countFrame(parseValue('768'), 2)).toBe('768');
    expect(countFrame(parseValue('768'), -1)).toBe('0');
  });
});
