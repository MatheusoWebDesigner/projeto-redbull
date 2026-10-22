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
import { alternarMovimento, prefersReducedMotion, sistemaPedeMenosMovimento } from './core/motion';
import { startSmoothScroll } from './core/scroll';
import { ligarVelocidade } from './core/velocidade';

/** Títulos que inclinam com a velocidade da rolagem (os mesmos do efeitos.css). */
const TITULOS_VELOZES = '.titulo-secao, .parada__titulo, .etapa__titulo, .etapa-dm01__titulo, .era__titulo, .legado__titulo';

/** Botões "Reduzir movimento" (loader e rodapé). Se o sistema já pede menos movimento, ele já vale: sem botão. */
function ligarBotoesDeMovimento(): void {
  if (sistemaPedeMenosMovimento()) return;
  const reduzido = prefersReducedMotion();
  document.querySelectorAll<HTMLButtonElement>('[data-alternar-movimento]').forEach((b) => {
    if (reduzido && b.closest('.loader')) return; // no modo reduzido o loader nem chega a animar
    b.textContent = reduzido ? 'Ativar movimento' : 'Reduzir movimento';
    b.hidden = false;
    b.addEventListener('click', alternarMovimento);
  });
}

async function start(): Promise<void> {
  ligarBotoesDeMovimento();
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
