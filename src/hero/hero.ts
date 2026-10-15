import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { formatNumber } from '../core/format';
import { startSmoothScroll } from '../core/scroll';
import { coverRect } from './cover';
import { FrameStore, type FrameSet } from './frames';
import { litLights } from './lights';
import { textoCabeNoPalco } from './layout';
import { chapterIndexFor, FRAME_COUNT, frameIndexFor, SNAP_POINTS } from './scrub';
import { gear, rpm, speedKmh } from './telemetry';

gsap.registerPlugin(ScrollTrigger, SplitText);

const FOCUS_X: Record<FrameSet, number> = { desktop: 0.7, mobile: 0.5 };

function qs<T extends Element>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento não encontrado: ${sel}`);
  return el;
}

function qsIn<T extends Element>(root: Element, sel: string): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento não encontrado: ${sel}`);
  return el;
}

/**
 * Separa o título em duas camadas: o texto real para leitura (visualmente oculto) e uma
 * cópia visual, escondida da tecnologia assistiva, que o SplitText pode picar em letras.
 * Assim o nome do heading é texto de verdade, sem depender de aria-label.
 */
function prepararTitulo(title: HTMLElement): HTMLElement {
  const texto = title.textContent?.trim() ?? '';
  const leitura = document.createElement('span');
  leitura.className = 'sr-only';
  leitura.textContent = texto;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.textContent = texto;
  title.replaceChildren(leitura, visual);
  return visual;
}

function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  };
  resize();
  window.addEventListener('resize', resize);
  return ctx;
}

function draw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, focusX: number): void {
  const { width, height } = ctx.canvas;
  const r = coverRect(img.naturalWidth, img.naturalHeight, width, height, focusX);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
}

function loadPoster(set: FrameSet): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `/hero/frames/poster_${set}.webp`;
  });
}

function updateLoader(loader: HTMLElement, fraction: number): void {
  const lit = litLights(fraction);
  loader.querySelectorAll('.loader__lights span').forEach((s, i) => s.classList.toggle('is-lit', i < lit));
  loader.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
}

function dismissLoader(loader: HTMLElement): void {
  loader.classList.add('is-done');
  loader.setAttribute('aria-hidden', 'true');
}

async function lightsOut(loader: HTMLElement): Promise<void> {
  updateLoader(loader, 1);
  await new Promise((r) => setTimeout(r, 450));
  loader.querySelectorAll('.loader__lights span').forEach((s) => s.classList.remove('is-lit'));
  dismissLoader(loader);
}

/** Layout com os 4 capítulos empilhados e pôster estático (ver hero.css). */
const EMPILHADA = 'hero--empilhada';
const CELULAR = '(max-aspect-ratio: 1/1)';
/** No celular o degradê superior acaba em 55% da altura (hero.css); abaixo disso o texto perde o fundo escuro. */
const LIMITE_TEXTO_CELULAR = 0.55;

export async function initHero(): Promise<void> {
  const loader = qs<HTMLElement>('.loader');
  try {
    await montarHero(loader);
  } catch (err) {
    // Falhou (canvas, rede…): o conteúdo continua legível empilhado, e o loader nunca fica por cima.
    qs<HTMLElement>('.hero').classList.add(EMPILHADA);
    throw err;
  } finally {
    if (!loader.classList.contains('is-done')) dismissLoader(loader);
  }
}

async function montarHero(loader: HTMLElement): Promise<void> {
  const set: FrameSet = window.matchMedia(CELULAR).matches ? 'mobile' : 'desktop';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = qs<HTMLElement>('.hero');
  const stage = qs<HTMLElement>('.hero__stage');
  const canvas = qs<HTMLCanvasElement>('.hero__canvas');
  const ctx = setupCanvas(canvas);

  if (reduced) {
    document.documentElement.classList.add('reduced');
    hero.classList.add(EMPILHADA);
    const poster = await loadPoster(set);
    draw(ctx, poster, FOCUS_X[set]);
    window.addEventListener('resize', () => draw(ctx, poster, FOCUS_X[set]));
    return;
  }

  const store = new FrameStore(set);
  await store.load((f) => updateLoader(loader, f));
  await lightsOut(loader);

  startSmoothScroll();

  const chaptersBox = qs<HTMLElement>('.hero__chapters');
  const chapters = Array.from(document.querySelectorAll<HTMLElement>('.chapter'));
  const bars = Array.from(document.querySelectorAll<HTMLElement>('.hero__progress span'));
  const speedEl = qs<HTMLElement>('[data-speed]');
  const rpmEl = qs<HTMLElement>('[data-rpm]');
  const gearEl = qs<HTMLElement>('[data-gear]');
  const splits = chapters.map((c) => SplitText.create(prepararTitulo(qsIn(c, '.chapter__title')), { type: 'words,chars', aria: 'none' }));

  let currentFrame = -1;
  let currentChapter = -1;
  let trigger: ScrollTrigger | null = null;
  let poster: HTMLImageElement | null = null;

  const showChapter = (index: number) => {
    if (index === currentChapter) return;
    const prev = chapters[currentChapter];
    // Só opacidade (nunca visibility/aria-hidden): os 4 capítulos ficam sempre na árvore de
    // acessibilidade, em ordem, como no modo empilhado — o leitor de tela não depende da rolagem.
    if (prev) gsap.to(prev, { opacity: 0, y: -24, duration: 0.3, ease: 'power2.in', onComplete: () => prev.classList.remove('is-active') });
    const next = chapters[index];
    next.classList.add('is-active');
    gsap.fromTo(next, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    gsap.from(splits[index].chars, { yPercent: 110, opacity: 0, duration: 0.6, stagger: 0.025, ease: 'power3.out' });
    bars.forEach((b, i) => b.classList.toggle('is-on', i <= index));
    currentChapter = index;
  };

  const render = (progress: number) => {
    const frame = frameIndexFor(progress);
    if (frame !== currentFrame) {
      const img = store.get(frame);
      if (img) draw(ctx, img, FOCUS_X[set]);
      currentFrame = frame;
    }
    showChapter(chapterIndexFor(progress));
    speedEl.textContent = formatNumber(speedKmh(progress));
    rpmEl.textContent = formatNumber(rpm(progress));
    gearEl.textContent = gear(progress);
  };

  /** Mede os capítulos no layout fixado (mesmo se agora estiverem empilhados). */
  const textoCabe = (): boolean => {
    const empilhada = hero.classList.contains(EMPILHADA);
    if (empilhada) hero.classList.remove(EMPILHADA);
    const limite = stage.clientHeight * (window.matchMedia(CELULAR).matches ? LIMITE_TEXTO_CELULAR : 1);
    const faixas = chapters.map((c) => {
      const top = chaptersBox.offsetTop + c.offsetTop;
      return { top, bottom: top + c.offsetHeight };
    });
    if (empilhada) hero.classList.add(EMPILHADA);
    return textoCabeNoPalco(faixas, limite);
  };

  const desenharPoster = async () => {
    poster ??= await loadPoster(set).catch(() => store.get(FRAME_COUNT - 1));
    if (poster && hero.classList.contains(EMPILHADA)) draw(ctx, poster, FOCUS_X[set]);
  };

  const fixar = () => {
    hero.classList.remove(EMPILHADA);
    trigger = ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: '+=400%',
      pin: '.hero__stage',
      scrub: true,
      snap: { snapTo: SNAP_POINTS, duration: { min: 0.2, max: 0.6 }, ease: 'power1.inOut' },
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => {
        currentFrame = -1;
        render(self.progress);
      },
    });
    currentFrame = -1;
    render(trigger.progress);
  };

  const empilhar = () => {
    trigger?.kill(true);
    trigger = null;
    gsap.killTweensOf(chapters);
    splits.forEach((s) => gsap.killTweensOf(s.chars));
    gsap.set(chapters, { clearProps: 'opacity,transform' });
    splits.forEach((s) => gsap.set(s.chars, { clearProps: 'opacity,transform' }));
    chapters.forEach((c) => c.classList.remove('is-active'));
    currentChapter = -1;
    hero.classList.add(EMPILHADA);
    ScrollTrigger.refresh();
    void desenharPoster();
  };

  let agendado = 0;
  const reavaliar = () => {
    cancelAnimationFrame(agendado);
    agendado = requestAnimationFrame(() => {
      const cabe = textoCabe();
      const empilhada = hero.classList.contains(EMPILHADA);
      if (cabe && empilhada) fixar();
      else if (!cabe && !empilhada) empilhar();
      else if (empilhada) void desenharPoster(); // o resize do canvas apagou o quadro
    });
  };

  if (textoCabe()) fixar();
  else empilhar();
  window.addEventListener('resize', reavaliar);
  // Com o pin ativo, o palco só ganha a nova altura no refresh do ScrollTrigger (após o resize).
  ScrollTrigger.addEventListener('refresh', reavaliar);
  // Zoom, fonte carregada tarde ou espaçamento de texto mudam a altura dos capítulos.
  const observer = new ResizeObserver(reavaliar);
  chapters.forEach((c) => observer.observe(c));
}
