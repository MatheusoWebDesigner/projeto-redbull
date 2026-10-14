export const FRAME_COUNT = 240;
export const CHAPTER_COUNT = 4;
export const SNAP_POINTS = [0, 0.25, 0.5, 0.75, 1];

/** Limita a 0..1; NaN vira 0 para não contaminar quadro, capítulo e telemetria. */
export function clamp01(p: number): number {
  if (Number.isNaN(p)) return 0;
  return Math.min(1, Math.max(0, p));
}

export function frameIndexFor(progress: number, frameCount = FRAME_COUNT): number {
  return Math.round(clamp01(progress) * (frameCount - 1));
}

export function chapterIndexFor(progress: number, chapterCount = CHAPTER_COUNT): number {
  return Math.min(chapterCount - 1, Math.floor(clamp01(progress) * chapterCount));
}
