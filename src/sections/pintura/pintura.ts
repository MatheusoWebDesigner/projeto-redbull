import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../core/motion';
import { startSmoothScroll } from '../../core/scroll';
import { encaixeMaisProximo } from '../showroom/rail';
import { brilhoRender, encaixeDaEra, eraAtiva, ERAS, estadoBarras, opacidadeRender, PONTOS_PINTURA, posicaoReflexo, reflexoVisivel } from './eras';
import './pintura.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * Onde o pin cabe (medido no Chrome): na horizontal, o texto da era entre o título e a linha do tempo a partir
 * de 35rem de altura; no celular, o texto mais alto (≈ 26rem) acima de um chip de pelo menos ~7rem.
 * Abaixo disso — zoom de 200%/400%, janela baixa, celular pequeno — as eras ficam empilhadas como no
 * movimento reduzido (classe is-empilhado). Reavaliada a cada mudança de zoom ou de janela pelo gsap.matchMedia.
 */
export const PINTURA_CABE = '(min-aspect-ratio: 1001/1000) and (min-height: 35rem) and (min-width: 48rem), (max-aspect-ratio: 1/1) and (min-height: 40rem) and (min-width: 22.5rem), (max-aspect-ratio: 1/1) and (min-height: 43.75rem) and (min-width: 20rem)';
const CELULAR = '(max-aspect-ratio: 1/1)';

/** Seção Pintura: 5 eras contadas por um chip de cor; na última, o chip vira o render do RB22. */
export function initPintura(): void {
  const section = document.querySelector<HTMLElement>('#pintura');
  const stage = section?.querySelector<HTMLElement>('.pintura__stage');
  const chip = stage?.querySelector<HTMLElement>('.pintura__chip');
  // Movimento reduzido: o CSS (.reduced) já mostra as eras empilhadas e paradas.
  if (!section || !stage || !chip || prefersReducedMotion()) return;
  const eras = Array.from(stage.querySelectorAll<HTMLElement>('.era'));
  const botoes = Array.from(stage.querySelectorAll<HTMLButtonElement>('.pintura__linha button'));
  const lenis = startSmoothScroll();
  let atual = -1;
  let renderAberto = 0;
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
    chip.style.backgroundColor = ERAS[nova].cor; // crossfade de 0,5 s pela transição do CSS
    chip.dataset.acabamento = ERAS[nova].acabamento;
    marcarBarras(nova);
  };

  /** Abre (1) ou fecha (0) o chip até a tela inteira; o render aparece junto, pelo CSS (--x). */
  const abrirRender = (alvo: number) => {
    if (alvo === renderAberto) return;
    renderAberto = alvo;
    gsap.to(chip, { '--x': alvo, duration: 0.8, ease: 'power2.inOut', overwrite: true });
  };

  const render = (p: number) => {
    trocarEra(eraAtiva(p));
    chip.style.setProperty('--reflexo', posicaoReflexo(p).toFixed(4));
    chip.style.setProperty('--brilho', brilhoRender(p).toFixed(4));
    chip.classList.toggle('is-reflexo', reflexoVisivel(p));
    abrirRender(opacidadeRender(p));
  };

  const reiniciar = () => {
    gsap.killTweensOf([chip, ...eras]);
    gsap.set(eras, { clearProps: 'transform,opacity' });
    chip.style.setProperty('--x', '0');
    renderAberto = 0;
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

  ScrollTrigger.addEventListener('scrollEnd', () => {
    if (!st?.isActive) return;
    const alvo = st.start + encaixeMaisProximo(st.progress, PONTOS_PINTURA) * (st.end - st.start);
    if (Math.abs(alvo - window.scrollY) > 2) lenis.scrollTo(alvo, { duration: 0.5 });
  });
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
