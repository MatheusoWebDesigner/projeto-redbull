import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHero } from './hero/hero';
import { initManifesto } from './sections/manifesto/manifesto';

async function start(): Promise<void> {
  await initHero();
  initManifesto();
  ScrollTrigger.refresh();
}

void start();
