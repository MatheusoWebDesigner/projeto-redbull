import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (p: number) => Math.min(1, Math.max(0, p)) || 0; // NaN vira o início
/** Só nestas entradas (Figma, página 11): o DM01 e a Pintura. */
const ENTRADAS = ['#dm01', '#pintura'];

/** Borda esquerda (px) do grupo de faixas: entra toda por fora à esquerda e sai toda por fora à direita. */
export function faixaX(p: number, tela: number, grupo: number): number {
  const inicio = -grupo - tela * 0.35;
  const fim = tela * 1.35;
  return inicio + clamp01(p) * (fim - inicio);
}

/** Faixas diagonais (amarela, vermelha e fundo) presas à rolagem enquanto a seção sobe até o topo. */
export function initFaixas(): void {
  const camada = document.querySelector<HTMLElement>('.faixas-transicao');
  const grupo = camada?.querySelector<HTMLElement>('.faixas-transicao__grupo');
  if (!camada || !grupo) return;
  gsap.set(grupo, { rotation: -20 });

  const mover = (p: number) => {
    const ativa = p > 0 && p < 1;
    camada.classList.toggle('is-ativa', ativa);
    if (!ativa) return;
    // A caixa girada é mais larga que o elemento: posiciona pela largura visível, centrando o giro.
    const visivel = grupo.getBoundingClientRect().width;
    gsap.set(grupo, { x: faixaX(p, window.innerWidth, visivel) + (visivel - grupo.offsetWidth) / 2 });
  };

  for (const entrada of ENTRADAS) {
    ScrollTrigger.create({
      trigger: entrada,
      start: 'top bottom',
      end: 'top top',
      onUpdate: (self) => mover(self.progress),
      onLeave: () => mover(1),
      onLeaveBack: () => mover(0),
    });
  }
}
