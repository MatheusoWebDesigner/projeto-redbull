import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { prefersReducedMotion } from '../../core/motion';
import { wordOpacity } from './words';
import './manifesto.css';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initManifesto(): void {
  if (prefersReducedMotion()) return;
  const section = document.querySelector<HTMLElement>('.manifesto');
  const stage = section?.querySelector<HTMLElement>('.manifesto__stage');
  const frase = section?.querySelector<HTMLElement>('.manifesto__frase');
  if (!section || !stage || !frase) return;

  // A frase dividida em palavras fica oculta para leitores de tela; eles leem esta cópia inteira, logo depois.
  // (aria-label em <p> é ignorado pelos leitores, então o 'auto' do SplitText deixaria a frase muda.)
  const leitura = document.createElement('p');
  leitura.className = 'sr-only';
  leitura.textContent = (frase.textContent ?? '').replace(/\s+/g, ' ').trim();
  frase.after(leitura);
  const words = SplitText.create(frase, { type: 'words', aria: 'hidden' }).words as HTMLElement[];
  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;

  const render = (p: number) => {
    words.forEach((w, i) => { w.style.opacity = String(wordOpacity(i, words.length, p)); });
    stage.style.setProperty('--mf-glow', String(p));
    stage.style.setProperty('--mf-wm-x', `${-80 * p}px`);
    stage.style.setProperty('--mf-wm-op', String(0.05 + 0.09 * p));
    section.classList.toggle('is-assinado', p >= 0.85);
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: mobile ? '+=120%' : '+=150%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  });
  render(0);
}
