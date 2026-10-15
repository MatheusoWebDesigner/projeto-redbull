import { describe, expect, it } from 'vitest';
import { textoCabeNoPalco } from './layout';

describe('textoCabeNoPalco', () => {
  it('aceita capítulos inteiros dentro do limite', () => {
    expect(textoCabeNoPalco([{ top: 300, bottom: 770 }, { top: 400, bottom: 770 }], 900)).toBe(true);
  });
  it('recusa capítulo que passa do topo do palco (seria cortado)', () => {
    expect(textoCabeNoPalco([{ top: 300, bottom: 770 }, { top: -136, bottom: 192 }], 256)).toBe(false);
  });
  it('recusa capítulo que passa do limite inferior', () => {
    expect(textoCabeNoPalco([{ top: 101, bottom: 480 }], 844 * 0.55)).toBe(false);
  });
  it('aceita texto encostado exatamente nas bordas', () => {
    expect(textoCabeNoPalco([{ top: 0, bottom: 464 }], 464)).toBe(true);
  });
  it('sem capítulos, não há o que cortar', () => {
    expect(textoCabeNoPalco([], 100)).toBe(true);
  });
});
