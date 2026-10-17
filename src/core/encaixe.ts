import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { encaixeMaisProximo } from '../sections/showroom/rail';
import { startSmoothScroll } from './scroll';

/**
 * Para onde rolar para encaixar no ponto mais próximo do pin, calculado pela posição ATUAL da página.
 * null quando já está encaixado (até 2 px) ou fora do pin.
 */
export function alvoDoEncaixe(scrollY: number, start: number, end: number, pontos: number[]): number | null {
  if (!(end > start) || scrollY < start || scrollY > end) return null;
  const alvo = start + encaixeMaisProximo((scrollY - start) / (end - start), pontos) * (end - start);
  return Math.abs(alvo - scrollY) > 2 ? alvo : null;
}

/**
 * Encaixe depois de rolagem por teclado: o ponto mais próximo, mas só entre os que ficam À FRENTE de onde a rolagem
 * partiu, no sentido em que ela foi. Um toque de seta (40 px) anda uma parada em vez de voltar para a de partida, e
 * um Page Down que passa da parada seguinte volta para ela em vez de pular uma etapa. Como o snap da Hero (GSAP).
 */
export function alvoDoEncaixeTeclado(partida: number, scrollY: number, start: number, end: number, pontos: number[]): number | null {
  if (!(end > start) || scrollY < start || scrollY > end || scrollY === partida) return null;
  const px = (p: number) => start + p * (end - start);
  const frente = pontos.filter((p) => (scrollY > partida ? px(p) > partida + 2 : px(p) < partida - 2));
  if (frente.length === 0) return null;
  const alvo = px(frente.reduce((a, b) => (Math.abs(px(b) - scrollY) < Math.abs(px(a) - scrollY) ? b : a)));
  return Math.abs(alvo - scrollY) > 2 ? alvo : null;
}

const TECLAS_DE_ROLAGEM = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End']);

/**
 * De onde veio a última rolagem. Teclado: setas, Page Up/Down, Espaço, Home e End (as que um componente já tratou,
 * como as setas do seletor da Aero, não contam). Roda, toque e ponteiro: 'outro'. null: o evento não muda a origem.
 */
export function origemDaRolagem(e: { type: string; key?: string; defaultPrevented?: boolean }): 'teclado' | 'outro' | null {
  if (e.type === 'keydown') return !e.defaultPrevented && TECLAS_DE_ROLAGEM.has(e.key ?? '') ? 'teclado' : null;
  return e.type === 'wheel' || e.type === 'touchstart' || e.type === 'pointerdown' ? 'outro' : null;
}

let origem: 'teclado' | 'outro' = 'outro';
/** Onde a página estava quando a rolagem por teclado começou (null: ainda não começou uma). */
let partida: number | null = null;
let vigiando = false;
function vigiarOrigem(): void {
  if (vigiando) return;
  vigiando = true;
  // Na fase de bolha da janela: o preventDefault do componente (seletor da Aero) já aconteceu.
  const anotar = (e: Event) => {
    const o = origemDaRolagem(e as KeyboardEvent);
    if (!o) return;
    origem = o;
    if (o === 'teclado') partida ??= window.scrollY;
    else partida = null;
  };
  for (const tipo of ['keydown', 'wheel', 'touchstart', 'pointerdown']) window.addEventListener(tipo, anotar, { passive: true });
  // Depois de todos os encaixes deste fim de rolagem, a próxima tecla parte de onde a página parou.
  ScrollTrigger.addEventListener('scrollEnd', () => setTimeout(() => { partida = null; }));
}

/**
 * Encaixe por seção, no fim da rolagem. Não age enquanto o Lenis ainda anima (navegação pelas barras, "Voltar ao
 * topo"): o scrollEnd do ScrollTrigger pode disparar no primeiro quadro de um scrollTo, ou depois de um quadro
 * longo, com o progresso antigo, e o encaixe roubava a navegação (bugs achados pelos testes E2E).
 * Depois de rolagem por teclado o encaixe é direcional (alvoDoEncaixeTeclado): com o mais próximo, cada toque de
 * seta voltava para a parada de partida e quem rola pelas setas ficava preso (auditoria de acessibilidade, Fase 6).
 */
export function ligarEncaixe(obterPin: () => { start: number; end: number } | null | undefined, pontos: number[]): () => void {
  const lenis = startSmoothScroll();
  vigiarOrigem();
  const encaixar = () => {
    if (origem !== 'teclado') {
      if (lenis.isScrolling) return;
      const pin = obterPin();
      const alvo = pin ? alvoDoEncaixe(window.scrollY, pin.start, pin.end, pontos) : null;
      if (alvo !== null) lenis.scrollTo(alvo, { duration: 0.5 });
      return;
    }
    // Teclado é rolagem nativa: o Lenis fica em 'native' até 400 ms depois dela, e o scrollEnd (intervalo de 250 ms
    // do ScrollTrigger) pode chegar atrasado, no primeiro quadro da tecla SEGUINTE (o Home parava no meio da Pintura).
    // Então ignora o 'native' e só encaixa se a página continuar parada um instante depois.
    if (lenis.isScrolling === 'smooth') return;
    const y = window.scrollY;
    const de = partida ?? y;
    setTimeout(() => {
      if (window.scrollY !== y || lenis.isScrolling === 'smooth') return;
      const pin = obterPin();
      const alvo = pin ? alvoDoEncaixeTeclado(de, y, pin.start, pin.end, pontos) : null;
      if (alvo !== null) lenis.scrollTo(alvo, { duration: 0.5 });
    }, 100);
  };
  ScrollTrigger.addEventListener('scrollEnd', encaixar);
  return () => ScrollTrigger.removeEventListener('scrollEnd', encaixar);
}
