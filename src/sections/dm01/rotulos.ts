/** Posição (px no quadro do Figma) do canto superior esquerdo de cada rótulo, por etapa. */
type Posicoes = Record<string, [number, number]>;

const DESKTOP_FAISCA: Posicoes = { turbo: [520, 96], v6: [640, 650], 'mgu-k': [860, 720], eletronica: [1220, 430], bateria: [1150, 790] };
const CELULAR_FAISCA: Posicoes = { turbo: [24, 428], v6: [24, 722], 'mgu-k': [24, 770], eletronica: [282, 596], bateria: [250, 788] };

/** Quadros 91:37, 91:88 e 91:139 (desktop 1440×900); 91:64, 91:115 e 91:166 (celular 390×844). */
export const POSICOES_ROTULOS: Record<'desktop' | 'mobile', { quadro: [number, number]; etapas: Posicoes[] }> = {
  desktop: {
    quadro: [1440, 900],
    etapas: [
      DESKTOP_FAISCA,
      { ...DESKTOP_FAISCA, turbo: [560, 96], v6: [720, 650] },
      DESKTOP_FAISCA,
      { turbo: [500, 92], v6: [600, 650], 'mgu-k': [870, 730], eletronica: [1196, 448], bateria: [1100, 800] },
    ],
  },
  mobile: {
    quadro: [390, 844],
    etapas: [
      CELULAR_FAISCA,
      { ...CELULAR_FAISCA, turbo: [24, 438], v6: [24, 730] },
      CELULAR_FAISCA,
      { turbo: [100, 418], v6: [24, 722], 'mgu-k': [24, 770], eletronica: [282, 600], bateria: [230, 792] },
    ],
  },
};

/** Ponto da caixa do rótulo mais perto da peça: é dali que sai a linha guia. */
export function pontoDeSaida(caixa: { x: number; y: number; w: number; h: number }, alvo: [number, number]): [number, number] {
  return [Math.min(caixa.x + caixa.w, Math.max(caixa.x, alvo[0])), Math.min(caixa.y + caixa.h, Math.max(caixa.y, alvo[1]))];
}

/** Ponto do render (object-fit: cover) na tela, para as linhas guia do plano B. */
export function pontoNoCover(p: [number, number], render: [number, number], tela: [number, number]): [number, number] {
  const s = Math.max(tela[0] / render[0], tela[1] / render[1]);
  return [(tela[0] - render[0] * s) / 2 + p[0] * s, (tela[1] - render[1] * s) / 2 + p[1] * s];
}
