import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHero } from './hero/hero';
import { initManifesto } from './sections/manifesto/manifesto';
import { initNumeros } from './sections/numeros/numeros';
import { initLegado } from './sections/legado/legado';
import { initFechamento } from './sections/fechamento/fechamento';

async function start(): Promise<void> {
  try {
    await initHero();
  } catch (erro) {
    // A Hero já se recompõe empilhada em caso de erro; as outras seções seguem funcionando.
    console.error('Falha ao iniciar a Hero:', erro);
  }
  initManifesto();
  initNumeros();
  initLegado();
  await initFechamento();
  ScrollTrigger.refresh();
}

void start();
