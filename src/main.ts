import './styles/fontes.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/efeitos.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHero } from './hero/hero';
import { initManifesto } from './sections/manifesto/manifesto';
import { initPalco3D } from './sections/palco3d/palco3d';
import { initDm01 } from './sections/dm01/dm01';
import { initNumeros } from './sections/numeros/numeros';
import { initPintura } from './sections/pintura/pintura';
import { initLegado } from './sections/legado/legado';
import { initFechamento } from './sections/fechamento/fechamento';
import { initFaixas } from './sections/faixas/faixas';
import { prefersReducedMotion } from './core/motion';
import { startSmoothScroll } from './core/scroll';
import { ligarVelocidade } from './core/velocidade';

/** Títulos que inclinam com a velocidade da rolagem (os mesmos do efeitos.css). */
const TITULOS_VELOZES = '.titulo-secao, .parada__titulo, .etapa__titulo, .etapa-dm01__titulo, .era__titulo, .legado__titulo';

async function start(): Promise<void> {
  try {
    await initHero();
  } catch (erro) {
    // A Hero já se recompõe empilhada em caso de erro; as outras seções seguem funcionando.
    console.error('Falha ao iniciar a Hero:', erro);
  }
  initManifesto();
  await initPalco3D();
  await initDm01();
  initNumeros();
  initPintura();
  initLegado();
  await initFechamento();
  if (!prefersReducedMotion()) {
    initFaixas();
    const alvos = [...document.querySelectorAll<HTMLElement>(`.fundo-vivo, .faixas-transicao, ${TITULOS_VELOZES}`)];
    ligarVelocidade(startSmoothScroll(), alvos);
  }
  ScrollTrigger.refresh();
}

void start();
