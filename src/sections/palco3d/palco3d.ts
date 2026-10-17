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

/** O que as seções compartilham: o palco 3D (quando houver) e o render de fundo. */
export interface Contexto {
  aparelho: Aparelho;
  raiz: HTMLElement;
  usa3D: boolean;
  palco: () => Palco | null;
  aoCarregar: (fn: (palco: Palco) => void) => void;
  mostrarRender: (url: string) => void;
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
  const ouvintes: ((p: Palco) => void)[] = [];

  const ctx: Contexto = {
    aparelho,
    raiz,
    usa3D,
    palco: () => palco,
    aoCarregar: (fn) => (palco ? fn(palco) : ouvintes.push(fn)),
    mostrarRender: (url) => { if (!render.src.endsWith(url)) render.src = url; },
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

  initShowroom(ctx);
  initAero(ctx);
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
