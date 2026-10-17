export type Acabamento = 'brilhante' | 'fosco';

export interface Era {
  ano: string;
  modelo: string;
  acabamento: Acabamento;
  /** Cor-base do chip (a primeira amostra da era). */
  cor: string;
}

/** As 5 eras da spec (cores aproximadas). Os textos ficam no HTML, que também serve ao movimento reduzido. */
export const ERAS: readonly Era[] = [
  { ano: '2005', modelo: 'RB1', acabamento: 'brilhante', cor: '#102154' },
  { ano: '2010–2013', modelo: 'RB6 → RB9', acabamento: 'brilhante', cor: '#14204A' },
  { ano: '2016', modelo: 'RB12', acabamento: 'fosco', cor: '#1B2A6B' },
  { ano: '2023', modelo: 'RB19', acabamento: 'fosco', cor: '#121F45' },
  { ano: '2026', modelo: 'RB22', acabamento: 'brilhante', cor: '#153380' },
];

const TOTAL = ERAS.length;
const ULTIMA = TOTAL - 1;
const EMPATE = 1e-9; // absorve o erro de ponto flutuante nas fronteiras (0,87 × 5 ≠ 4,35)

/** Encaixe no meio de cada era: a faixa de reflexo para no centro do chip. */
export const PONTOS_PINTURA = ERAS.map((_, i) => (i + 0.5) / TOTAL);

/** Na última era, fração do trecho em que o reflexo atravessa o chip; ao fim dela o chip vira render. */
export const FIM_TRAVESSIA = 0.35;
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

/** Ponto do pin (0..1) onde a era `i` fica encaixada. */
export function encaixeDaEra(i: number): number {
  return PONTOS_PINTURA[Math.min(ULTIMA, Math.max(0, Math.round(i)))];
}

/** Posição da faixa de reflexo: 0 = antes da borda esquerda do chip, 1 = depois da direita. */
export function posicaoReflexo(p: number): number {
  const { era, u } = posicaoNoPin(p);
  return era === ULTIMA ? Math.min(1, u / FIM_TRAVESSIA) : u;
}

/** Opacidade-alvo do render final: o chip vira o RB22 quando o reflexo termina de atravessar a última era. */
export function opacidadeRender(p: number): number {
  const { era, u } = posicaoNoPin(p);
  return era === ULTIMA && u >= FIM_TRAVESSIA - EMPATE ? 1 : 0;
}

/** A faixa só existe no acabamento brilhante e enquanto o chip ainda é chip. */
export function reflexoVisivel(p: number): boolean {
  return ERAS[eraAtiva(p)].acabamento === 'brilhante' && opacidadeRender(p) === 0;
}

/** Crossfade do render: 0 = brilho_a, 1 = brilho_b. Começa no encaixe da última era e termina no fim do pin. */
export function brilhoRender(p: number): number {
  const { era, u } = posicaoNoPin(p);
  return era === ULTIMA ? clamp01((u - INICIO_BRILHO) / (1 - INICIO_BRILHO)) : 0;
}

export type EstadoBarra = 'passada' | 'ativa' | 'futura';

/** Marcos da linha do tempo: o da era atual ativo, os anteriores passados (esmaecidos). */
export function estadoBarras(era: number): EstadoBarra[] {
  return ERAS.map((_, i) => (i < era ? 'passada' : i === era ? 'ativa' : 'futura'));
}
