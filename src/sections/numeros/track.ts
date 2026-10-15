const clamp01 = (p: number) => Math.min(1, Math.max(0, p));
const dois = (n: number) => String(n).padStart(2, '0');

/** Deslocamento horizontal (px, negativo) do trilho para o progresso dado. */
export function trackShift(progress: number, total: number, visible: number): number {
  return -clamp01(progress) * Math.max(0, total - visible);
}

/** Primeiro e último cartão visíveis (1-based). */
export function visibleRange(progress: number, count: number, perView: number): [number, number] {
  const first = Math.round(clamp01(progress) * (count - perView)) + 1;
  return [first, Math.min(count, first + perView - 1)];
}

export function rangeLabel(first: number, last: number, count: number): string {
  return first === last ? `${dois(first)} / ${dois(count)}` : `${dois(first)}–${dois(last)} / ${dois(count)}`;
}
