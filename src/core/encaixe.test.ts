import { describe, expect, it } from 'vitest';
import { alvoDoEncaixe, alvoDoEncaixeTeclado, origemDaRolagem } from './encaixe';

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

describe('origemDaRolagem', () => {
  it('teclas que rolam a página contam como teclado (setas, Page Up/Down, Espaço, Home, End)', () => {
    for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End']) {
      expect(origemDaRolagem({ type: 'keydown', key, defaultPrevented: false })).toBe('teclado');
    }
  });
  it('tecla que não rola, ou que um componente já tratou (seletor em radiogroup), não muda a origem', () => {
    expect(origemDaRolagem({ type: 'keydown', key: 'Tab', defaultPrevented: false })).toBeNull();
    expect(origemDaRolagem({ type: 'keydown', key: 'a', defaultPrevented: false })).toBeNull();
    expect(origemDaRolagem({ type: 'keydown', key: 'ArrowDown', defaultPrevented: true })).toBeNull();
  });
  it('roda, toque e ponteiro voltam a ligar o encaixe', () => {
    for (const type of ['wheel', 'touchstart', 'pointerdown']) expect(origemDaRolagem({ type })).toBe('outro');
  });
});

describe('alvoDoEncaixeTeclado', () => {
  // pin de 1000 a 3000, pontos em 1000, 1800, 2300 e 3000
  it('um toque de seta (40 px) a partir de uma parada vai para a seguinte, não volta para a de partida', () => {
    expect(alvoDoEncaixeTeclado(1800, 1840, 1000, 3000, PONTOS)).toBe(2300);
  });
  it('seta para cima vai para a parada anterior', () => {
    expect(alvoDoEncaixeTeclado(1800, 1760, 1000, 3000, PONTOS)).toBe(1000);
  });
  it('Page Down que passa um pouco da parada seguinte volta para ela, sem pular etapa', () => {
    expect(alvoDoEncaixeTeclado(1000, 1900, 1000, 3000, PONTOS)).toBe(1800);
  });
  it('seta segurada por várias paradas encaixa na mais próxima à frente de onde partiu', () => {
    expect(alvoDoEncaixeTeclado(1000, 2350, 1000, 3000, PONTOS)).toBe(2300);
  });
  it('entrando no pin por cima encaixa no início', () => {
    expect(alvoDoEncaixeTeclado(500, 1050, 1000, 3000, PONTOS)).toBe(1000);
  });
  it('sem movimento, fora do pin, já encaixado ou sem parada à frente: não move', () => {
    expect(alvoDoEncaixeTeclado(1800, 1800, 1000, 3000, PONTOS)).toBeNull();
    expect(alvoDoEncaixeTeclado(2900, 3200, 1000, 3000, PONTOS)).toBeNull();
    expect(alvoDoEncaixeTeclado(1000, 2299, 1000, 3000, PONTOS)).toBeNull();
    expect(alvoDoEncaixeTeclado(3000, 2990, 1000, 3000, [0, 1])).toBe(1000);
    expect(alvoDoEncaixeTeclado(1000, 1000, 1000, 1000, PONTOS)).toBeNull();
  });
});
