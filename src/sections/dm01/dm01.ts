import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { countFrame, parseValue } from '../../core/countup';
import { prefersReducedMotion } from '../../core/motion';
import { startSmoothScroll } from '../../core/scroll';
import { toPose, type PoseBruta } from '../../three/cameras';
import { lerAmbiente, podeUsar3D } from '../../three/support';
import type { PalcoDm01 } from '../../three/dm01Palco';
import dados from '../../data/dm01.json';
import { PALCO_CABE } from '../palco3d/palco3d';
import { encaixeMaisProximo } from '../showroom/rail';
import { barra5050, etapaDm01, PONTOS_DM01, PROPORCAO_FOGO, rotulosVisiveis } from './estados';
import { POSICOES_ROTULOS, pontoDeSaida, pontoNoCover } from './rotulos';
import './dm01.css';
import { asset } from '../../core/url';

gsap.registerPlugin(ScrollTrigger);

const SVG = 'http://www.w3.org/2000/svg';

/** Conta do zero até o valor escrito no elemento (pt-BR), uma vez por entrada na etapa. */
function contar(el: HTMLElement, duracao = 1.2): void {
  const alvo = parseValue(el.dataset.valor ?? (el.dataset.valor = el.textContent ?? '0'));
  const estado = { t: 0 };
  gsap.to(estado, { t: 1, duration: duracao, ease: 'none', overwrite: true, onUpdate: () => { el.textContent = countFrame(alvo, estado.t); } });
}

export async function initDm01(): Promise<void> {
  const section = document.querySelector<HTMLElement>('#dm01');
  const stage = section?.querySelector<HTMLElement>('.dm01__stage');
  if (!section || !stage || prefersReducedMotion()) return;
  const aparelho: 'desktop' | 'mobile' = window.matchMedia('(max-aspect-ratio: 1/1)').matches ? 'mobile' : 'desktop';
  const render = stage.querySelector<HTMLImageElement>('.dm01__render')!;
  const canvas = stage.querySelector<HTMLCanvasElement>('.dm01__canvas')!;
  const guias = stage.querySelector<SVGSVGElement>('.dm01__guias')!;
  const carga = stage.querySelector<HTMLElement>('.dm01__carga')!;
  const caixaEtapas = stage.querySelector<HTMLElement>('.dm01__etapas')!;
  const etapas = Array.from(stage.querySelectorAll<HTMLElement>('.etapa-dm01'));
  const marcas = Array.from(stage.querySelectorAll<HTMLElement>('.dm01__progresso span'));
  const rotulos = Array.from(stage.querySelectorAll<HTMLElement>('.rotulo-peca'));
  const total = stage.querySelector<HTMLElement>('[data-contar-total]')!;
  if (aparelho === 'mobile') {
    stage.querySelectorAll<HTMLImageElement>('img[src*="/desktop/"]').forEach((img) => { img.src = img.src.replace('/desktop/', '/mobile/'); img.width = 1080; img.height = 2340; });
  }
  stage.style.setProperty('--dm01-fogo', String(PROPORCAO_FOGO));
  const pose = toPose(dados.cameras[aparelho] as PoseBruta);
  const lenis = startSmoothScroll();
  let palco: PalcoDm01 | null = null;
  let p = 0;
  let etapa = -1;
  let totalContado = false;

  // Linhas guia: uma por rótulo, mais o ponto na peça.
  const linhas = new Map<string, { linha: SVGLineElement; ponto: SVGCircleElement }>();
  for (const r of rotulos) {
    const linha = document.createElementNS(SVG, 'line');
    const ponto = document.createElementNS(SVG, 'circle');
    ponto.setAttribute('r', '4');
    linha.dataset.grupo = ponto.dataset.grupo = r.dataset.grupo!;
    guias.append(linha, ponto);
    linhas.set(r.dataset.peca!, { linha, ponto });
  }

  const pontoDaPeca = (peca: string): [number, number] | null => {
    if (palco) {
      const proj = palco.projetar(peca);
      return proj && proj.noQuadro ? [proj.x, proj.y] : null;
    }
    const estado = `E${Math.max(0, etapa)}` as 'E0';
    const ancora = (dados.ancoras_render[aparelho] as Record<string, Record<string, number[]>>)[estado]?.[peca];
    const resolucao: [number, number] = aparelho === 'mobile' ? [1080, 2340] : [1920, 1200];
    return ancora ? pontoNoCover([ancora[0], ancora[1]], resolucao, [stage.clientWidth, stage.clientHeight]) : null;
  };

  const desenharGuias = () => {
    const caixaStage = stage.getBoundingClientRect();
    guias.setAttribute('viewBox', `0 0 ${caixaStage.width} ${caixaStage.height}`);
    for (const r of rotulos) {
      const g = linhas.get(r.dataset.peca!)!;
      const alvo = r.classList.contains('is-visivel') ? pontoDaPeca(r.dataset.peca!) : null;
      g.linha.classList.toggle('is-visivel', !!alvo);
      g.ponto.classList.toggle('is-visivel', !!alvo);
      if (!alvo) continue;
      const c = r.getBoundingClientRect();
      const saida = pontoDeSaida({ x: c.left - caixaStage.left, y: c.top - caixaStage.top, w: c.width, h: c.height }, alvo);
      g.linha.setAttribute('x1', String(saida[0]));
      g.linha.setAttribute('y1', String(saida[1]));
      g.linha.setAttribute('x2', String(alvo[0]));
      g.linha.setAttribute('y2', String(alvo[1]));
      g.ponto.setAttribute('cx', String(alvo[0]));
      g.ponto.setAttribute('cy', String(alvo[1]));
    }
  };

  const posicionarRotulos = (e: number) => {
    const { quadro, etapas: pos } = POSICOES_ROTULOS[aparelho];
    const vis = rotulosVisiveis(e);
    // Celular mais baixo ou mais estreito que o quadro do Figma (390×844): o texto da etapa desce até a altura
    // do rótulo do Turbo e ficava coberto por ele. Nenhum rótulo começa acima do fim do texto; a linha guia acompanha.
    const piso = aparelho === 'mobile' ? caixaEtapas.offsetTop + etapas[e].offsetTop + etapas[e].offsetHeight + 12 : 0;
    for (const r of rotulos) {
      const [x, y] = pos[e][r.dataset.peca!];
      // nunca passa da borda direita do palco (o rótulo da Eletrônica era cortado em celulares estreitos)
      r.style.setProperty('--rx', `min(${(x / quadro[0]) * 100}%, calc(100% - ${r.offsetWidth}px - var(--gutter)))`);
      r.style.setProperty('--ry', `max(${(y / quadro[1]) * 100}%, ${piso}px)`);
      r.classList.toggle('is-visivel', r.dataset.grupo === 'termico' ? vis.termico : vis.eletrico);
    }
  };

  const trocarEtapa = (nova: number) => {
    if (nova === etapa) return;
    const antiga = etapas.find((a) => a.classList.contains('is-active'));
    etapa = nova;
    etapas.forEach((a) => a.classList.toggle('is-active', Number(a.dataset.etapa) === nova));
    if (antiga && antiga !== etapas[nova]) gsap.fromTo(antiga, { opacity: 1, y: 0 }, { opacity: 0, y: -16, duration: 0.25, clearProps: 'transform,opacity' });
    gsap.fromTo(etapas[nova], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' });
    marcas.forEach((m, i) => { m.classList.toggle('is-vista', i < nova); m.classList.toggle('is-ativa', i === nova); });
    etapas[nova].querySelectorAll<HTMLElement>('[data-contar]').forEach((el) => contar(el));
    if (nova < 3) totalContado = false;
    posicionarRotulos(nova);
    const url = asset(`/dm01/${aparelho}/E${nova}.webp`);
    if (!render.src.endsWith(url)) render.src = url;
  };

  const renderizar = () => {
    trocarEtapa(etapaDm01(p));
    const b = barra5050(p);
    stage.style.setProperty('--dm01-barra', String(b));
    if (b >= 1 && !totalContado) { totalContado = true; contar(total, 0.8); }
    palco?.definirProgresso(p);
    if (!palco) desenharGuias();
  };

  // 3D preguiçoso, uma tela antes da seção.
  if (podeUsar3D(lerAmbiente())) {
    const vigia = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return;
      vigia.disconnect();
      carga.hidden = false;
      try {
        const { criarPalcoDm01 } = await import('../../three/dm01Palco');
        const pd = criarPalcoDm01(canvas);
        await pd.carregar(() => {});
        pd.definirPose(pose);
        pd.aoDesenhar(desenharGuias);
        palco = pd;
        section.classList.add('is-3d');
        new IntersectionObserver(([v]) => pd.ativar(v.isIntersecting)).observe(section);
        renderizar();
      } catch (erro) {
        console.error('Falha ao carregar o DM01 em 3D; seguindo com os renders:', erro);
      } finally {
        carga.hidden = true;
      }
    }, { rootMargin: '100% 0px' });
    vigia.observe(section);
  }

  gsap.matchMedia().add({ cabe: PALCO_CABE, sempre: 'all' }, (mm) => {
    if (!mm.conditions?.cabe) {
      section.classList.add('is-empilhado');
      return () => section.classList.remove('is-empilhado');
    }
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: aparelho === 'mobile' ? '+=240%' : '+=300%',
      pin: stage,
      scrub: true,
      onUpdate: (self) => { p = self.progress; renderizar(); },
      onRefresh: (self) => { p = self.progress; renderizar(); },
    });
    const encaixar = () => {
      if (!st.isActive) return;
      const alvo = st.start + encaixeMaisProximo(st.progress, PONTOS_DM01) * (st.end - st.start);
      if (Math.abs(alvo - window.scrollY) > 2) lenis.scrollTo(alvo, { duration: 0.5 });
    };
    // No resize o texto pode quebrar em outra altura: reposiciona os rótulos antes de redesenhar as guias.
    const aoRedimensionar = () => { if (etapa >= 0) posicionarRotulos(etapa); desenharGuias(); };
    ScrollTrigger.addEventListener('scrollEnd', encaixar);
    window.addEventListener('resize', aoRedimensionar);
    return () => {
      ScrollTrigger.removeEventListener('scrollEnd', encaixar);
      window.removeEventListener('resize', aoRedimensionar);
    };
  });
  trocarEtapa(0);
}
