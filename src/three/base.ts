import {
  AgXToneMapping, Color, EquirectangularReflectionMapping, MathUtils, Object3D,
  PerspectiveCamera, PMREMGenerator, RectAreaLight, Scene, Vector3, WebGLRenderer,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { DRACO_GLTF_CONFIG, DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { alvoAreaBlender, blenderToThree, fitFov, radianciaArea, viewOffset, type Vec3 } from './convert';
import type { Pose } from './cameras';
import { orbitar, type Orbita } from '../sections/showroom/orbit';
import { asset } from '../core/url';

/** Graus somados à rotação do HDRI do Blender (a de 220° bateu com o render sr_00 sem ajuste). */
export const AJUSTE_AMBIENTE_GRAUS = 0;
/** Calibração contra o render sr_00 (Fase 4, Task 12): potência do Blender -> RectAreaLight, e força do HDRI. */
export const FATOR_LUZES = 0.15;
export const FATOR_AMBIENTE = 1 / 1.4;
const HDR_URL = asset('/env/studio_small_09_escuro_1k.hdr');

/** Luz de área como está na cena do Blender: posição e rotação euler XYZ (graus), em eixos do Blender. */
export interface LuzBlender {
  pos: Vec3;
  euler: Vec3;
  largura: number;
  altura: number;
  watts: number;
  cor: [number, number, number];
}

export interface Projecao { x: number; y: number; noQuadro: boolean }

/** O que toda cena 3D da página divide: renderer, estúdio de luz, câmera do Blender e quadro sob demanda. */
export interface Estudio {
  scene: Scene;
  luzes: RectAreaLight[];
  carregar(urlModelo: string, onProgresso: (f: number) => void): Promise<Object3D>;
  definirPose(pose: Pose, orbita?: Orbita): void;
  definirWatts(i: number, watts: number): void;
  projetar(ponto: Vector3): Projecao | null;
  pedirQuadro(): void;
  ativar(sim: boolean): void;
  aoDesenhar(fn: () => void): void;
}

export function criarEstudio(
  canvas: HTMLCanvasElement,
  ambiente: { rotacaoGraus: number; intensidade: number; luzes: LuzBlender[]; nomeDebug: string },
): Estudio {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new Scene();
  scene.environmentIntensity = ambiente.intensidade * FATOR_AMBIENTE;
  scene.environmentRotation.y = MathUtils.degToRad(ambiente.rotacaoGraus + AJUSTE_AMBIENTE_GRAUS);
  RectAreaLightUniformsLib.init();
  const luzes = ambiente.luzes.map((l) => {
    const luz = new RectAreaLight(new Color(...l.cor), 0, l.largura, l.altura);
    luz.position.set(...blenderToThree(l.pos));
    luz.lookAt(...blenderToThree(alvoAreaBlender(l.pos, l.euler)));
    scene.add(luz);
    return luz;
  });
  const definirWatts = (i: number, watts: number) => {
    const l = ambiente.luzes[i];
    luzes[i].intensity = radianciaArea(watts, l.largura, l.altura) * FATOR_LUZES;
  };
  ambiente.luzes.forEach((l, i) => definirWatts(i, l.watts));

  const camera = new PerspectiveCamera(30, 1, 0.05, 100);
  let pose: Pose | null = null;
  let orbitaAtual: Orbita = { giro: 0, inclina: 0 };
  let ativo = false;
  let pedido = 0;
  const depoisDoQuadro: (() => void)[] = [];

  const tamanho = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
    }
    return { w, h };
  };

  const aplicarCamera = () => {
    if (!pose) return;
    const { w, h } = tamanho();
    camera.position.set(...orbitar(pose.pos, pose.alvo, orbitaAtual.giro, orbitaAtual.inclina));
    camera.lookAt(...pose.alvo);
    camera.aspect = w / h;
    camera.fov = fitFov(pose.fov, pose.aspecto, w / h);
    const off = viewOffset(pose.shiftX, pose.shiftY, w, h);
    camera.setViewOffset(w, h, off.x, off.y, w, h);
    camera.updateProjectionMatrix();
  };

  const desenhar = () => {
    pedido = 0;
    if (!ativo) return;
    aplicarCamera();
    renderer.render(scene, camera);
    depoisDoQuadro.forEach((fn) => fn());
  };
  const pedirQuadro = () => { if (!pedido) pedido = requestAnimationFrame(desenhar); };
  new ResizeObserver(pedirQuadro).observe(canvas);
  // Só em desenvolvimento: acesso pelo console para calibrar luz e câmera.
  if (import.meta.env.DEV) Object.assign(window, { [ambiente.nomeDebug]: { renderer, scene, camera, pedirQuadro } });

  return {
    scene,
    luzes,
    async carregar(urlModelo, onProgresso) {
      // Decodificador Draco do próprio three, empacotado pelo Vite.
      const draco = new DRACOLoader().setDecoderPath(DRACO_GLTF_CONFIG);
      const gltf = new GLTFLoader().setDRACOLoader(draco);
      const pmrem = new PMREMGenerator(renderer);
      // finally: o worker do Draco é liberado mesmo se o carregamento falhar
      const [hdr, modelo] = await Promise.all([
        new HDRLoader().loadAsync(HDR_URL),
        gltf.loadAsync(urlModelo, (e) => { if (e.total) onProgresso(e.loaded / e.total); }),
      ]).finally(() => draco.dispose());
      hdr.mapping = EquirectangularReflectionMapping;
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      scene.add(modelo.scene);
      onProgresso(1);
      await renderer.compileAsync(scene, camera);
      pedirQuadro();
      return modelo.scene;
    },
    definirPose(p, orbita) {
      pose = p;
      if (orbita) orbitaAtual = orbita;
      pedirQuadro();
    },
    definirWatts(i, watts) {
      definirWatts(i, watts);
      pedirQuadro();
    },
    projetar(ponto) {
      if (!pose) return null;
      aplicarCamera();
      const v = ponto.clone().project(camera);
      const { w, h } = tamanho();
      return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, noQuadro: v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 };
    },
    pedirQuadro,
    ativar(sim) {
      ativo = sim;
      if (sim) pedirQuadro();
    },
    aoDesenhar(fn) {
      depoisDoQuadro.push(fn);
    },
  };
}
