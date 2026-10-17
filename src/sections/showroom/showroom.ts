import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startSmoothScroll } from '../../core/scroll';
import hotspotsData from '../../data/hotspots.json';
import type { Contexto, Fixar } from '../palco3d/palco3d';
import { arrasto, type Orbita } from './orbit';
import { estadoHotspot, ladoDoRotulo, PECAS } from './hotspots';
import { encaixeMaisProximo, estadoBarras, paradaAtiva, poseNoTrilho, PONTOS_SHOWROOM } from './rail';
import { asset } from '../../core/url';

gsap.registerPlugin(ScrollTrigger);

/** Prepara o Showroom e devolve `fixar`, que liga o pin quando o palco cabe na tela (ver PALCO_CABE). */
export function initShowroom(ctx: Contexto): Fixar {
  const section = document.querySelector<HTMLElement>('#showroom');
  const stage = section?.querySelector<HTMLElement>('.showroom__stage');
  if (!section || !stage) return () => () => {};
  const paradas = Array.from(stage.querySelectorAll<HTMLElement>('.parada'));
  const barras = Array.from(stage.querySelectorAll<HTMLButtonElement>('.showroom__barras button'));
  const hotspots = PECAS.map((peca) => stage.querySelector<HTMLElement>(`.hotspot[data-peca="${peca}"]`)!);
  const textos = stage.querySelector<HTMLElement>('.showroom__paradas')!;
  const visibilidade = hotspotsData[ctx.aparelho] as Record<string, boolean>[];
  const lenis = startSmoothScroll();
  const orbita: Orbita = { giro: 0, inclina: 0 };
  let progresso = 0;
  let atual = -1;

  const trocarTexto = (nova: number) => {
    if (nova === atual) return;
    const antiga = paradas[atual];
    atual = nova;
    paradas.forEach((p, i) => p.classList.toggle('is-active', i === nova));
    if (antiga) gsap.fromTo(antiga, { opacity: 1, y: 0 }, { opacity: 0, y: -16, duration: 0.25, clearProps: 'transform,opacity' });
    gsap.fromTo(paradas[nova], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' });
    estadoBarras(nova).forEach((e, i) => {
      barras[i].dataset.estado = e;
      if (e === 'ativa') barras[i].setAttribute('aria-current', 'step'); else barras[i].removeAttribute('aria-current');
    });
    ctx.mostrarRender(asset(`/showroom/${ctx.aparelho}/sr_0${nova}.webp`), 'showroom');
  };

  const desenharHotspots = () => {
    const palco = ctx.palco();
    const zona = ctx.aparelho === 'mobile' ? 0 : textos.getBoundingClientRect().right;
    PECAS.forEach((peca, i) => {
      const el = hotspots[i];
      const proj = palco?.projetar(`hotspot_${peca}`);
      if (!proj) { el.classList.remove('is-visivel'); return; }
      const est = estadoHotspot({ indice: i, parada: atual, visivelNaPose: visibilidade[atual][peca], noQuadro: proj.noQuadro, x: proj.x, zonaTexto: zona });
      el.classList.toggle('is-visivel', est.visivel);
      el.classList.toggle('is-ativo', est.ativo);
      el.style.setProperty('--hx', `${proj.x}px`);
      el.style.setProperty('--hy', `${proj.y}px`);
      el.dataset.lado = ladoDoRotulo(proj.x, el.querySelector<HTMLElement>('.hotspot__rotulo')!.offsetWidth, zona);
    });
  };

  const render = () => {
    trocarTexto(paradaAtiva(progresso));
    const palco = ctx.palco();
    if (!palco) return;
    palco.definirPeso(0);
    palco.definirPose(poseNoTrilho(ctx.posesShowroom, progresso), orbita);
  };

  // Só existe com o palco fixado; empilhado (zoom alto, janela baixa) as paradas ficam todas à vista.
  let st: ScrollTrigger | null = null;
  const irPara = (i: number) => {
    if (st) lenis.scrollTo(st.start + (i / 5) * (st.end - st.start), { duration: 0.8 });
  };

  ScrollTrigger.addEventListener('scrollEnd', () => {
    if (!st?.isActive) return;
    const alvo = st.start + encaixeMaisProximo(st.progress, PONTOS_SHOWROOM) * (st.end - st.start);
    if (Math.abs(alvo - window.scrollY) > 2) lenis.scrollTo(alvo, { duration: 0.5 });
  });

  barras.forEach((b) => b.addEventListener('click', () => irPara(Number(b.dataset.ir))));
  // Foco por teclado (ou leitor de tela) num artigo oculto, como o link da parada 05: leva até a parada dele.
  textos.addEventListener('focusin', (e) => {
    const alvo = (e.target as Element).closest<HTMLElement>('.parada');
    if (alvo && !alvo.classList.contains('is-active')) irPara(Number(alvo.dataset.parada));
  });

  if (ctx.usa3D) {
    let inicio: { x: number; y: number; base: Orbita } | null = null;
    stage.addEventListener('pointerdown', (e) => {
      if (!st || !ctx.palco() || (e.target as Element).closest('button, a')) return;
      inicio = { x: e.clientX, y: e.clientY, base: { ...orbita } };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-arrastando');
    });
    stage.addEventListener('pointermove', (e) => {
      if (!inicio) return;
      Object.assign(orbita, arrasto(inicio.base, e.clientX - inicio.x, -(e.clientY - inicio.y)));
      render();
    });
    const soltar = () => { inicio = null; stage.classList.remove('is-arrastando'); };
    stage.addEventListener('pointerup', soltar);
    stage.addEventListener('pointercancel', soltar);
  }

  ctx.aoCarregar((palco) => {
    palco.aoDesenhar(desenharHotspots); // fora do pin os hotspots saem da tela junto com o palco da seção
    render();
  });
  trocarTexto(0);

  return () => {
    st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: ctx.aparelho === 'mobile' ? '+=380%' : '+=450%',
      pin: stage,
      scrub: true,
      onUpdate: (self) => {
        progresso = self.progress;
        if (orbita.giro || orbita.inclina) gsap.to(orbita, { giro: 0, inclina: 0, duration: 0.6, ease: 'power2.inOut', overwrite: true, onUpdate: render });
        render();
      },
      onRefresh: (self) => { progresso = self.progress; render(); },
    });
    return () => { st = null; };
  };
}
