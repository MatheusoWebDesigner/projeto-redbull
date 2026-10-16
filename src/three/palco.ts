import {
  AgXToneMapping, EquirectangularReflectionMapping, MathUtils, Mesh, Object3D,
  PerspectiveCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer,
} from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { fitFov, viewOffset } from './convert';
import type { Pose } from './cameras';
import { orbitar } from '../sections/showroom/orbit';
import type { Orbita } from '../sections/showroom/orbit';

/** Graus somados à rotação do HDRI do Blender (calibrado no Task 12 comparando com sr_00). */
export const AJUSTE_AMBIENTE_GRAUS = 0;
const FLAPS = ['aero_tras_flap1', 'aero_tras_flap2', 'aero_diant_flap1', 'aero_diant_flap2'];

export interface Projecao { x: number; y: number; noQuadro: boolean }

export interface Palco {
  carregar(onProgresso: (f: number) => void): Promise<void>;
  definirPose(pose: Pose, orbita?: Orbita): void;
  definirPeso(w: number): void;
  projetar(no: string): Projecao | null;
  ativar(sim: boolean): void;
}

export function criarPalco(canvas: HTMLCanvasElement, ambiente: { rotacaoGraus: number; intensidade: number }): Palco {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new Scene();
  scene.environmentIntensity = ambiente.intensidade;
  scene.environmentRotation.y = MathUtils.degToRad(ambiente.rotacaoGraus + AJUSTE_AMBIENTE_GRAUS);
  const camera = new PerspectiveCamera(30, 1, 0.05, 100);
  const flaps: Mesh[] = [];
  const nos = new Map<string, Object3D>();
  let pose: Pose | null = null;
  let orbitaAtual: Orbita = { giro: 0, inclina: 0 };
  let ativo = false;
  let pedido = 0;

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
  };
  const pedirQuadro = () => { if (!pedido) pedido = requestAnimationFrame(desenhar); };
  new ResizeObserver(pedirQuadro).observe(canvas);

  return {
    async carregar(onProgresso) {
      const draco = new DRACOLoader().setDecoderPath('/draco/');
      const gltf = new GLTFLoader().setDRACOLoader(draco);
      const pmrem = new PMREMGenerator(renderer);
      const [hdr, modelo] = await Promise.all([
        new HDRLoader().loadAsync('/env/studio_small_09_escuro_1k.hdr'),
        gltf.loadAsync('/models/rb22.glb', (e) => { if (e.total) onProgresso(e.loaded / e.total); }),
      ]);
      hdr.mapping = EquirectangularReflectionMapping;
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      draco.dispose();
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
    ativar(sim) {
      ativo = sim;
      if (sim) pedirQuadro();
    },
  };
}
