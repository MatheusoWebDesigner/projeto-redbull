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
 * Encaixe por seção, no fim da rolagem. Não age enquanto o Lenis ainda anima (navegação pelas barras, "Voltar ao
 * topo"): o scrollEnd do ScrollTrigger pode disparar no primeiro quadro de um scrollTo, ou depois de um quadro
 * longo, com o progresso antigo, e o encaixe roubava a navegação (bugs achados pelos testes E2E).
 */
export function ligarEncaixe(obterPin: () => { start: number; end: number } | null | undefined, pontos: number[]): () => void {
  const lenis = startSmoothScroll();
  const encaixar = () => {
    if (lenis.isScrolling) return;
    const pin = obterPin();
    const alvo = pin ? alvoDoEncaixe(window.scrollY, pin.start, pin.end, pontos) : null;
    if (alvo !== null) lenis.scrollTo(alvo, { duration: 0.5 });
  };
  ScrollTrigger.addEventListener('scrollEnd', encaixar);
  return () => ScrollTrigger.removeEventListener('scrollEnd', encaixar);
}
