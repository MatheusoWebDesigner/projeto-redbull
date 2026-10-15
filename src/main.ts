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
  await initHero();
  initManifesto();
  initNumeros();
  initLegado();
  await initFechamento();
  ScrollTrigger.refresh();
}

void start();
