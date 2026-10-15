import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LINKS } from '../../config';
import { prefersReducedMotion } from '../../core/motion';
import { startSmoothScroll } from '../../core/scroll';
import { FrameStore, type FrameSet } from '../../hero/frames';
import { FRAME_COUNT } from '../../hero/scrub';
import { REVEAL_AT, reverseFrame, titleScale } from './mask';
import './fechamento.css';

gsap.registerPlugin(ScrollTrigger);
const QUADRO_ESTATICO = 159; // quadro 160 (faixas azuis), usado no movimento reduzido

function desenhar(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, escala: number, mobile: boolean): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, w, h);
  if (img) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    ctx.drawImage(img, (w - img.naturalWidth * s) / 2, (h - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
  }
  const base = mobile ? w * (128 / 390) : w * (230 / 1440);
  const tam = base * escala;
  ctx.font = `italic 800 ${tam}px "Barlow Condensed"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const linhas = mobile ? ['TE DÁ', 'ASAS.'] : ['TE DÁ ASAS.'];
  const y0 = h * 0.42 - ((linhas.length - 1) * tam * 0.86) / 2;
  ctx.globalCompositeOperation = 'destination-in';
  linhas.forEach((l, i) => ctx.fillText(l, w / 2, y0 + i * tam * 0.86));
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.5 * Math.min(window.devicePixelRatio || 1, 2);
  linhas.forEach((l, i) => ctx.strokeText(l, w / 2, y0 + i * tam * 0.86));
}

export async function initFechamento(): Promise<void> {
  const section = document.querySelector<HTMLElement>('.fechamento');
  const stage = section?.querySelector<HTMLElement>('.fechamento__stage');
  const canvas = section?.querySelector<HTMLCanvasElement>('.fechamento__canvas');
  const ctx = canvas?.getContext('2d');
  if (!section || !stage || !canvas || !ctx) return;

  section.querySelector<HTMLAnchorElement>('[data-link="estudo-de-caso"]')?.setAttribute('href', LINKS.estudoDeCaso);
  section.querySelector<HTMLButtonElement>('[data-topo]')?.addEventListener('click', () => {
    startSmoothScroll().scrollTo(0, { onComplete: () => document.querySelector<HTMLElement>('h1')?.focus() });
  });

  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  const set: FrameSet = mobile ? 'mobile' : 'desktop';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ajustar = () => { canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr); };
  ajustar();
  await document.fonts.load('italic 800 100px "Barlow Condensed"');
  const store = new FrameStore(set);
  await store.load(() => {});

  if (prefersReducedMotion()) {
    const pintar = () => { ajustar(); desenhar(ctx, store.get(QUADRO_ESTATICO), 1, mobile); };
    pintar();
    window.addEventListener('resize', pintar);
    return;
  }

  const render = (p: number) => {
    desenhar(ctx, store.get(reverseFrame(p, FRAME_COUNT)), titleScale(p), mobile);
    section.classList.toggle('is-revelado', p >= REVEAL_AT);
  };
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=150%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => { ajustar(); render(self.progress); },
  });
  render(0);
}
