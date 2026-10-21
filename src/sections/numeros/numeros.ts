import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { countFrame, parseValue } from '../../core/countup';
import { cardEntrou, trackShift } from './track';
import './numeros.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * Altura mínima para o trilho fixado caber sem cortar o cartão (medida: 500px na horizontal, 640px na vertical).
 * Abaixo disso — zoom de 200%/400%, notebook baixo, celular pequeno — a seção fica empilhada (is-estatico).
 * Reavaliada a cada mudança de zoom ou de janela pelo gsap.matchMedia.
 */
const PIN_CABE = '(prefers-reduced-motion: no-preference) and (min-aspect-ratio: 1001/1000) and (min-height: 32rem), (prefers-reduced-motion: no-preference) and (min-height: 40rem)';

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
  const section = document.querySelector<HTMLElement>('.numeros');
  const stage = section?.querySelector<HTMLElement>('.numeros__stage');
  const trilho = section?.querySelector<HTMLElement>('.numeros__trilho');
  if (!section || !stage || !trilho) return;
  const cards = Array.from(trilho.querySelectorAll<HTMLElement>('.card'));
  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;

  const render = (p: number) => {
    const visible = stage.clientWidth - 2 * parseFloat(getComputedStyle(stage).paddingLeft);
    gsap.set(trilho, { x: trackShift(p, trilho.scrollWidth, visible) });
    stage.style.setProperty('--nm-p', String(p));
    cards.forEach((c) => { const r = c.getBoundingClientRect(); if (cardEntrou(r.left, r.width, window.innerWidth)) contar(c); });
  };

  gsap.matchMedia().add({ fixar: PIN_CABE, sempre: 'all' }, (ctx) => {
    if (!ctx.conditions?.fixar) {
      section.classList.add('is-estatico');
      return () => section.classList.remove('is-estatico');
    }
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: mobile ? '+=300%' : '+=250%',
      pin: stage,
      scrub: true,
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => render(self.progress),
    });
    return undefined;
  });
}
