import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHero } from './hero/hero';
import { initManifesto } from './sections/manifesto/manifesto';
import { initPalco3D } from './sections/palco3d/palco3d';
import { initDm01 } from './sections/dm01/dm01';
import { initNumeros } from './sections/numeros/numeros';
import { initPintura } from './sections/pintura/pintura';
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
  await initPalco3D();
  await initDm01();
  initNumeros();
  initPintura();
  initLegado();
  await initFechamento();
  ScrollTrigger.refresh();
}

void start();
