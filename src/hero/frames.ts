import { FRAME_COUNT } from './scrub';
import { asset } from '../core/url';

export type FrameSet = 'desktop' | 'mobile';

export function frameUrl(set: FrameSet, index: number): string {
  const n = String(index + 1).padStart(3, '0');
  return asset(`/hero/frames/${set}/f_${n}.webp`);
}

export function splitLoadOrder(count: number, stride = 4): { priority: number[]; rest: number[] } {
  const priority: number[] = [];
  const rest: number[] = [];
  for (let i = 0; i < count; i++) {
    (i % stride === 0 || i === count - 1 ? priority : rest).push(i);
  }
  return { priority, rest };
}

export function nearestLoaded(loaded: ReadonlySet<number>, wanted: number, count: number): number | null {
  if (loaded.has(wanted)) return wanted;
  for (let d = 1; d < count; d++) {
    if (loaded.has(wanted - d)) return wanted - d;
    if (loaded.has(wanted + d)) return wanted + d;
  }
  return null;
}

const BATCH = 6;

export class FrameStore {
  private readonly images: (HTMLImageElement | null)[];
  private readonly loaded = new Set<number>();
  private loading: Promise<void> | null = null;

  constructor(private readonly set: FrameSet, private readonly count = FRAME_COUNT) {
    this.images = new Array(count).fill(null);
  }

  /**
   * Resolve quando os quadros prioritários carregam; o resto continua em segundo plano.
   * Chamadas seguintes reaproveitam o mesmo carregamento (o progresso só é avisado à primeira).
   */
  load(onPriorityProgress: (fraction: number) => void): Promise<void> {
    this.loading ??= this.loadAll(onPriorityProgress);
    return this.loading;
  }

  private async loadAll(onPriorityProgress: (fraction: number) => void): Promise<void> {
    const { priority, rest } = splitLoadOrder(this.count);
    let done = 0;
    for (let k = 0; k < priority.length; k += BATCH) {
      await Promise.all(
        priority.slice(k, k + BATCH).map(async (i) => {
          await this.loadOne(i);
          done++;
          onPriorityProgress(done / priority.length);
        }),
      );
    }
    void (async () => {
      for (let k = 0; k < rest.length; k += BATCH) {
        await Promise.all(rest.slice(k, k + BATCH).map((i) => this.loadOne(i)));
      }
    })();
  }

  get(index: number): HTMLImageElement | null {
    const i = nearestLoaded(this.loaded, index, this.count);
    return i === null ? null : this.images[i];
  }

  private loadOne(i: number): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.images[i] = img;
        this.loaded.add(i);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = frameUrl(this.set, i);
    });
  }
}

const stores = new Map<FrameSet, FrameStore>();

/** Armazenamento único por conjunto: a Hero e o Fechamento dividem os mesmos quadros na memória. */
export function getFrameStore(set: FrameSet): FrameStore {
  let store = stores.get(set);
  if (!store) {
    store = new FrameStore(set);
    stores.set(set, store);
  }
  return store;
}
