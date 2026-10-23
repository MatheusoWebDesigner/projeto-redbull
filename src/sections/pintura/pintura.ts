import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../core/motion';
import { startSmoothScroll } from '../../core/scroll';
import { brilhoRender, encaixeDaEra, eraAtiva, estadoBarras, PONTOS_PINTURA, pistola } from './eras';
import './pintura.css';
import { ligarEncaixe } from '../../core/encaixe';

gsap.registerPlugin(ScrollTrigger);

/**
 * Onde o pin cabe (medido no Chrome): na horizontal, o texto da era entre o título e a linha do tempo a partir
 * de 35rem de altura; no celular, o texto mais alto (≈ 26rem) acima do carro (que fica no pé do render).
 * Abaixo disso — zoom de 200%/400%, janela baixa, celular pequeno — as eras ficam empilhadas como no
 * movimento reduzido (classe is-empilhado). Reavaliada a cada mudança de zoom ou de janela pelo gsap.matchMedia.
 */
export const PINTURA_CABE = '(min-aspect-ratio: 1001/1000) and (min-height: 35rem) and (min-width: 48rem), (max-aspect-ratio: 1/1) and (min-height: 40rem) and (min-width: 22.5rem), (max-aspect-ratio: 1/1) and (min-height: 43.75rem) and (min-width: 20rem)';
const CELULAR = '(max-aspect-ratio: 1/1)';

/** Seção Pintura: o RB22 com as cores de 5 eras; a troca de era é uma passada de pistola de tinta presa à rolagem. */
export function initPintura(): void {
  const section = document.querySelector<HTMLElement>('#pintura');
  // As cores vêm de data-* (e não de style="" no HTML) para a CSP não precisar liberar estilo inline.
  section?.querySelectorAll<HTMLElement>('[data-cor]').forEach((el) => el.style.setProperty('--cor', el.dataset.cor!));
  const stage = section?.querySelector<HTMLElement>('.pintura__stage');
  const carro = stage?.querySelector<HTMLElement>('.pintura__carro');
  // Movimento reduzido: o CSS (.reduced) já mostra as eras empilhadas e paradas.
  if (!section || !stage || !carro || prefersReducedMotion()) return;
  const renders = Array.from(carro.querySelectorAll<HTMLElement>('.pintura__render[data-era]'));
  const eras = Array.from(stage.querySelectorAll<HTMLElement>('.era'));
  const botoes = Array.from(stage.querySelectorAll<HTMLButtonElement>('.pintura__linha button'));
  const lenis = startSmoothScroll();
  let atual = -1;
  let st: ScrollTrigger | null = null; // só existe com o palco fixado

  const marcarBarras = (era: number) => estadoBarras(era).forEach((estado, i) => {
    botoes[i].dataset.estado = estado;
    if (estado === 'ativa') botoes[i].setAttribute('aria-current', 'step'); else botoes[i].removeAttribute('aria-current');
  });

  const trocarEra = (nova: number) => {
    if (nova === atual) return;
    const antiga = eras[atual];
    atual = nova;
    eras.forEach((el, i) => el.classList.toggle('is-active', i === nova));
    if (antiga) gsap.fromTo(antiga, { opacity: 1, y: 0 }, { opacity: 0, y: -16, duration: 0.25, overwrite: true, clearProps: 'transform,opacity' });
    gsap.fromTo(eras[nova], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', overwrite: true, clearProps: 'transform,opacity' });
    marcarBarras(nova);
  };

  const render = (p: number) => {
    const era = eraAtiva(p);
    trocarEra(era);
    // Durante a passada, a era anterior fica embaixo e a nova entra recortada pela frente diagonal.
    const passada = pistola(p);
    const base = passada ? passada.de : era;
    renders.forEach((r, i) => {
      r.classList.toggle('is-base', i === base);
      r.classList.toggle('is-nova', i === passada?.para);
    });
    carro.style.setProperty('--frente', passada ? passada.frente.toFixed(4) : '0');
    carro.style.setProperty('--brilho', brilhoRender(p).toFixed(4));
  };

  const reiniciar = () => {
    gsap.killTweensOf(eras);
    gsap.set(eras, { clearProps: 'transform,opacity' });
    render(0);
  };

  // Quem usa a linha do tempo pelo teclado ouve a era nova (o texto dela fica antes do nav no DOM).
  const anuncio = section.querySelector<HTMLElement>('[data-anuncio-era]');
  const irPara = (i: number) => {
    if (!st) return;
    const era = eras[i];
    lenis.scrollTo(st.start + encaixeDaEra(i) * (st.end - st.start), {
      duration: 0.8,
      onComplete: () => {
        if (anuncio && era) anuncio.textContent = `${era.querySelector('.era__ano')?.textContent ?? ''}: ${era.querySelector('.era__titulo')?.textContent ?? ''}`;
      },
    });
  };

  ligarEncaixe(() => st, PONTOS_PINTURA);
  botoes.forEach((b) => b.addEventListener('click', () => irPara(Number(b.dataset.ir))));
  render(0);

  // `sempre` garante que a função rode mesmo quando nenhuma das outras condições bate (aí ela empilha).
  gsap.matchMedia().add({ cabe: PINTURA_CABE, celular: CELULAR, sempre: 'all' }, (mm) => {
    if (!mm.conditions?.cabe) {
      section.classList.add('is-empilhado');
      return () => section.classList.remove('is-empilhado');
    }
    st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: mm.conditions.celular ? '+=280%' : '+=350%',
      pin: stage,
      scrub: true,
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => render(self.progress),
    });
    return () => {
      st = null;
      reiniciar();
    };
  });
}
