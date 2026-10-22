import { gsap } from 'gsap';
import type Lenis from 'lenis';

/** Velocidade do Lenis (px por quadro) que já conta como "rolando no máximo". */
export const VEL_MAX = 60;
/** Sem evento de rolagem por este tempo, o alvo volta a zero (o último evento do Lenis nem sempre traz 0). */
const PARADO_APOS_MS = 120;

/** Velocidade normalizada em −1…1; descendo é positivo. */
export function nivelDeVelocidade(v: number): number {
  return Math.max(-1, Math.min(1, (v || 0) / VEL_MAX));
}

/** Aproxima `atual` de `alvo` com meia-vida fixa (independe da taxa de quadros); quase parado vira 0. */
export function suavizar(atual: number, alvo: number, dtMs: number, meiaVidaMs = 90): number {
  if (!Number.isFinite(dtMs)) return atual;
  const r = atual + (alvo - atual) * (1 - 2 ** (-dtMs / meiaVidaMs));
  return Math.abs(r) < 0.002 ? 0 : r;
}

/**
 * Um medidor só para a página: escreve `--vel` (com sinal) e `--vel-abs` nos elementos dados.
 * Nunca no :root — a variável herdada recalcularia o estilo da página inteira a cada quadro.
 */
export function ligarVelocidade(lenis: Lenis, alvos: HTMLElement[]): void {
  let alvo = 0;
  let atual = 0;
  let escrito = 0;
  let ultimoEvento = 0;
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)'); // pode ser ligado com a página aberta
  lenis.on('scroll', (l: Lenis) => {
    alvo = reduzido.matches ? 0 : nivelDeVelocidade(l.velocity);
    ultimoEvento = performance.now();
  });
  gsap.ticker.add((_tempo, dtMs) => {
    if (performance.now() - ultimoEvento > PARADO_APOS_MS) alvo = 0;
    atual = suavizar(atual, alvo, dtMs);
    if (Math.abs(atual - escrito) < 0.002 && !(atual === 0 && escrito !== 0)) return;
    escrito = atual;
    for (const el of alvos) {
      el.style.setProperty('--vel', atual.toFixed(3));
      el.style.setProperty('--vel-abs', Math.abs(atual).toFixed(3));
      el.classList.toggle('is-rolando', atual !== 0);
    }
  });
}
