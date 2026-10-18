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
  // `--i` vai pelo CSSOM (não por atributo style), para a CSP não precisar liberar estilo inline.
  for (const [k, v] of Object.entries(attrs)) {
    if (k === '--i') el.style.setProperty('--i', String(v));
    else el.setAttribute(k, String(v));
  }
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
    if (m.construtores) svg.append(svgEl('rect', { class: 'legado__marca', '--i': i, x: x - 7, y: meio - 26, width: 14, height: 14, rx: 2, fill: '#d2003c' }));
    if (m.pilotos) svg.append(svgEl('circle', { class: 'legado__marca', '--i': i, cx: x, cy: m.construtores ? meio - 38 : meio - 18, r: 6, fill: '#ffc906' }));
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
  // O número animado fica oculto; o leitor de tela lê o valor final, dentro do próprio <dd>.
  const contadores = valores.map((v, i) => {
    v.innerHTML = `<span aria-hidden="true">0</span><span class="sr-only">${alvos[i].number}</span>`;
    return v.firstElementChild as HTMLElement;
  });
  // O SplitText em linhas some com o <br>; o título ganha um nome com espaço entre as frases.
  if (titulo) titulo.setAttribute('aria-label', (titulo.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim());

  ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    once: true,
    onEnter: () => {
      if (titulo) gsap.from(SplitText.create(titulo, { type: 'lines', mask: 'lines', aria: 'hidden' }).lines, { yPercent: 100, duration: 0.8, stagger: 0.08, ease: 'power3.out' });
      contadores.forEach((c, i) => {
        const estado = { t: 0 };
        gsap.to(estado, { t: 1, duration: 1.4, onUpdate: () => { c.textContent = countFrame(alvos[i], estado.t); } });
      });
      gsap.delayedCall(0.6, () => section.classList.add('is-visto'));
    },
  });
}
