import { describe, expect, it } from 'vitest';
import { alvoDoEncaixe } from './encaixe';

const PONTOS = [0, 0.4, 0.65, 1];

describe('alvoDoEncaixe', () => {
  it('usa a posição atual da página, não o progresso de um update antigo', () => {
    // pin de 1000 a 3000; parado em 1700 (p = 0,35) encaixa em 0,4 → 1800
    expect(alvoDoEncaixe(1700, 1000, 3000, PONTOS)).toBe(1800);
  });
  it('já encaixado (até 2 px de diferença): não move', () => {
    expect(alvoDoEncaixe(1801, 1000, 3000, PONTOS)).toBeNull();
  });
  it('fora do pin: não move', () => {
    expect(alvoDoEncaixe(500, 1000, 3000, PONTOS)).toBeNull();
    expect(alvoDoEncaixe(3500, 1000, 3000, PONTOS)).toBeNull();
  });
  it('pin sem altura não divide por zero', () => {
    expect(alvoDoEncaixe(1000, 1000, 1000, PONTOS)).toBeNull();
  });
});
