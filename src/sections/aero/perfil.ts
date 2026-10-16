export type Ponto = [number, number];
interface Corda { bordo_de_ataque: Ponto; bordo_de_fuga: Ponto }
type Pecas = Record<'plano_principal_fixo' | 'tras_flap1' | 'tras_flap2', Corda>;
export interface DadosPerfil { resolucao: [number, number]; curva: Pecas; reta: Pecas; dobradica_flap2: Ponto }

const EXTENSAO = 0.45; // a corda tracejada passa 45% além do bordo de fuga, como no Figma
const RAIO = 70;

export interface GeometriaPerfil {
  tracejada: [Ponto, Ponto];
  amarela: [Ponto, Ponto];
  arco: { centro: Ponto; raio: number; de: number; ate: number };
  rotulo: Ponto;
}

export function geometriaPerfil(d: DadosPerfil): GeometriaPerfil {
  const c = d.curva.tras_flap2;
  const r = d.reta.tras_flap2;
  const fim: Ponto = [
    c.bordo_de_fuga[0] + (c.bordo_de_fuga[0] - c.bordo_de_ataque[0]) * EXTENSAO,
    c.bordo_de_fuga[1] + (c.bordo_de_fuga[1] - c.bordo_de_ataque[1]) * EXTENSAO,
  ];
  const ang = (a: Ponto, b: Ponto) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  return {
    tracejada: [c.bordo_de_ataque, fim],
    amarela: [r.bordo_de_ataque, r.bordo_de_fuga],
    arco: { centro: d.dobradica_flap2, raio: RAIO, de: ang(r.bordo_de_ataque, r.bordo_de_fuga), ate: ang(c.bordo_de_ataque, c.bordo_de_fuga) },
    rotulo: [r.bordo_de_fuga[0] + 24, c.bordo_de_fuga[1] - 16],
  };
}

/** SVG no espaço de pixels do render; preserveAspectRatio "slice" acompanha o object-fit: cover da imagem. */
export function svgPerfil(g: GeometriaPerfil, [w, h]: [number, number]): string {
  const p = (x: Ponto) => `${x[0].toFixed(1)} ${x[1].toFixed(1)}`;
  const em = (a: number): Ponto => [g.arco.centro[0] + g.arco.raio * Math.cos(a), g.arco.centro[1] + g.arco.raio * Math.sin(a)];
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <path d="M${p(g.tracejada[0])} L${p(g.tracejada[1])}" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-dasharray="8 8" fill="none"/>
  <path d="M${p(g.amarela[0])} L${p(g.amarela[1])}" stroke="#ffc906" stroke-width="3" fill="none"/>
  <path d="M${p(em(g.arco.de))} A${g.arco.raio} ${g.arco.raio} 0 0 0 ${p(em(g.arco.ate))}" stroke="#ffc906" stroke-width="2" fill="none"/>
</svg>`;
}
