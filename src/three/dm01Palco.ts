import { Color, CubicBezierCurve3, Material, Mesh, MeshStandardMaterial, Object3D, TubeGeometry, Vector3 } from 'three';
import { criarEstudio, type LuzBlender, type Projecao } from './base';
import type { Pose } from './cameras';
import type { Vec3 } from './convert';
import dados from '../data/dm01.json';
import { pontosBezier } from '../sections/dm01/cabos';
import { giroGraus, interpolarNumero, interpolarVetor, type Estado } from '../sections/dm01/estados';
import { asset } from '../core/url';

type Tabela<T> = Record<Estado, T>;
interface DadosPeca extends Tabela<Vec3> { chave: string }

/** Nó do GLB de cada peça com rótulo. */
export const NO_DA_PECA: Record<string, string> = {
  v6: 'dm01_v6', turbo: 'dm01_turbo', 'mgu-k': 'dm01_mgu_k', bateria: 'dm01_bateria', eletronica: 'dm01_eletronica',
};

const LUZES: LuzBlender[] = dados.luzes.map((l) => ({
  pos: l.pos as Vec3, euler: l.euler as Vec3, largura: l.tam[0], altura: l.tam[1], watts: l.watts.E0, cor: l.cor as [number, number, number],
}));
const PECAS = dados.pecas as unknown as Record<string, DadosPeca>;
const EMISSAO = dados.emissao as Record<string, Tabela<number>>;

export interface PalcoDm01 {
  carregar(onProgresso: (f: number) => void): Promise<void>;
  definirPose(pose: Pose): void;
  /** Aplica o estado do motor para o progresso do pin: peças, giro, cabos, luzes e emissão. */
  definirProgresso(p: number): void;
  projetar(peca: string): Projecao | null;
  ativar(sim: boolean): void;
  aoDesenhar(fn: () => void): void;
}

export function criarPalcoDm01(canvas: HTMLCanvasElement): PalcoDm01 {
  const estudio = criarEstudio(canvas, {
    rotacaoGraus: dados.hdri.rotacao_z_graus, intensidade: dados.hdri.intensidade, luzes: LUZES, nomeDebug: '__dm01',
  });
  let raiz: Object3D | null = null;
  const nos = new Map<string, Object3D>();
  const base = new Map<string, Vector3>();
  const emissivos: { mat: MeshStandardMaterial; tabela: Tabela<number>; base: number }[] = [];
  let materialCabo: Material = new MeshStandardMaterial({ color: new Color('#ff7a1a'), roughness: 0.45 });
  const cabos: Mesh[] = [];

  const deslocamento = (objeto: string, p: number): Vec3 => (PECAS[objeto] ? interpolarVetor(PECAS[objeto], p) : [0, 0, 0]);

  const refazerCabos = (p: number) => {
    if (!raiz) return;
    dados.cabos.forEach((c, i) => {
      const da = deslocamento(c.de.objeto, p);
      const db = deslocamento(c.para.objeto, p);
      const p0: Vec3 = [c.de.ponto[0] + da[0], c.de.ponto[1] + da[1], c.de.ponto[2] + da[2]];
      const p3: Vec3 = [c.para.ponto[0] + db[0], c.para.ponto[1] + db[1], c.para.ponto[2] + db[2]];
      const pts = pontosBezier(p0, c.de.direcao as Vec3, p3, c.para.direcao as Vec3).map((v) => new Vector3(...v));
      const geo = new TubeGeometry(new CubicBezierCurve3(pts[0], pts[1], pts[2], pts[3]), 28, c.raio, 8, false);
      if (!cabos[i]) {
        cabos[i] = new Mesh(geo, materialCabo);
        raiz!.add(cabos[i]);
      } else {
        cabos[i].geometry.dispose();
        cabos[i].geometry = geo;
      }
    });
  };

  return {
    async carregar(onProgresso) {
      raiz = await estudio.carregar(asset('/models/dm01.glb'), onProgresso);
      raiz.traverse((o) => {
        nos.set(o.name, o);
        if (PECAS[o.name]) base.set(o.name, o.position.clone());
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          if (m.name === 'dm01_laranja_hv') materialCabo = m;
          const tabela = EMISSAO[m.name];
          if (tabela && !emissivos.some((e) => e.mat === m)) {
            const std = m as MeshStandardMaterial;
            emissivos.push({ mat: std, tabela, base: std.emissiveIntensity });
          }
        }
      });
      refazerCabos(0);
    },
    definirPose: (pose) => estudio.definirPose(pose),
    definirProgresso(p) {
      if (!raiz) return;
      for (const [nome, pos0] of base) {
        const d = deslocamento(nome, p);
        nos.get(nome)!.position.set(pos0.x + d[0], pos0.y + d[1], pos0.z + d[2]);
      }
      raiz.rotation.y = (giroGraus(p) * Math.PI) / 180;
      refazerCabos(p);
      dados.luzes.forEach((l, i) => estudio.definirWatts(i, interpolarNumero(l.watts, p)));
      for (const e of emissivos) e.mat.emissiveIntensity = e.base * interpolarNumero(e.tabela, p);
      estudio.pedirQuadro();
    },
    projetar(peca) {
      const no = nos.get(NO_DA_PECA[peca]);
      return no ? estudio.projetar(no.getWorldPosition(new Vector3())) : null;
    },
    ativar: estudio.ativar,
    aoDesenhar: estudio.aoDesenhar,
  };
}
