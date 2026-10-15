import { describe, expect, it } from 'vitest';
import { formatNumber } from './format';

describe('formatNumber', () => {
  it('usa ponto como separador de milhar', () => {
    expect(formatNumber(13200)).toBe('13.200');
    expect(formatNumber(4500)).toBe('4.500');
  });
  it('não mexe em números abaixo de mil', () => {
    expect(formatNumber(320)).toBe('320');
    expect(formatNumber(0)).toBe('0');
  });
  it('arredonda para inteiro', () => {
    expect(formatNumber(15000.4)).toBe('15.000');
  });
});

describe('formatNumber nas bordas', () => {
  it('números grandes agrupam de três em três', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });
  it('negativos mantêm o sinal e o separador', () => {
    expect(formatNumber(-13200)).toBe('-13.200');
  });
  it('negativo que arredonda para zero vira "0", não "-0"', () => {
    expect(formatNumber(-0.4)).toBe('0');
    expect(formatNumber(-0)).toBe('0');
  });
  it('-0,5 fica na fronteira do arredondamento e ainda vira "0"', () => expect(formatNumber(-0.5)).toBe('0'));
  it('arredondamento que cruza o milhar ganha separador', () => expect(formatNumber(999.5)).toBe('1.000'));
});
