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
