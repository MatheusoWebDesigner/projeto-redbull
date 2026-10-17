import { Mesh, Object3D, Vector3 } from 'three';
import { criarEstudio, type LuzBlender, type Projecao } from './base';
import type { Pose } from './cameras';
import type { Orbita } from '../sections/showroom/orbit';
import { asset } from '../core/url';

export type { Projecao } from './base';

const FLAPS = ['aero_tras_flap1', 'aero_tras_flap2', 'aero_diant_flap1', 'aero_diant_flap2'];

/** As duas luzes de área da cena aprovada (showroom_v01.blend). */
const LUZES_ESTUDIO: LuzBlender[] = [
  { pos: [1.4, 0, 5.2], euler: [0, 0, 0], largura: 6.5, altura: 3, watts: 1200, cor: [0.93, 0.96, 1] }, // softbox_teto
  { pos: [7.5, 3.5, 2.6], euler: [72.6, 0, 119.8], largura: 4, altura: 1.2, watts: 350, cor: [0.75, 0.84, 1] }, // recorte_tras
];

/** Palco do RB22, dividido pelo Showroom e pela Aerodinâmica ativa. */
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
  const estudio = criarEstudio(canvas, { ...ambiente, luzes: LUZES_ESTUDIO, nomeDebug: '__palco3d' });
  const flaps: Mesh[] = [];
  const nos = new Map<string, Object3D>();
  if (import.meta.env.DEV) Object.assign((window as unknown as Record<string, object>).__palco3d, { nos });

  return {
    async carregar(onProgresso) {
      const modelo = await estudio.carregar(asset('/models/rb22.glb'), onProgresso);
      modelo.traverse((o) => {
        nos.set(o.name, o);
        if (FLAPS.includes(o.name) && (o as Mesh).isMesh) flaps.push(o as Mesh);
      });
    },
    definirPose: estudio.definirPose,
    definirPeso(w) {
      for (const m of flaps) {
        const i = m.morphTargetDictionary?.reta;
        if (i !== undefined && m.morphTargetInfluences) m.morphTargetInfluences[i] = w;
      }
      estudio.pedirQuadro();
    },
    projetar(nome) {
      const no = nos.get(nome);
      return no ? estudio.projetar(no.getWorldPosition(new Vector3())) : null;
    },
    ativar: estudio.ativar,
    aoDesenhar: estudio.aoDesenhar,
  };
}
