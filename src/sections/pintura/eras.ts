export interface Era {
  ano: string;
  modelo: string;
}

/** As 5 eras (o RB22 com as cores de cada uma). Textos, cores e acabamentos ficam no HTML e nos renders. */
export const ERAS: readonly Era[] = [
  { ano: '2005', modelo: 'RB1' },
  { ano: '2010–2013', modelo: 'RB6 → RB9' },
  { ano: '2016', modelo: 'RB12' },
  { ano: '2023', modelo: 'RB19' },
  { ano: '2026', modelo: 'RB22' },
];

const TOTAL = ERAS.length;
const ULTIMA = TOTAL - 1;
const EMPATE = 1e-9; // absorve o erro de ponto flutuante nas fronteiras (0,87 × 5 ≠ 4,35)

/** Encaixe no meio de cada era, longe das passadas de tinta. */
export const PONTOS_PINTURA = ERAS.map((_, i) => (i + 0.5) / TOTAL);

/** Meia largura (em eras) da passada de tinta em volta de cada fronteira: de 3/4 de uma era a 1/4 da seguinte. */
const MEIA_PASSADA = 0.25;
/** Na última era, o brilho começa a passar pela carroceria a partir do encaixe. */
const INICIO_BRILHO = 0.5;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v)) || 0; // NaN vira o início

function posicaoNoPin(p: number): { era: number; u: number } {
  const s = clamp01(p) * TOTAL;
  const era = Math.min(ULTIMA, Math.floor(s + EMPATE));
  return { era, u: clamp01(s - era) };
}

/** Índice da era à mostra: cada uma ocupa 1/5 do pin, e a troca cai na metade entre dois encaixes. */
export function eraAtiva(p: number): number {
  return posicaoNoPin(p).era;
}

/** Progresso (0..1) dentro da era atual. */
export function progressoNaEra(p: number): number {
  return posicaoNoPin(p).u;
}

/** Ponto do pin (0..1) onde a era `i` fica encaixada. NaN vai para a primeira era. */
export function encaixeDaEra(i: number): number {
  return PONTOS_PINTURA[Math.min(ULTIMA, Math.max(0, Math.round(i) || 0))];
}

/** Crossfade do render: 0 = brilho_a, 1 = brilho_b. Começa no encaixe da última era e termina no fim do pin. */
export function brilhoRender(p: number): number {
  const { era, u } = posicaoNoPin(p);
  return era === ULTIMA ? clamp01((u - INICIO_BRILHO) / (1 - INICIO_BRILHO)) : 0;
}

/**
 * Pistola de tinta: perto da fronteira entre duas eras, a pintura nova (`para`) cobre a antiga (`de`) por uma
 * frente que vai de 0 a 1. Fora dessas janelas — inclusive nos encaixes — não há passada (null).
 */
export function pistola(p: number): { de: number; para: number; frente: number } | null {
  if (!Number.isFinite(p)) return null;
  const s = clamp01(p) * TOTAL;
  const k = Math.round(s);
  if (k < 1 || k > ULTIMA) return null;
  const frente = (s - (k - MEIA_PASSADA)) / (2 * MEIA_PASSADA);
  return frente > EMPATE && frente < 1 - EMPATE ? { de: k - 1, para: k, frente } : null;
}

export type EstadoBarra = 'passada' | 'ativa' | 'futura';

/** Marcos da linha do tempo: o da era atual ativo, os anteriores passados (esmaecidos). */
export function estadoBarras(era: number): EstadoBarra[] {
  return ERAS.map((_, i) => (i < era ? 'passada' : i === era ? 'ativa' : 'futura'));
}
