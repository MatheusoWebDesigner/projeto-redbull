/** As 5 peças, na ordem das paradas 1–5 (nós `hotspot_<peça>` do rb22.glb). */
export const PECAS = ['asa-dianteira', 'halo', 'sidepod-esquerdo', 'assoalho-difusor', 'asa-traseira'] as const;
export type Peca = (typeof PECAS)[number];
export type Lado = 'esquerda' | 'direita';

export interface EntradaHotspot {
  indice: number; // 0..4
  parada: number; // 0..5
  visivelNaPose: boolean; // de src/data/hotspots.json (parada mais próxima)
  noQuadro: boolean; // projeção dentro da tela e na frente da câmera
  x: number; // px na tela
  zonaTexto: number; // borda direita da coluna de texto (0 no celular)
}

export function estadoHotspot(e: EntradaHotspot): { ativo: boolean; visivel: boolean } {
  const ativo = e.parada === e.indice + 1;
  return { ativo, visivel: e.noQuadro && e.visivelNaPose && (ativo || e.x > e.zonaTexto) };
}

const FOLGA = 16;

/** O rótulo fica à esquerda do ponto, a não ser que entre na zona do texto. */
export function ladoDoRotulo(x: number, larguraRotulo: number, zonaTexto: number): Lado {
  return x - larguraRotulo - FOLGA < zonaTexto ? 'direita' : 'esquerda';
}
