import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHero } from './hero/hero';
import { initManifesto } from './sections/manifesto/manifesto';
import { initNumeros } from './sections/numeros/numeros';

async function start(): Promise<void> {
  await initHero();
  initManifesto();
  initNumeros();
  ScrollTrigger.refresh();
}

void start();
