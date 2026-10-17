export type Vec3 = [number, number, number];

/** Blender (Z para cima) -> Three.js (Y para cima): (x, y, z) -> (x, z, -y). */
export function blenderToThree([x, y, z]: Vec3): Vec3 {
  return [x, z, -y + 0];
}

/**
 * Converte o shift da câmera do Blender (fração do MAIOR lado) no deslocamento
 * em pixels de `camera.setViewOffset`. Shift positivo em X leva o quadro para a
 * direita; em Y, para cima (no Three o y da janela cresce para baixo).
 */
export function viewOffset(shiftX: number, shiftY: number, width: number, height: number): { x: number; y: number } {
  const maior = Math.max(width, height);
  return { x: shiftX * maior + 0, y: -shiftY * maior + 0 };
}

/** Fov vertical para uma tela mais estreita que o render, preservando o enquadramento horizontal. */
export function fitFov(fovV: number, refAspect: number, aspect: number): number {
  if (aspect >= refAspect) return fovV;
  const meio = (fovV * Math.PI) / 360;
  return (Math.atan(Math.tan(meio) * (refAspect / aspect)) * 360) / Math.PI;
}

/** Luz de área do Blender (potência em W, lados em m) -> radiância usada como intensidade da RectAreaLight. */
export function radianciaArea(watts: number, largura: number, altura: number): number {
  const area = largura * altura;
  return area > 0 ? watts / (Math.PI * area) : 0;
}
