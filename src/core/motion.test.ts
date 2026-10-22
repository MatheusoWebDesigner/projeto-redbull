import { describe, expect, it } from 'vitest';
import { movimentoReduzido } from './motion';

describe('movimentoReduzido', () => {
  it('o sistema pedindo menos movimento sempre vale', () => {
    expect(movimentoReduzido(true, null)).toBe(true);
    expect(movimentoReduzido(true, 'qualquer')).toBe(true);
  });
  it('a escolha salva na página também reduz', () => {
    expect(movimentoReduzido(false, 'reduzido')).toBe(true);
  });
  it('sem pedido nenhum, movimento completo', () => {
    expect(movimentoReduzido(false, null)).toBe(false);
    expect(movimentoReduzido(false, 'completo')).toBe(false);
  });
});
