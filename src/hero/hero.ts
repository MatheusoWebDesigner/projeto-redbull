import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { formatNumber } from '../core/format';
import { startSmoothScroll } from '../core/scroll';
import { coverRect } from './cover';
import { FrameStore, type FrameSet } from './frames';
import { litLights } from './lights';
import { chapterIndexFor, frameIndexFor, SNAP_POINTS } from './scrub';
import { gear, rpm, speedKmh } from './telemetry';

gsap.registerPlugin(ScrollTrigger, SplitText);

const FOCUS_X: Record<FrameSet, number> = { desktop: 0.7, mobile: 0.5 };

function qs<T extends Element>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Elemento não encontrado: ${sel}`);
  return el;
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

async function lightsOut(loader: HTMLElement): Promise<void> {
  updateLoader(loader, 1);
  await new Promise((r) => setTimeout(r, 450));
  loader.querySelectorAll('.loader__lights span').forEach((s) => s.classList.remove('is-lit'));
  loader.classList.add('is-done');
  loader.setAttribute('aria-hidden', 'true');
}

export async function initHero(): Promise<void> {
  const set: FrameSet = window.matchMedia('(max-aspect-ratio: 1/1)').matches ? 'mobile' : 'desktop';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = qs<HTMLCanvasElement>('.hero__canvas');
  const loader = qs<HTMLElement>('.loader');
  const ctx = setupCanvas(canvas);

  if (reduced) {
    document.documentElement.classList.add('reduced');
    const poster = await loadPoster(set);
    draw(ctx, poster, FOCUS_X[set]);
    window.addEventListener('resize', () => draw(ctx, poster, FOCUS_X[set]));
    loader.classList.add('is-done');
    loader.setAttribute('aria-hidden', 'true');
    return;
  }

  const store = new FrameStore(set);
  await store.load((f) => updateLoader(loader, f));
  await lightsOut(loader);

  startSmoothScroll();

  const chapters = Array.from(document.querySelectorAll<HTMLElement>('.chapter'));
  const bars = Array.from(document.querySelectorAll<HTMLElement>('.hero__progress span'));
  const speedEl = qs<HTMLElement>('[data-speed]');
  const rpmEl = qs<HTMLElement>('[data-rpm]');
  const gearEl = qs<HTMLElement>('[data-gear]');
  const splits = chapters.map((c) => SplitText.create(c.querySelector('.chapter__title'), { type: 'chars' }));

  let currentFrame = -1;
  let currentChapter = -1;

  const showChapter = (index: number) => {
    if (index === currentChapter) return;
    const prev = chapters[currentChapter];
    if (prev) gsap.to(prev, { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power2.in', onComplete: () => prev.classList.remove('is-active') });
    const next = chapters[index];
    next.classList.add('is-active');
    gsap.fromTo(next, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
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

  ScrollTrigger.create({
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
  render(0);
}
