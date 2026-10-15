import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { countFrame, parseValue } from '../../core/countup';
import { prefersReducedMotion } from '../../core/motion';
import { CONSTRUTORES, PILOTOS, titleMarks } from './marks';
import './legado.css';

gsap.registerPlugin(ScrollTrigger, SplitText);
const NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function desenharFaixa(svg: SVGSVGElement, mobile: boolean): void {
  const marcos = titleMarks(2005, 2026, CONSTRUTORES, PILOTOS);
  const meio = 56;
  svg.append(svgEl('line', { x1: 0, x2: 1000, y1: meio, y2: meio, stroke: 'rgba(255,255,255,0.25)' }));
  marcos.forEach((m, i) => {
    const x = m.x * 1000;
    svg.append(svgEl('line', { x1: x, x2: x, y1: meio - 4, y2: meio + 4, stroke: 'rgba(255,255,255,0.35)' }));
    const mostrar = !mobile || [2005, 2010, 2015, 2020, 2026].includes(m.ano);
    if (mostrar) {
      const t = svgEl('text', { x, y: meio + 26, 'text-anchor': 'middle' });
      t.textContent = mobile ? String(m.ano) : `’${String(m.ano).slice(2)}`;
      svg.append(t);
    }
    if (m.construtores) svg.append(svgEl('rect', { class: 'legado__marca', style: `--i:${i}`, x: x - 7, y: meio - 26, width: 14, height: 14, rx: 2, fill: '#d2003c' }));
    if (m.pilotos) svg.append(svgEl('circle', { class: 'legado__marca', style: `--i:${i}`, cx: x, cy: m.construtores ? meio - 38 : meio - 18, r: 6, fill: '#ffc906' }));
  });
}

export function initLegado(): void {
  const section = document.querySelector<HTMLElement>('.legado');
  const svg = section?.querySelector<SVGSVGElement>('.legado__svg');
  if (!section || !svg) return;
  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  desenharFaixa(svg, mobile);
  if (prefersReducedMotion()) return;

  const titulo = section.querySelector<HTMLElement>('.legado__titulo');
  const valores = Array.from(section.querySelectorAll<HTMLElement>('[data-contar]'));
  const alvos = valores.map((v) => parseValue(v.textContent ?? '0'));
  valores.forEach((v) => { v.textContent = '0'; v.setAttribute('aria-hidden', 'true'); });
  valores.forEach((v, i) => v.insertAdjacentHTML('afterend', `<span class="sr-only">${alvos[i].number}</span>`));

  ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    once: true,
    onEnter: () => {
      if (titulo) gsap.from(SplitText.create(titulo, { type: 'lines', mask: 'lines' }).lines, { yPercent: 100, duration: 0.8, stagger: 0.08, ease: 'power3.out' });
      valores.forEach((v, i) => {
        const estado = { t: 0 };
        gsap.to(estado, { t: 1, duration: 1.4, onUpdate: () => { v.textContent = countFrame(alvos[i], estado.t); } });
      });
      gsap.delayedCall(0.6, () => section.classList.add('is-visto'));
    },
  });
}
