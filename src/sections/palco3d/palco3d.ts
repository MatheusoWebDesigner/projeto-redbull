import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../core/motion';
import { lerAmbiente, podeUsar3D } from '../../three/support';
import { toPose, type Pose, type PoseBruta } from '../../three/cameras';
import type { Palco } from '../../three/palco';
import cameras from '../../data/showroom-cameras.json';
import { initShowroom } from '../showroom/showroom';
import { initAero } from '../aero/aero';
import './palco3d.css';
import '../showroom/showroom.css';
import '../aero/aero.css';

gsap.registerPlugin(ScrollTrigger);

export type Aparelho = 'desktop' | 'mobile';
/** Seção que manda no render de fundo: a que está ocupando a tela. */
export type Dono = 'showroom' | 'aero';

/** Liga o pin de uma seção e devolve como desligá-lo. */
export type Fixar = () => () => void;

/**
 * Altura mínima para o texto das paradas e etapas caber no palco fixado (100svh), medida no Chrome:
 * 40rem na horizontal; 37,5rem × 17,5rem na vertical. Abaixo disso — zoom de 200%/400%, janela baixa,
 * celular pequeno — as duas seções ficam empilhadas como no movimento reduzido (classe is-empilhado).
 * Reavaliada a cada mudança de zoom ou de janela pelo gsap.matchMedia.
 */
export const PALCO_CABE = '(min-aspect-ratio: 1001/1000) and (min-height: 35rem), (max-aspect-ratio: 1/1) and (min-height: 37.5rem) and (min-width: 17.5rem)';

/** O que as seções compartilham: o palco 3D (quando houver) e o render de fundo. */
export interface Contexto {
  aparelho: Aparelho;
  raiz: HTMLElement;
  usa3D: boolean;
  palco: () => Palco | null;
  aoCarregar: (fn: (palco: Palco) => void) => void;
  mostrarRender: (url: string, quem: Dono) => void;
  posesShowroom: Pose[];
}

export async function initPalco3D(): Promise<void> {
  const raiz = document.querySelector<HTMLElement>('[data-palco3d]');
  if (!raiz || prefersReducedMotion()) return;
  const aparelho: Aparelho = window.matchMedia('(max-aspect-ratio: 1/1)').matches ? 'mobile' : 'desktop';
  trocarImagensDoAparelho(raiz, aparelho);
  const usa3D = podeUsar3D(lerAmbiente());
  const render = raiz.querySelector<HTMLImageElement>('.palco3d__render')!;
  const canvas = raiz.querySelector<HTMLCanvasElement>('.palco3d__canvas')!;
  const carregando = raiz.querySelector<HTMLElement>('.showroom__carregando')!;
  let palco: Palco | null = null;
  let dono: Dono = 'showroom';
  const ultimos: Record<Dono, string> = { showroom: `/showroom/${aparelho}/sr_00.webp`, aero: `/aero/${aparelho}/A_curva.webp` };
  const aplicarRender = () => { if (!render.src.endsWith(ultimos[dono])) render.src = ultimos[dono]; };
  const ouvintes: ((p: Palco) => void)[] = [];

  const ctx: Contexto = {
    aparelho,
    raiz,
    usa3D,
    palco: () => palco,
    aoCarregar: (fn) => (palco ? fn(palco) : ouvintes.push(fn)),
    mostrarRender: (url, quem) => {
      ultimos[quem] = url;
      if (quem === dono) aplicarRender();
    },
    posesShowroom: (cameras.cameras[aparelho] as PoseBruta[]).map(toPose),
  };

  if (usa3D) {
    const carregar = async () => {
      carregando.hidden = false;
      try {
        const { criarPalco } = await import('../../three/palco');
        const p = criarPalco(canvas, { rotacaoGraus: cameras.hdri_rotacao_z_graus, intensidade: cameras.hdri_intensidade });
        await p.carregar((f) => {
          carregando.style.setProperty('--carga', String(f));
          carregando.querySelector('.showroom__pct')!.textContent = `${Math.round(f * 100)}%`;
        });
        palco = p;
        raiz.classList.add('is-3d');
        ouvintes.splice(0).forEach((fn) => fn(p));
        new IntersectionObserver(([e]) => p.ativar(e.isIntersecting)).observe(raiz);
      } catch (erro) {
        console.error('Falha ao carregar o 3D; seguindo com os renders:', erro);
      } finally {
        carregando.hidden = true;
      }
    };
    const vigia = new IntersectionObserver(([e]) => { if (e.isIntersecting) { vigia.disconnect(); void carregar(); } }, { rootMargin: '100% 0px' });
    vigia.observe(raiz);
  }

  const fixarShowroom = initShowroom(ctx);
  const fixarAero = initAero(ctx);
  const trocarDono = (novo: Dono) => { dono = novo; aplicarRender(); };
  gsap.matchMedia().add({ cabe: PALCO_CABE, sempre: 'all' }, (mm) => {
    if (!mm.conditions?.cabe) {
      raiz.classList.add('is-empilhado');
      return () => raiz.classList.remove('is-empilhado');
    }
    const desfazer = [fixarShowroom(), fixarAero()];
    // A Aero assume o fundo quando chega à metade da tela; a volta devolve ao Showroom.
    ScrollTrigger.create({ trigger: '#aero', start: 'top center', onEnter: () => trocarDono('aero'), onLeaveBack: () => trocarDono('showroom') });
    return () => desfazer.forEach((f) => f());
  });
}

/** Troca os renders de desktop pelos de celular quando for o caso. */
function trocarImagensDoAparelho(raiz: HTMLElement, aparelho: Aparelho): void {
  if (aparelho === 'desktop') return;
  raiz.querySelectorAll<HTMLImageElement>('img[src*="/desktop/"]').forEach((img) => {
    img.src = img.src.replace('/desktop/', '/mobile/');
    img.width = 1080;
    img.height = 2340;
  });
}
