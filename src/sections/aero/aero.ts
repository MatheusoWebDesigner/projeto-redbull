import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startSmoothScroll } from '../../core/scroll';
import { lerpPose, toPose, type Pose, type PoseBruta } from '../../three/cameras';
import { blenderToThree } from '../../three/convert';
import aeroCameras from '../../data/aero-cameras.json';
import perfilData from '../../data/perfil.json';
import type { Contexto } from '../palco3d/palco3d';
import { catmullRom, encaixeMaisProximo } from '../showroom/rail';
import { etapaAero, linhaAero, modoDoPeso, pesoAutomatico, PONTOS_AERO, type Modo } from './linha';
import { geometriaPerfil, svgPerfil, type DadosPerfil } from './perfil';

gsap.registerPlugin(ScrollTrigger);

const MODOS: Record<Modo, { cabecalho: string; texto: string; nivel: string }> = {
  curva: { cabecalho: 'Modo curva · padrão', texto: 'Flaps inclinados: mais pressão aerodinâmica para frear e contornar.', nivel: 'Alta' },
  reta: { cabecalho: 'Modo reta', texto: 'Flaps deitados: menos arrasto nas zonas de ativação marcadas pela FIA.', nivel: 'Baixa' },
};
/** Ponto de passagem pela lateral esquerda do carro na viagem de A para C (eixos do Blender). */
const LATERAL_BLENDER: [number, number, number] = [1.4, -6.5, 1.8];

export function initAero(ctx: Contexto): void {
  const section = document.querySelector<HTMLElement>('#aero');
  const stage = section?.querySelector<HTMLElement>('.aero__stage');
  if (!section || !stage) return;
  const etapas = Array.from(stage.querySelectorAll<HTMLElement>('.etapa'));
  const progresso = Array.from(stage.querySelectorAll<HTMLElement>('.aero__progresso span'));
  const cartao = stage.querySelector<HTMLElement>('.cartao-modo[aria-live]')!;
  const radios = Array.from(stage.querySelectorAll<HTMLButtonElement>('.seletor-modo [role="radio"]'));
  const raiz = ctx.raiz;
  const cams = aeroCameras[ctx.aparelho] as Record<'A' | 'C', PoseBruta>;
  const A = toPose(cams.A);
  const C = toPose(cams.C);
  const lateral = blenderToThree(LATERAL_BLENDER);
  const dados = perfilData[ctx.aparelho] as DadosPerfil;
  raiz.querySelector<HTMLElement>('.palco3d__perfil-svg')!.innerHTML = svgPerfil(geometriaPerfil(dados), dados.resolucao);
  const lenis = startSmoothScroll();

  let p = 0;
  let etapa = -1;
  let manual: number | null = null; // peso escolhido no seletor; vale até a etapa mudar
  const laco = { w: 0 };
  let tweenLaco: gsap.core.Tween | null = null;
  let modoMostrado: Modo | null = null;

  const poseDaViagem = (t: number): Pose => ({
    ...lerpPose(A, C, t),
    pos: catmullRom([A.pos, lateral, C.pos], t),
    alvo: catmullRom([A.alvo, lerpPose(A, C, 0.5).alvo, C.alvo], t),
  });

  const mostrarModo = (modo: Modo) => {
    radios.forEach((r) => {
      const sim = r.dataset.modo === modo;
      r.setAttribute('aria-checked', String(sim));
      r.tabIndex = sim ? 0 : -1;
    });
    if (modo === modoMostrado) return;
    modoMostrado = modo;
    const m = MODOS[modo];
    gsap.to(cartao, {
      opacity: 0, duration: 0.15, onComplete: () => {
        cartao.dataset.modo = modo;
        cartao.querySelector('[data-cabecalho]')!.textContent = m.cabecalho;
        cartao.querySelector('[data-texto]')!.textContent = m.texto;
        cartao.querySelectorAll('[data-nivel]').forEach((n) => { n.textContent = m.nivel; });
        gsap.to(cartao, { opacity: 1, duration: 0.15 });
      },
    });
  };

  const pesoAtual = () => (manual ?? (etapaAero(p) === 2 ? laco.w : pesoAutomatico(p)));

  const render = () => {
    const nova = etapaAero(p);
    if (nova !== etapa) {
      etapa = nova;
      manual = null;
      etapas.forEach((el) => el.classList.toggle('is-active', el.dataset.etapas!.split(' ').includes(String(nova))));
      progresso.forEach((s, i) => { s.classList.toggle('is-vista', i < nova); s.classList.toggle('is-ativa', i === nova); });
      tweenLaco?.kill();
      tweenLaco = null;
      if (nova === 2) tweenLaco = gsap.fromTo(laco, { w: 0 }, { w: 1, duration: 1.2, ease: 'power2.inOut', yoyo: true, repeat: -1, onUpdate: render });
      const fundo = nova === 3 ? 'C_reta' : `A_${modoDoPeso(pesoAtual())}`;
      ctx.mostrarRender(`/aero/${ctx.aparelho}/${fundo}.webp`);
    }
    const w = pesoAtual();
    const { perfil, viagem } = linhaAero(p);
    raiz.style.setProperty('--palco-perfil', String(perfil));
    raiz.style.setProperty('--palco-canvas', String(1 - perfil));
    raiz.style.setProperty('--palco-peso', String(w));
    stage.style.setProperty('--palco-perfil', String(perfil));
    mostrarModo(modoDoPeso(w));
    if (etapa < 2) ctx.mostrarRender(`/aero/${ctx.aparelho}/A_${modoDoPeso(w)}.webp`);
    const palco = ctx.palco();
    if (!palco) return;
    palco.definirPeso(w);
    palco.definirPose(viagem > 0 ? poseDaViagem(viagem) : A);
  };

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: ctx.aparelho === 'mobile' ? '+=240%' : '+=300%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => { p = self.progress; render(); },
    onRefresh: (self) => { p = self.progress; render(); },
    onToggle: (self) => { if (!self.isActive) { tweenLaco?.pause(); } else { tweenLaco?.resume(); } },
  });

  // Transição Showroom (parada 05) -> Aero (pose A) enquanto a Aero sobe na tela.
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'top top',
    onUpdate: (self) => {
      const palco = ctx.palco();
      if (!palco) return;
      const ultima = ctx.posesShowroom[ctx.posesShowroom.length - 1];
      palco.definirPeso(0);
      palco.definirPose(lerpPose(ultima, A, self.progress));
    },
  });

  ScrollTrigger.addEventListener('scrollEnd', () => {
    if (!st.isActive) return;
    const alvo = st.start + encaixeMaisProximo(st.progress, PONTOS_AERO) * (st.end - st.start);
    if (Math.abs(alvo - window.scrollY) > 2) lenis.scrollTo(alvo, { duration: 0.5 });
  });

  const escolher = (modo: Modo) => {
    tweenLaco?.pause();
    const alvo = modo === 'reta' ? 1 : 0;
    const estado = { w: pesoAtual() };
    gsap.to(estado, { w: alvo, duration: 0.6, ease: 'power2.inOut', onUpdate: () => { manual = estado.w; render(); } });
  };
  radios.forEach((r, i) => {
    r.addEventListener('click', () => escolher(r.dataset.modo as Modo));
    r.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const outro = radios[(i + 1) % radios.length];
      outro.focus();
      escolher(outro.dataset.modo as Modo);
    });
  });

  ctx.aoCarregar(() => render());
  render();
}
