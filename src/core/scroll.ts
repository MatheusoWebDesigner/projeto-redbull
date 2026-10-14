import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Liga a rolagem suave uma única vez para a página inteira. Chamadas repetidas devolvem a mesma instância. */
export function startSmoothScroll(): Lenis {
  if (lenis) return lenis;
  const instance = new Lenis();
  instance.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => instance.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis = instance;
  return instance;
}
