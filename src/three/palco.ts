import {
  AgXToneMapping, Color, EquirectangularReflectionMapping, MathUtils, Mesh, Object3D,
  PerspectiveCamera, PMREMGenerator, RectAreaLight, Scene, Vector3, WebGLRenderer,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { blenderToThree, fitFov, radianciaArea, viewOffset, type Vec3 } from './convert';
import type { Pose } from './cameras';
import { orbitar } from '../sections/showroom/orbit';
import type { Orbita } from '../sections/showroom/orbit';

/** Graus somados à rotação do HDRI do Blender (calibrado no Task 12 comparando com sr_00). */
export const AJUSTE_AMBIENTE_GRAUS = 0;
const FLAPS = ['aero_tras_flap1', 'aero_tras_flap2', 'aero_diant_flap1', 'aero_diant_flap2'];

/**
 * As duas luzes de área da cena aprovada (showroom_v01.blend), em eixos do Blender.
 * `alvo` é um ponto para onde a luz aponta (a face emissora olha para ele).
 */
const LUZES_ESTUDIO: { pos: Vec3; alvo: Vec3; largura: number; altura: number; watts: number; cor: [number, number, number] }[] = [
  { pos: [1.4, 0, 5.2], alvo: [1.4, 0, 0], largura: 6.5, altura: 3, watts: 1200, cor: [0.93, 0.96, 1] }, // softbox_teto
  { pos: [7.5, 3.5, 2.6], alvo: [6.672, 3.026, 2.301], largura: 4, altura: 1.2, watts: 350, cor: [0.75, 0.84, 1] }, // recorte_tras
];
/** Calibração contra o render sr_00 (Task 12): potência do Blender -> RectAreaLight, e força do HDRI. */
export const FATOR_LUZES = 0.15;
export const FATOR_AMBIENTE = 1 / 1.4;

export interface Projecao { x: number; y: number; noQuadro: boolean }

export interface Palco {
  carregar(onProgresso: (f: number) => void): Promise<void>;
  definirPose(pose: Pose, orbita?: Orbita): void;
  definirPeso(w: number): void;
  projetar(no: string): Projecao | null;
  ativar(sim: boolean): void;
  /** Chamado depois de cada quadro desenhado (hotspots acompanham a câmera real). */
  aoDesenhar(fn: () => void): void;
}

export function criarPalco(canvas: HTMLCanvasElement, ambiente: { rotacaoGraus: number; intensidade: number }): Palco {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new Scene();
  scene.environmentIntensity = ambiente.intensidade * FATOR_AMBIENTE;
  scene.environmentRotation.y = MathUtils.degToRad(ambiente.rotacaoGraus + AJUSTE_AMBIENTE_GRAUS);
  RectAreaLightUniformsLib.init();
  for (const l of LUZES_ESTUDIO) {
    const luz = new RectAreaLight(new Color(...l.cor), radianciaArea(l.watts, l.largura, l.altura) * FATOR_LUZES, l.largura, l.altura);
    luz.position.set(...blenderToThree(l.pos));
    luz.lookAt(...blenderToThree(l.alvo));
    scene.add(luz);
  }
  const camera = new PerspectiveCamera(30, 1, 0.05, 100);
  const flaps: Mesh[] = [];
  const nos = new Map<string, Object3D>();
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
    const pos = orbitar(pose.pos, pose.alvo, orbitaAtual.giro, orbitaAtual.inclina);
    camera.position.set(...pos);
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
  if (import.meta.env.DEV) Object.assign(window, { __palco3d: { renderer, scene, camera, nos, pedirQuadro } });

  return {
    async carregar(onProgresso) {
      const draco = new DRACOLoader().setDecoderPath('/draco/');
      const gltf = new GLTFLoader().setDRACOLoader(draco);
      const pmrem = new PMREMGenerator(renderer);
      // finally: o worker do Draco e o PMREM são liberados mesmo se o carregamento falhar
      const [hdr, modelo] = await Promise.all([
        new HDRLoader().loadAsync('/env/studio_small_09_escuro_1k.hdr'),
        gltf.loadAsync('/models/rb22.glb', (e) => { if (e.total) onProgresso(e.loaded / e.total); }),
      ]).finally(() => draco.dispose());
      hdr.mapping = EquirectangularReflectionMapping;
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      scene.add(modelo.scene);
      modelo.scene.traverse((o) => {
        nos.set(o.name, o);
        if (FLAPS.includes(o.name) && (o as Mesh).isMesh) flaps.push(o as Mesh);
      });
      onProgresso(1);
      await renderer.compileAsync(scene, camera);
      pedirQuadro();
    },
    definirPose(p, orbita) {
      pose = p;
      if (orbita) orbitaAtual = orbita;
      pedirQuadro();
    },
    definirPeso(w) {
      for (const m of flaps) {
        const i = m.morphTargetDictionary?.reta;
        if (i !== undefined && m.morphTargetInfluences) m.morphTargetInfluences[i] = w;
      }
      pedirQuadro();
    },
    projetar(nome) {
      const no = nos.get(nome);
      if (!no || !pose) return null;
      aplicarCamera();
      const v = no.getWorldPosition(new Vector3()).project(camera);
      const { w, h } = tamanho();
      return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, noQuadro: v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 };
    },
    aoDesenhar(fn) {
      depoisDoQuadro.push(fn);
    },
    ativar(sim) {
      ativo = sim;
      if (sim) pedirQuadro();
    },
  };
}
