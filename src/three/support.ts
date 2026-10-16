export interface Ambiente3D {
  webgl2: boolean;
  memoriaGb?: number; // navigator.deviceMemory (só Chromium)
  nucleos?: number; // navigator.hardwareConcurrency
  forcarPlanoB?: boolean;
}

export function podeUsar3D(a: Ambiente3D): boolean {
  if (a.forcarPlanoB || !a.webgl2) return false;
  if (a.memoriaGb !== undefined && a.memoriaGb < 4) return false;
  if (a.nucleos !== undefined && a.nucleos < 4) return false;
  return true;
}

export function lerAmbiente(): Ambiente3D {
  let webgl2 = false;
  try {
    webgl2 = !!document.createElement('canvas').getContext('webgl2');
  } catch {
    webgl2 = false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    webgl2,
    memoriaGb: nav.deviceMemory,
    nucleos: nav.hardwareConcurrency || undefined,
    forcarPlanoB: new URLSearchParams(location.search).has('plano-b'),
  };
}
