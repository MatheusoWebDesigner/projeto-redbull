export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Retângulo para desenhar a imagem cobrindo o canvas. focusX: 0 = mantém a esquerda, 1 = mantém a direita. */
export function coverRect(srcW: number, srcH: number, dstW: number, dstH: number, focusX = 0.5): Rect {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (dstW - w) * focusX, y: (dstH - h) / 2, w, h };
}
