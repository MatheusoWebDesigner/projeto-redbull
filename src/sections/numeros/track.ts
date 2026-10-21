const clamp01 = (p: number) => Math.min(1, Math.max(0, p)) || 0; // || 0: NaN vira o início

/** Deslocamento horizontal (px, negativo) do trilho para o progresso dado. */
export function trackShift(progress: number, total: number, visible: number): number {
  return -clamp01(progress) * Math.max(0, total - visible);
}

/** O cartão "entrou" quando ao menos 60% da largura dele está dentro da tela. */
export function cardEntrou(left: number, width: number, viewport: number): boolean {
  return left <= viewport - width * 0.6;
}
