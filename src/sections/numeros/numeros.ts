import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { countFrame, parseValue } from '../../core/countup';
import { prefersReducedMotion } from '../../core/motion';
import { rangeLabel, trackShift, visibleRange } from './track';
import './numeros.css';

gsap.registerPlugin(ScrollTrigger);

function contar(card: HTMLElement): void {
  if (card.classList.contains('is-contado')) return;
  card.classList.add('is-contado');
  const el = card.querySelector<HTMLElement>('.card__valor');
  if (!el || el.hasAttribute('data-sem-contagem')) return;
  const alvo = parseValue(el.textContent ?? '0');
  const estado = { t: 0 };
  gsap.to(estado, { t: 1, duration: 1.2, ease: 'none', onUpdate: () => { el.textContent = countFrame(alvo, estado.t); } });
}

export function initNumeros(): void {
  if (prefersReducedMotion()) return;
  const section = document.querySelector<HTMLElement>('.numeros');
  const stage = section?.querySelector<HTMLElement>('.numeros__stage');
  const trilho = section?.querySelector<HTMLElement>('.numeros__trilho');
  const contador = section?.querySelector<HTMLElement>('.numeros__contador');
  if (!section || !stage || !trilho || !contador) return;
  const cards = Array.from(trilho.querySelectorAll<HTMLElement>('.card'));
  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  const perView = mobile ? 1 : 3;

  const render = (p: number) => {
    const visible = stage.clientWidth - 2 * parseFloat(getComputedStyle(stage).paddingLeft);
    gsap.set(trilho, { x: trackShift(p, trilho.scrollWidth, visible) });
    stage.style.setProperty('--nm-p', String(p));
    const [a, b] = visibleRange(p, cards.length, perView);
    contador.textContent = rangeLabel(a, b, cards.length);
    const limite = window.innerWidth * 0.6;
    cards.forEach((c) => { if (c.getBoundingClientRect().left < limite) contar(c); });
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: mobile ? '+=300%' : '+=250%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  });
}
