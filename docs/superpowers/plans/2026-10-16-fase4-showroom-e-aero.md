# Fase 4: Showroom 3D e Aerodinâmica ativa (plano de implementação)

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** construir as seções Showroom 3D e Aerodinâmica ativa com o RB22 em Three.js, dividindo o mesmo canvas. O plano B (renders) e o movimento reduzido seguem o Figma.

**Arquitetura:**
- **Canvas compartilhado:** um wrapper `.palco3d` envolve as duas seções e guarda um fundo `position: sticky`, onde ficam o canvas WebGL, a imagem de render (pôster e plano B) e as imagens do perfil. As duas seções têm pin (GSAP ScrollTrigger) e fundo transparente por cima desse palco.
- **Lógica pura testada:** conversão Blender → Three, trilho de câmera, órbita, hotspots, linha do tempo da aero e geometria do perfil ficam em módulos puros com Vitest.
- **Three.js carregado sob demanda:** a cena entra por `import()` dinâmico uma tela antes da seção, para não entrar no pacote inicial.

**Stack:** Vite 8, TypeScript 7, GSAP 3.15 (ScrollTrigger), Lenis 1.3, **three 0.186.1** (nova dependência), Vitest 5 (ambiente node).

**Fontes da verdade:**
- Figma `M4LbG2oj3n7rGn3YesgOBV`:
  - página "03 · Showroom 3D": quadros `52:4`…`52:313` (desktop) e `52:38`…`52:346` (celular), carregamento `57:148` e movimento reduzido `57:100`;
  - página "04 · Aerodinâmica ativa": quadros `67:4`, `67:82`, `67:160` e `67:205` (desktop), `67:44`…`67:228` (celular) e movimento reduzido `76:102`.
- Specs `docs/superpowers/specs/2026-10-08-showroom-design.md` e `2026-10-08-aero-ativa-design.md`.
- Manifesto do modelo: `public/models/manifesto.json`.

**Pins:** Showroom 450vh no desktop e 380vh no celular. Aero 300vh no desktop e 240vh no celular. O celular é detectado por `(max-aspect-ratio: 1/1)`.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `scripts/importar-assets-3d.py` | Converte os renders PNG do Blender em WebP e enxuga os JSON de câmera, hotspot e perfil |
| `public/showroom/{desktop,mobile}/sr_00…05.webp` | Pôster, plano B e lista do movimento reduzido |
| `public/aero/{desktop,mobile}/{A,B,C}_{curva,reta}.webp` | Plano B, perfil (etapa 3) e movimento reduzido |
| `public/draco/` | Decodificador Draco copiado de `three/examples/jsm/libs/draco/gltf/` |
| `src/data/showroom-cameras.json`, `aero-cameras.json`, `hotspots.json`, `perfil.json` | Dados enxutos |
| `src/three/convert.ts` (+teste) | Eixos Blender → Three, `setViewOffset`, ajuste de fov |
| `src/three/cameras.ts` (+teste) | Tipo `Pose`, conversão da pose bruta e interpolação |
| `src/three/support.ts` (+teste) | Decide entre 3D e plano B |
| `src/three/palco.ts` | Renderer, cena, ambiente HDR, GLB, pose, morph, projeção e quadro sob demanda |
| `src/sections/showroom/rail.ts` (+teste) | Trilho de câmera, parada ativa, barras e encaixe |
| `src/sections/showroom/orbit.ts` (+teste) | Arraste → giro/inclinação com limites; órbita da posição |
| `src/sections/showroom/hotspots.ts` (+teste) | Visibilidade, estado ativo e lado do rótulo |
| `src/sections/showroom/showroom.ts`, `showroom.css` | DOM, ScrollTrigger e arraste do Showroom |
| `src/sections/aero/linha.ts` (+teste) | Etapa, peso automático dos flaps, opacidades e trecho de câmera |
| `src/sections/aero/perfil.ts` (+teste) | Geometria e SVG da sobreposição do perfil |
| `src/sections/aero/aero.ts`, `aero.css` | DOM, ScrollTrigger, seletor de modo e cartão |
| `src/sections/palco3d/palco3d.ts`, `palco3d.css` | Escolhe o modo, carregamento preguiçoso, fundo sticky e transição Showroom → Aero |
| `index.html` | Marcação das duas seções no lugar do comentário da Fase 4 |
| `src/main.ts` | Chama `initPalco3D()` entre Manifesto e Números |

Convenções que já existem no repo e devem ser seguidas:
- `prefersReducedMotion()` (`src/core/motion.ts`) e a classe `reduced` no `<html>`.
- `startSmoothScroll()` (`src/core/scroll.ts`) devolve a instância única do Lenis.
- `formatNumber`.
- As classes `.kicker`, `.corpo`, `.rotulo` e `.btn` de `src/styles/base.css`.
- Tokens de `src/styles/tokens.css`.
- Comentários e textos em pt-BR.

---

### Task 1: Dependência three, decodificador Draco e revisão de segurança

**Arquivos:**
- Modificar: `package.json`, `package-lock.json`
- Criar: `public/draco/draco_decoder.js`, `public/draco/draco_decoder.wasm`, `public/draco/draco_wasm_wrapper.js`

- [ ] **Passo 1: instalar com versões fixas**

```bash
npm install --save-exact three@0.186.1
npm install --save-exact --save-dev @types/three@0.186.0
```

- [ ] **Passo 2: conferir os carregadores usados pelo plano**

```bash
ls node_modules/three/examples/jsm/loaders/ | grep -E "^(GLTFLoader|DRACOLoader|HDRLoader|RGBELoader)\.js$"
```

Esperado: `DRACOLoader.js`, `GLTFLoader.js` e `HDRLoader.js`. Se `HDRLoader.js` não existir, usar `RGBELoader.js` (mesma API `load(url, onLoad)`) nos imports do Task 10.

- [ ] **Passo 3: copiar o decodificador Draco**

```bash
mkdir -p public/draco && cp node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm node_modules/three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js public/draco/
```

- [ ] **Passo 4: revisão do `appsec-engineer`**
  - Escopo:
    - `npm audit --omit=dev`;
    - procedência e integridade de `three@0.186.1` (registro npm, mantenedores, `npm view three@0.186.1 dist.integrity`);
    - os arquivos copiados para `public/draco/` (são os mesmos do pacote? comparar `sha256sum`);
    - o uso futuro de `fetch` de `/models/*.glb` e `/env/*.hdr` (mesma origem).
  - Corrigir achados altos antes de seguir.

- [ ] **Passo 5: testes e build ainda verdes**

Rodar: `npm test && npm run build`. Esperado: PASS, sem mudança de comportamento.

- [ ] **Passo 6: commit**

```bash
git add package.json package-lock.json public/draco
git commit -m "build: three.js 0.186.1 e decodificador Draco"
```

---

### Task 2: Importar renders e dados do Blender

**Arquivos:**
- Criar: `scripts/importar-assets-3d.py`
- Gerados:
  - `public/showroom/**`
  - `public/aero/**`
  - `src/data/showroom-cameras.json`, `src/data/aero-cameras.json`, `src/data/hotspots.json`, `src/data/perfil.json`

- [ ] **Passo 1: escrever o script**

```python
"""Importa os renders e os dados de câmera do Blender para a web.

Uso: python -I scripts/importar-assets-3d.py "D:/Projeto RedBull - Arquivos Brutos (Blender)/07_quadros-para-figma"
"""
import json
import sys
from pathlib import Path

from PIL import Image

ORIGEM = Path(sys.argv[1])
RAIZ = Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / "public"
DATA = RAIZ / "src" / "data"
CAMPOS_POSE = ("posicao_m", "alvo_m", "fov_vertical_graus", "shift_x", "shift_y", "resolucao")


def webp(png: Path, destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    Image.open(png).convert("RGB").save(destino, "WEBP", quality=86, method=6)
    print(f"{destino.relative_to(RAIZ)}  {destino.stat().st_size // 1024} KB")


def salvar(nome: str, dados: dict) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / nome).write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


for aparelho in ("desktop", "mobile"):
    for i in range(6):
        webp(ORIGEM / "showroom" / aparelho / f"sr_0{i}.png", PUBLIC / "showroom" / aparelho / f"sr_0{i}.webp")
    for corte in "ABC":
        for modo in ("curva", "reta"):
            webp(ORIGEM / "aero" / aparelho / f"{corte}_{modo}.png", PUBLIC / "aero" / aparelho / f"{corte}_{modo}.webp")

sr = json.loads((ORIGEM / "showroom" / "showroom_cameras.json").read_text(encoding="utf-8"))
salvar("showroom-cameras.json", {
    "hdri_rotacao_z_graus": sr["hdri_rotacao_z_graus"],
    "hdri_intensidade": sr["hdri_intensidade"],
    "cameras": {ap: [{k: c[k] for k in CAMPOS_POSE} for _, c in sorted(cams.items())] for ap, cams in sr["cameras"].items()},
})

aero = json.loads((ORIGEM / "aero" / "aero_cameras.json").read_text(encoding="utf-8"))
salvar("aero-cameras.json", {ap: {n: {k: c[k] for k in CAMPOS_POSE} for n, c in cams.items() if n in ("A", "C")} for ap, cams in aero["cameras"].items()})

hs = json.loads((ORIGEM / "showroom" / "hotspots.json").read_text(encoding="utf-8"))
salvar("hotspots.json", {ap: [{peca: v["visivel"] for peca, v in pecas.items()} for _, pecas in sorted(paradas.items())] for ap, paradas in hs.items()})

perfil = json.loads((ORIGEM / "aero" / "perfil.json").read_text(encoding="utf-8"))
PECAS = ("plano_principal_fixo", "tras_flap1", "tras_flap2")
salvar("perfil.json", {
    ap: {
        "resolucao": d["resolucao"],
        **{modo: {p: {k: d[modo][p][k] for k in ("bordo_de_ataque", "bordo_de_fuga") } for p in PECAS} for modo in ("curva", "reta")},
        "dobradica_flap2": d["curva"]["tras_flap2"]["dobradica"],
    }
    for ap, d in perfil.items() if ap in ("desktop", "mobile")
})
print("ok")
```

- [ ] **Passo 2: rodar**

```bash
python -I scripts/importar-assets-3d.py "D:/Projeto RedBull - Arquivos Brutos (Blender)/07_quadros-para-figma"
```

Esperado: 24 linhas `public/...webp NN KB` (6+6 do showroom e 12 da aero) e `ok`. Nenhum WebP pode passar de 350 KB; se passar, baixar `quality` para 80 e rodar de novo.

- [ ] **Passo 3: conferir os dados**

```bash
node -e "const s=require('./src/data/showroom-cameras.json');console.log(s.cameras.desktop.length,s.cameras.mobile.length,Object.keys(require('./src/data/aero-cameras.json').desktop),require('./src/data/hotspots.json').desktop.length)"
```

Esperado: `6 6 [ 'A', 'C' ] 6`.

- [ ] **Passo 4: commit**

```bash
git add scripts/importar-assets-3d.py public/showroom public/aero src/data
git commit -m "feat(3d): renders WebP e dados de câmera do Showroom e da Aero"
```

---

### Task 3: Conversão Blender → Three (`convert.ts`)

**Arquivos:** criar `src/three/convert.ts` e `src/three/convert.test.ts`

- [ ] **Passo 1: teste que falha**

```ts
import { describe, expect, it } from 'vitest';
import { blenderToThree, fitFov, viewOffset } from './convert';

describe('blenderToThree', () => {
  it('troca Z para cima por Y para cima: (x, y, z) -> (x, z, -y)', () => {
    expect(blenderToThree([1, 2, 3])).toEqual([1, 3, -2]);
  });
  it('não produz -0', () => {
    expect(Object.is(blenderToThree([0, 0, 0])[2], 0)).toBe(true);
  });
});

describe('viewOffset', () => {
  it('desloca em fração do maior lado; y invertido (tela cresce para baixo)', () => {
    const o = viewOffset(-0.1965, -0.0362, 1440, 900);
    expect(o.x).toBeCloseTo(-282.96, 2);
    expect(o.y).toBeCloseTo(52.128, 2);
  });
  it('em retrato o maior lado é a altura', () => {
    const o = viewOffset(0.0358, 0.2204, 390, 844);
    expect(o.x).toBeCloseTo(30.215, 2);
    expect(o.y).toBeCloseTo(-186.018, 2);
  });
});

describe('fitFov', () => {
  it('mantém o fov vertical quando a tela é igual ou mais larga que o render', () => {
    expect(fitFov(31.312, 1.6, 1.6)).toBe(31.312);
    expect(fitFov(31.312, 1.6, 2.2)).toBe(31.312);
  });
  it('abre o fov vertical quando a tela é mais estreita, para não cortar nas laterais', () => {
    expect(fitFov(31.312, 1.6, 1.2)).toBeCloseTo(40.979, 2);
    expect(fitFov(48.119, 1080 / 2340, 0.4)).toBeCloseTo(54.512, 2);
  });
});
```

- [ ] **Passo 2:** rodar `npx vitest run src/three/convert.test.ts`. Esperado: FAIL (módulo inexistente).

- [ ] **Passo 3: implementação**

```ts
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
```

- [ ] **Passo 4:** rodar o mesmo comando. Esperado: PASS (6 testes).
- [ ] **Passo 5:** `git add src/three/convert.ts src/three/convert.test.ts && git commit -m "feat(3d): conversão de eixos, shift e fov do Blender para o Three"`

---

### Task 4: Poses de câmera (`cameras.ts`)

**Arquivos:** criar `src/three/cameras.ts` e `src/three/cameras.test.ts`

- [ ] **Passo 1: teste que falha**

```ts
import { describe, expect, it } from 'vitest';
import { lerpPose, toPose, type PoseBruta } from './cameras';

const bruta: PoseBruta = {
  posicao_m: [-4.6322, -6.0304, 3.2899], alvo_m: [1.3982, 0, 0.5189],
  fov_vertical_graus: 31.312, shift_x: -0.1965, shift_y: -0.0362, resolucao: [1920, 1200],
};

describe('toPose', () => {
  it('converte posição e alvo para o Three e guarda o aspecto do render', () => {
    const p = toPose(bruta);
    expect(p.pos).toEqual([-4.6322, 3.2899, 6.0304]);
    expect(p.alvo).toEqual([1.3982, 0.5189, 0]);
    expect(p.fov).toBe(31.312);
    expect(p.shiftX).toBe(-0.1965);
    expect(p.shiftY).toBe(-0.0362);
    expect(p.aspecto).toBeCloseTo(1.6, 6);
  });
});

describe('lerpPose', () => {
  const a = toPose(bruta);
  const b = toPose({ ...bruta, posicao_m: [0, 0, 0], alvo_m: [0, 0, 0], fov_vertical_graus: 41.312, shift_x: 0, shift_y: 0 });
  it('nas pontas devolve as próprias poses', () => {
    expect(lerpPose(a, b, 0)).toEqual(a);
    expect(lerpPose(a, b, 1)).toEqual(b);
  });
  it('no meio faz a média de cada campo', () => {
    const m = lerpPose(a, b, 0.5);
    expect(m.fov).toBeCloseTo(36.312, 6);
    expect(m.pos[0]).toBeCloseTo(-2.3161, 6);
    expect(m.shiftX).toBeCloseTo(-0.09825, 6);
  });
});
```

- [ ] **Passo 2:** `npx vitest run src/three/cameras.test.ts`. Esperado: FAIL.
- [ ] **Passo 3: implementação**

```ts
import { blenderToThree, type Vec3 } from './convert';

/** Pose como sai dos JSON do Blender (`src/data/*-cameras.json`). */
export interface PoseBruta {
  posicao_m: Vec3;
  alvo_m: Vec3;
  fov_vertical_graus: number;
  shift_x: number;
  shift_y: number;
  resolucao: [number, number];
}

/** Pose já nos eixos do Three. `aspecto` é largura/altura do render de referência. */
export interface Pose {
  pos: Vec3;
  alvo: Vec3;
  fov: number;
  shiftX: number;
  shiftY: number;
  aspecto: number;
}

export function toPose(b: PoseBruta): Pose {
  return {
    pos: blenderToThree(b.posicao_m),
    alvo: blenderToThree(b.alvo_m),
    fov: b.fov_vertical_graus,
    shiftX: b.shift_x,
    shiftY: b.shift_y,
    aspecto: b.resolucao[0] / b.resolucao[1],
  };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    pos: mix3(a.pos, b.pos, t),
    alvo: mix3(a.alvo, b.alvo, t),
    fov: mix(a.fov, b.fov, t),
    shiftX: mix(a.shiftX, b.shiftX, t),
    shiftY: mix(a.shiftY, b.shiftY, t),
    aspecto: mix(a.aspecto, b.aspecto, t),
  };
}
```

- [ ] **Passo 4:** rodar de novo. Esperado: PASS (3 testes).
- [ ] **Passo 5:** `git add src/three/cameras.* && git commit -m "feat(3d): poses de câmera e interpolação"`

---

### Task 5: Trilho do Showroom (`rail.ts`)

**Arquivos:** criar `src/sections/showroom/rail.ts` e `src/sections/showroom/rail.test.ts`

- [ ] **Passo 1: teste que falha**

```ts
import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../../three/convert';
import { catmullRom, easeInOut, encaixeMaisProximo, estadoBarras, paradaAtiva, railU } from './rail';

describe('easeInOut (power2.inOut)', () => {
  it('fixa as pontas e o meio', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.25)).toBe(0.125);
  });
});

describe('railU', () => {
  it('passa exatamente pelas 6 paradas', () => {
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((p) => expect(railU(p)).toBeCloseTo(p, 10));
  });
  it('desacelera perto da parada', () => {
    expect(railU(0.05)).toBeCloseTo(0.025, 10);
    expect(railU(0.25)).toBeCloseTo(0.225, 10);
  });
  it('limita progresso fora de 0..1 e trata NaN como início', () => {
    expect(railU(-1)).toBe(0);
    expect(railU(2)).toBe(1);
    expect(railU(Number.NaN)).toBe(0);
  });
});

describe('paradaAtiva', () => {
  it('troca na metade do caminho entre paradas', () => {
    expect(paradaAtiva(0)).toBe(0);
    expect(paradaAtiva(0.09)).toBe(0);
    expect(paradaAtiva(0.1)).toBe(1);
    expect(paradaAtiva(1)).toBe(5);
  });
});

describe('catmullRom', () => {
  const pts: Vec3[] = [[0, 0, 0], [1, 2, 0], [3, 2, 1], [4, 0, 1]];
  it('passa pelos pontos de controle', () => {
    pts.forEach((p, i) => {
      const r = catmullRom(pts, i / (pts.length - 1));
      r.forEach((v, k) => expect(v).toBeCloseTo(p[k], 10));
    });
  });
  it('é contínua entre os pontos', () => {
    const a = catmullRom(pts, 0.5 - 1e-6);
    const b = catmullRom(pts, 0.5 + 1e-6);
    a.forEach((v, k) => expect(v).toBeCloseTo(b[k], 4));
  });
});

describe('estadoBarras', () => {
  it('na visão geral fica tudo apagado', () => {
    expect(estadoBarras(0)).toEqual(['apagada', 'apagada', 'apagada', 'apagada', 'apagada']);
  });
  it('na parada 3 tem duas vistas e uma ativa', () => {
    expect(estadoBarras(3)).toEqual(['vista', 'vista', 'ativa', 'apagada', 'apagada']);
  });
});

describe('encaixeMaisProximo', () => {
  const pontos = [0, 0.48, 0.62, 1];
  it('devolve o ponto mais próximo', () => {
    expect(encaixeMaisProximo(0.2, pontos)).toBe(0);
    expect(encaixeMaisProximo(0.3, pontos)).toBe(0.48);
    expect(encaixeMaisProximo(0.9, pontos)).toBe(1);
  });
});
```

- [ ] **Passo 2:** `npx vitest run src/sections/showroom/rail.test.ts`. Esperado: FAIL.
- [ ] **Passo 3: implementação**

```ts
import type { Vec3 } from '../../three/convert';
import { lerpPose, type Pose } from '../../three/cameras';

export const PARADAS = 6;
export const PONTOS_SHOWROOM = [0, 0.2, 0.4, 0.6, 0.8, 1];

const clamp01 = (p: number) => Math.min(1, Math.max(0, p)) || 0; // NaN vira o início

/** Mesma curva do power2.inOut do GSAP. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
}

/** Parâmetro no trilho (0..1): passa pelas paradas e desacelera perto de cada uma. */
export function railU(progress: number, paradas = PARADAS): number {
  const s = clamp01(progress) * (paradas - 1);
  const i = Math.min(Math.floor(s), paradas - 2);
  return (i + easeInOut(s - i)) / (paradas - 1);
}

/** Índice da parada cujo texto aparece (troca na metade do caminho). */
export function paradaAtiva(progress: number, paradas = PARADAS): number {
  return Math.round(clamp01(progress) * (paradas - 1));
}

/** Catmull-Rom uniforme pelos pontos; u = 0 no primeiro e u = 1 no último. */
export function catmullRom(pontos: Vec3[], u: number): Vec3 {
  const n = pontos.length - 1;
  const s = clamp01(u) * n;
  const i = Math.min(Math.floor(s), n - 1);
  const t = s - i;
  const p0 = pontos[Math.max(i - 1, 0)];
  const p1 = pontos[i];
  const p2 = pontos[i + 1];
  const p3 = pontos[Math.min(i + 2, n)];
  const t2 = t * t;
  const t3 = t2 * t;
  return [0, 1, 2].map((k) =>
    0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
  ) as Vec3;
}

/** Pose da câmera no trilho: posição e alvo pela curva, lente e shift interpolados no trecho. */
export function poseNoTrilho(poses: Pose[], progress: number): Pose {
  const u = railU(progress, poses.length);
  const s = u * (poses.length - 1);
  const i = Math.min(Math.floor(s), poses.length - 2);
  const base = lerpPose(poses[i], poses[i + 1], s - i);
  return {
    ...base,
    pos: catmullRom(poses.map((p) => p.pos), u),
    alvo: catmullRom(poses.map((p) => p.alvo), u),
  };
}

export type EstadoBarra = 'apagada' | 'vista' | 'ativa';

/** Barras das 5 peças: as já passadas ficam "vistas" e a da parada atual, ativa. */
export function estadoBarras(parada: number, total = PARADAS - 1): EstadoBarra[] {
  return Array.from({ length: total }, (_, i) => (i + 1 < parada ? 'vista' : i + 1 === parada ? 'ativa' : 'apagada'));
}

export function encaixeMaisProximo(progress: number, pontos: number[]): number {
  return pontos.reduce((melhor, p) => (Math.abs(p - progress) < Math.abs(melhor - progress) ? p : melhor), pontos[0]);
}
```

- [ ] **Passo 4:** rodar de novo. Esperado: PASS.
- [ ] **Passo 5:** `git add src/sections/showroom/rail.* && git commit -m "feat(showroom): trilho de câmera, paradas, barras e encaixe"`

---

### Task 6: Órbita por arraste (`orbit.ts`)

**Arquivos:** criar `src/sections/showroom/orbit.ts` e `src/sections/showroom/orbit.test.ts`

- [ ] **Passo 1: teste que falha**

```ts
import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../../three/convert';
import { arrasto, GIRO_MAX, INCLINA_MAX, orbitar } from './orbit';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('arrasto', () => {
  it('converte pixels em graus', () => {
    expect(arrasto({ giro: 0, inclina: 0 }, 100, 0)).toEqual({ giro: 15, inclina: 0 });
  });
  it('limita a ±25° de giro e ±10° de inclinação', () => {
    expect(arrasto({ giro: 0, inclina: 0 }, 10000, 10000)).toEqual({ giro: GIRO_MAX, inclina: INCLINA_MAX });
    expect(arrasto({ giro: 0, inclina: 0 }, -10000, -10000)).toEqual({ giro: -GIRO_MAX, inclina: -INCLINA_MAX });
  });
});

describe('orbitar', () => {
  const alvo: Vec3 = [1, 0, 0];
  it('sem giro devolve a mesma posição', () => {
    const r = orbitar([2, 0, 0], alvo, 0, 0);
    r.forEach((v, k) => expect(v).toBeCloseTo([2, 0, 0][k], 10));
  });
  it('gira em torno do eixo vertical do alvo', () => {
    const r = orbitar([2, 0, 0], alvo, 90, 0);
    r.forEach((v, k) => expect(v).toBeCloseTo([1, 0, -1][k], 10));
  });
  it('preserva a distância ao alvo', () => {
    const p: Vec3 = [-4.6, 3.3, 6.0];
    expect(dist(orbitar(p, alvo, 20, 8), alvo)).toBeCloseTo(dist(p, alvo), 10);
  });
  it('inclinação positiva sobe a câmera', () => {
    expect(orbitar([3, 1, 0], alvo, 0, 10)[1]).toBeGreaterThan(1);
  });
});
```

- [ ] **Passo 2:** `npx vitest run src/sections/showroom/orbit.test.ts`. Esperado: FAIL.
- [ ] **Passo 3: implementação**

```ts
import type { Vec3 } from '../../three/convert';

export const GIRO_MAX = 25;
export const INCLINA_MAX = 10;
const GRAUS_POR_PX = 0.15;
const POLO = 0.05; // nunca alinha a câmera com o eixo vertical

export interface Orbita { giro: number; inclina: number }

const limitar = (v: number, max: number) => Math.min(max, Math.max(-max, v));

/** Soma o arraste (px) à órbita atual, com os limites da spec. */
export function arrasto(base: Orbita, dx: number, dy: number): Orbita {
  return {
    giro: limitar(base.giro + dx * GRAUS_POR_PX, GIRO_MAX),
    inclina: limitar(base.inclina + dy * GRAUS_POR_PX, INCLINA_MAX),
  };
}

/** Gira a posição da câmera em torno do alvo: giro no eixo vertical e inclinação para cima. */
export function orbitar(pos: Vec3, alvo: Vec3, giroGraus: number, inclinaGraus: number): Vec3 {
  const rel = [pos[0] - alvo[0], pos[1] - alvo[1], pos[2] - alvo[2]];
  const r = Math.hypot(rel[0], rel[1], rel[2]);
  const theta = Math.atan2(rel[0], rel[2]) + (giroGraus * Math.PI) / 180;
  const phi = Math.min(Math.PI - POLO, Math.max(POLO, Math.acos(rel[1] / r) - (inclinaGraus * Math.PI) / 180));
  return [
    alvo[0] + r * Math.sin(phi) * Math.sin(theta),
    alvo[1] + r * Math.cos(phi),
    alvo[2] + r * Math.sin(phi) * Math.cos(theta),
  ];
}
```

- [ ] **Passo 4:** rodar de novo. Esperado: PASS.
- [ ] **Passo 5:** `git add src/sections/showroom/orbit.* && git commit -m "feat(showroom): órbita por arraste com limites"`

---

### Task 7: Hotspots (`hotspots.ts`)

**Arquivos:** criar `src/sections/showroom/hotspots.ts` e `src/sections/showroom/hotspots.test.ts`

- [ ] **Passo 1: teste que falha**

```ts
import { describe, expect, it } from 'vitest';
import { estadoHotspot, ladoDoRotulo, PECAS } from './hotspots';

const base = { indice: 0, parada: 1, visivelNaPose: true, noQuadro: true, x: 900, zonaTexto: 520 };

describe('estadoHotspot', () => {
  it('a peça da parada atual fica ativa e visível', () => {
    expect(estadoHotspot(base)).toEqual({ ativo: true, visivel: true });
  });
  it('fora do quadro ou oculto na pose não aparece', () => {
    expect(estadoHotspot({ ...base, noQuadro: false }).visivel).toBe(false);
    expect(estadoHotspot({ ...base, visivelNaPose: false }).visivel).toBe(false);
  });
  it('inativo dentro da zona do texto fica oculto; ativo não', () => {
    expect(estadoHotspot({ ...base, parada: 3, x: 400 }).visivel).toBe(false);
    expect(estadoHotspot({ ...base, x: 400 }).visivel).toBe(true);
  });
  it('na visão geral (parada 0) nenhum é ativo', () => {
    PECAS.forEach((_, i) => expect(estadoHotspot({ ...base, indice: i, parada: 0 }).ativo).toBe(false));
  });
});

describe('ladoDoRotulo', () => {
  it('o rótulo fica à esquerda do ponto', () => {
    expect(ladoDoRotulo(1200, 160, 520)).toBe('esquerda');
  });
  it('vira para a direita quando invadiria a zona do texto', () => {
    expect(ladoDoRotulo(640, 160, 520)).toBe('direita');
  });
});
```

- [ ] **Passo 2:** `npx vitest run src/sections/showroom/hotspots.test.ts`. Esperado: FAIL.
- [ ] **Passo 3: implementação**

```ts
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
```

- [ ] **Passo 4:** rodar de novo. Esperado: PASS.
- [ ] **Passo 5:** `git add src/sections/showroom/hotspots.* && git commit -m "feat(showroom): regras de visibilidade e lado dos hotspots"`

---

### Task 8: Escolha entre 3D e plano B (`support.ts`)

**Arquivos:** criar `src/three/support.ts` e `src/three/support.test.ts`

- [ ] **Passo 1: teste que falha**

```ts
import { describe, expect, it } from 'vitest';
import { podeUsar3D } from './support';

describe('podeUsar3D', () => {
  it('exige WebGL2', () => {
    expect(podeUsar3D({ webgl2: false })).toBe(false);
    expect(podeUsar3D({ webgl2: true })).toBe(true);
  });
  it('recusa aparelho com pouca memória ou poucos núcleos', () => {
    expect(podeUsar3D({ webgl2: true, memoriaGb: 2 })).toBe(false);
    expect(podeUsar3D({ webgl2: true, nucleos: 2 })).toBe(false);
    expect(podeUsar3D({ webgl2: true, memoriaGb: 4, nucleos: 4 })).toBe(true);
  });
  it('o parâmetro ?plano-b força os renders (teste manual)', () => {
    expect(podeUsar3D({ webgl2: true, forcarPlanoB: true })).toBe(false);
  });
});
```

- [ ] **Passo 2:** `npx vitest run src/three/support.test.ts`. Esperado: FAIL.
- [ ] **Passo 3: implementação**

```ts
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
```

- [ ] **Passo 4:** rodar de novo. Esperado: PASS.
- [ ] **Passo 5:** `git add src/three/support.* && git commit -m "feat(3d): decide entre 3D e plano B"`

---

### Task 9: Linha do tempo e perfil da Aero (`linha.ts`, `perfil.ts`)

**Arquivos:** criar `src/sections/aero/linha.ts`, `linha.test.ts`, `perfil.ts` e `perfil.test.ts`

Linha do tempo (o progresso `p` vai de 0 a 1 dentro do pin da Aero):

| p | Etapa | Flaps (peso 0 = curva, 1 = reta) | Canvas / perfil | Câmera |
|---|---|---|---|---|
| 0–0,25 | 0 | 0 | canvas | A |
| 0,25–0,5 | 1 | sobe de 0 a 1 entre 0,30 e 0,45 | canvas | A |
| 0,5–0,75 | 2 | laço curva ↔ reta (fora desta função) | perfil entra entre 0,50 e 0,55 e sai entre 0,72 e 0,75 | A |
| 0,75–1 | 3 | 1 | canvas | de A a C entre 0,75 e 0,90 |

Pontos de encaixe da Aero: `[0, 0.48, 0.62, 1]`.

- [ ] **Passo 1: testes que falham**

`linha.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { etapaAero, linhaAero, modoDoPeso, pesoAutomatico } from './linha';

describe('etapaAero', () => {
  it('divide o pin em quatro', () => {
    expect([0, 0.24, 0.25, 0.5, 0.74, 0.75, 1].map(etapaAero)).toEqual([0, 0, 1, 2, 2, 3, 3]);
  });
  it('NaN é o início', () => expect(etapaAero(Number.NaN)).toBe(0));
});

describe('pesoAutomatico', () => {
  it('curva até 30%, reta a partir de 45%', () => {
    expect(pesoAutomatico(0.1)).toBe(0);
    expect(pesoAutomatico(0.3)).toBe(0);
    expect(pesoAutomatico(0.375)).toBeCloseTo(0.5, 10);
    expect(pesoAutomatico(0.45)).toBe(1);
    expect(pesoAutomatico(0.9)).toBe(1);
  });
});

describe('modoDoPeso', () => {
  it('metade para cima é reta', () => {
    expect(modoDoPeso(0.49)).toBe('curva');
    expect(modoDoPeso(0.5)).toBe('reta');
  });
});

describe('linhaAero', () => {
  it('perfil some fora da etapa 2 e aparece inteiro no meio dela', () => {
    expect(linhaAero(0.2).perfil).toBe(0);
    expect(linhaAero(0.6).perfil).toBe(1);
    expect(linhaAero(0.525).perfil).toBeCloseTo(0.5, 10);
    expect(linhaAero(0.735).perfil).toBeCloseTo(0.5, 10);
    expect(linhaAero(0.9).perfil).toBe(0);
  });
  it('câmera fica em A e viaja para C na última etapa', () => {
    expect(linhaAero(0.5).viagem).toBe(0);
    expect(linhaAero(0.825).viagem).toBeCloseTo(0.5, 10);
    expect(linhaAero(0.95).viagem).toBe(1);
  });
});
```

`perfil.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { geometriaPerfil, type DadosPerfil } from './perfil';

const dados: DadosPerfil = {
  resolucao: [1920, 1200],
  curva: {
    plano_principal_fixo: { bordo_de_ataque: [710.7, 658.6], bordo_de_fuga: [1194.8, 764.3] },
    tras_flap1: { bordo_de_ataque: [1161, 709.3], bordo_de_fuga: [1505.7, 664.4] },
    tras_flap2: { bordo_de_ataque: [1438.8, 631.2], bordo_de_fuga: [1681.1, 444.8] },
  },
  reta: {
    plano_principal_fixo: { bordo_de_ataque: [710.7, 658.6], bordo_de_fuga: [1194.8, 764.3] },
    tras_flap1: { bordo_de_ataque: [1160.6, 698.2], bordo_de_fuga: [1508.5, 746.2] },
    tras_flap2: { bordo_de_ataque: [1431.2, 612.9], bordo_de_fuga: [1737.3, 578.6] },
  },
  dobradica_flap2: [1467.9, 608.8],
};

describe('geometriaPerfil', () => {
  const g = geometriaPerfil(dados);
  it('a corda tracejada do flap superior na curva vai além do bordo de fuga', () => {
    const [a, b] = g.tracejada;
    expect(a).toEqual([1438.8, 631.2]);
    expect(b[0]).toBeGreaterThan(1681.1);
    expect(b[1]).toBeLessThan(444.8);
  });
  it('a corda amarela é a do flap superior na reta', () => {
    expect(g.amarela).toEqual([[1431.2, 612.9], [1737.3, 578.6]]);
  });
  it('o arco liga os dois ângulos em volta da dobradiça', () => {
    expect(g.arco.centro).toEqual([1467.9, 608.8]);
    expect(g.arco.de).toBeCloseTo(Math.atan2(578.6 - 612.9, 1737.3 - 1431.2), 10);
    expect(g.arco.ate).toBeCloseTo(Math.atan2(444.8 - 631.2, 1681.1 - 1438.8), 10);
  });
});
```

- [ ] **Passo 2:** `npx vitest run src/sections/aero`. Esperado: FAIL.
- [ ] **Passo 3: implementação**

`linha.ts`:

```ts
import { easeInOut } from '../showroom/rail';

export const PONTOS_AERO = [0, 0.48, 0.62, 1];
export type Modo = 'curva' | 'reta';

const clamp01 = (p: number) => Math.min(1, Math.max(0, p)) || 0; // NaN vira o início
/** 0 antes de `a`, 1 depois de `b`, rampa linear entre os dois. */
const rampa = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

export function etapaAero(p: number): number {
  return Math.min(3, Math.floor(clamp01(p) * 4));
}

/** Peso do morph "reta" comandado pela rolagem (a etapa 2 sobrepõe com o laço). */
export function pesoAutomatico(p: number): number {
  return easeInOut(rampa(clamp01(p), 0.3, 0.45));
}

export function modoDoPeso(w: number): Modo {
  return w >= 0.5 ? 'reta' : 'curva';
}

/** Opacidade do perfil (o canvas usa 1 − perfil) e quanto a câmera já viajou de A para C. */
export function linhaAero(p: number): { perfil: number; viagem: number } {
  const q = clamp01(p);
  return {
    perfil: Math.min(rampa(q, 0.5, 0.55), 1 - rampa(q, 0.72, 0.75)),
    viagem: easeInOut(rampa(q, 0.75, 0.9)),
  };
}
```

Atenção: `easeInOut(0.5)` é 0,5, e é isso que faz os testes de 0,375 e 0,825 passarem.

`perfil.ts`:

```ts
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
```

- [ ] **Passo 4:** `npx vitest run src/sections/aero`. Esperado: PASS.
- [ ] **Passo 5:** `git add src/sections/aero/linha.* src/sections/aero/perfil.* && git commit -m "feat(aero): linha do tempo e geometria do perfil"`

---

### Task 10: Palco Three.js (`palco.ts`)

**Arquivo:** criar `src/three/palco.ts`. Não tem teste unitário (é WebGL); a verificação é no navegador, no Task 12.

- [ ] **Passo 1: implementação**

```ts
import {
  AgXToneMapping, EquirectangularReflectionMapping, MathUtils, Mesh, Object3D,
  PerspectiveCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer,
} from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { fitFov, viewOffset } from './convert';
import type { Pose } from './cameras';
import { orbitar } from '../sections/showroom/orbit';
import type { Orbita } from '../sections/showroom/orbit';

/** Graus somados à rotação do HDRI do Blender (calibrado no Task 12 comparando com sr_00). */
export const AJUSTE_AMBIENTE_GRAUS = 0;
const FLAPS = ['aero_tras_flap1', 'aero_tras_flap2', 'aero_diant_flap1', 'aero_diant_flap2'];

export interface Projecao { x: number; y: number; noQuadro: boolean }

export interface Palco {
  carregar(onProgresso: (f: number) => void): Promise<void>;
  definirPose(pose: Pose, orbita?: Orbita): void;
  definirPeso(w: number): void;
  projetar(no: string): Projecao | null;
  ativar(sim: boolean): void;
}

export function criarPalco(canvas: HTMLCanvasElement, ambiente: { rotacaoGraus: number; intensidade: number }): Palco {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new Scene();
  scene.environmentIntensity = ambiente.intensidade;
  scene.environmentRotation.y = MathUtils.degToRad(ambiente.rotacaoGraus + AJUSTE_AMBIENTE_GRAUS);
  const camera = new PerspectiveCamera(30, 1, 0.05, 100);
  const flaps: Mesh[] = [];
  const nos = new Map<string, Object3D>();
  let pose: Pose | null = null;
  let orbitaAtual: Orbita = { giro: 0, inclina: 0 };
  let ativo = false;
  let pedido = 0;

  const tamanho = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
    }
    return { w, h };
  };

  const aplicarCamera = () => {
    if (!pose) return;
    const { w, h } = tamanho();
    const pos = orbitar(pose.pos, pose.alvo, orbitaAtual.giro, orbitaAtual.inclina);
    camera.position.set(...pos);
    camera.lookAt(...pose.alvo);
    camera.aspect = w / h;
    camera.fov = fitFov(pose.fov, pose.aspecto, w / h);
    const off = viewOffset(pose.shiftX, pose.shiftY, w, h);
    camera.setViewOffset(w, h, off.x, off.y, w, h);
    camera.updateProjectionMatrix();
  };

  const desenhar = () => {
    pedido = 0;
    if (!ativo) return;
    aplicarCamera();
    renderer.render(scene, camera);
  };
  const pedirQuadro = () => { if (!pedido) pedido = requestAnimationFrame(desenhar); };
  new ResizeObserver(pedirQuadro).observe(canvas);

  return {
    async carregar(onProgresso) {
      const draco = new DRACOLoader().setDecoderPath('/draco/');
      const gltf = new GLTFLoader().setDRACOLoader(draco);
      const pmrem = new PMREMGenerator(renderer);
      const [hdr, modelo] = await Promise.all([
        new HDRLoader().loadAsync('/env/studio_small_09_escuro_1k.hdr'),
        gltf.loadAsync('/models/rb22.glb', (e) => { if (e.total) onProgresso(e.loaded / e.total); }),
      ]);
      hdr.mapping = EquirectangularReflectionMapping;
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      draco.dispose();
      scene.add(modelo.scene);
      modelo.scene.traverse((o) => {
        nos.set(o.name, o);
        if (FLAPS.includes(o.name) && (o as Mesh).isMesh) flaps.push(o as Mesh);
      });
      onProgresso(1);
      await renderer.compileAsync(scene, camera);
      pedirQuadro();
    },
    definirPose(p, orbita) {
      pose = p;
      if (orbita) orbitaAtual = orbita;
      pedirQuadro();
    },
    definirPeso(w) {
      for (const m of flaps) {
        const i = m.morphTargetDictionary?.reta;
        if (i !== undefined && m.morphTargetInfluences) m.morphTargetInfluences[i] = w;
      }
      pedirQuadro();
    },
    projetar(nome) {
      const no = nos.get(nome);
      if (!no || !pose) return null;
      aplicarCamera();
      const v = no.getWorldPosition(new Vector3()).project(camera);
      const { w, h } = tamanho();
      return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, noQuadro: v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 };
    },
    ativar(sim) {
      ativo = sim;
      if (sim) pedirQuadro();
    },
  };
}
```

O nome do loader de HDR vem do Passo 2 do Task 1. Se lá apareceu `RGBELoader`, trocar o import e a classe; a chamada `loadAsync` é a mesma.

- [ ] **Passo 2:** `npm run build`. Esperado: o `tsc` passa sem erros. O `palco.ts` ainda não é importado por ninguém, e o Vite não o empacota.
- [ ] **Passo 3:** `git add src/three/palco.ts && git commit -m "feat(3d): palco Three.js com HDR, GLB, pose, morph e projeção"`

---

### Task 11: Marcação, estilos e movimento reduzido

**Arquivos:**
- Modificar: `index.html`, substituindo a linha `<!-- Fase 4: #showroom e #aero entram aqui · Fase 5: #dm01 entra aqui -->`
- Criar: `src/sections/palco3d/palco3d.css`, `src/sections/showroom/showroom.css`, `src/sections/aero/aero.css`

- [ ] **Passo 1: marcação.** Substituir o comentário por:

```html
      <div class="palco3d" data-palco3d>
        <div class="palco3d__fundo" aria-hidden="true">
          <img class="palco3d__render" src="/showroom/desktop/sr_00.webp" alt="" width="1920" height="1200" />
          <canvas class="palco3d__canvas"></canvas>
          <div class="palco3d__perfil">
            <img data-perfil="curva" src="/aero/desktop/B_curva.webp" alt="" width="1920" height="1200" loading="lazy" />
            <img data-perfil="reta" src="/aero/desktop/B_reta.webp" alt="" width="1920" height="1200" loading="lazy" />
            <div class="palco3d__perfil-svg"></div>
          </div>
        </div>

        <section id="showroom" class="secao showroom" aria-labelledby="showroom-titulo">
          <div class="showroom__stage">
            <h2 id="showroom-titulo" class="kicker"><span class="kicker__rule" aria-hidden="true"></span>Showroom 3D</h2>
            <p class="rotulo showroom__dica" aria-hidden="true">← Arraste para girar →</p>
            <div class="showroom__paradas">
              <article class="parada is-active" data-parada="0">
                <h3 class="parada__titulo parada__titulo--grande">O carro. Por inteiro.</h3>
                <p class="corpo">Menor, mais leve e com asas que se mexem. <span class="so-animado">Role para passar pelas peças; arraste para girar o carro.</span><span class="so-reduzido">Cinco peças que mudaram para 2026.</span></p>
                <dl class="dados">
                  <div><dt class="rotulo">entre-eixos · −200 mm</dt><dd>3.400 mm</dd></div>
                  <div><dt class="rotulo">largura · −100 mm</dt><dd>1.900 mm</dd></div>
                </dl>
                <img class="parada__render" src="/showroom/desktop/sr_00.webp" alt="" width="1920" height="1200" loading="lazy" />
              </article>
              <article class="parada" data-parada="1">
                <p class="parada__indice">01 / 05</p>
                <h3 class="parada__titulo">Asa dianteira</h3>
                <p class="corpo">100 mm mais estreita, com um flap de dois elementos que muda de ângulo sozinho: deita na reta, levanta na curva.</p>
                <dl class="dados"><div><dt class="rotulo">de largura</dt><dd>−100 mm</dd></div></dl>
                <img class="parada__render" src="/showroom/desktop/sr_01.webp" alt="" width="1920" height="1200" loading="lazy" />
              </article>
              <article class="parada" data-parada="2">
                <p class="parada__indice">02 / 05</p>
                <h3 class="parada__titulo">Cockpit e halo</h3>
                <p class="corpo">A célula de sobrevivência ficou mais forte: estrutura frontal em dois estágios, mais proteção lateral e o arco de capotamento testado a 20 G (antes, 16 G).</p>
                <dl class="dados"><div><dt class="rotulo">teste do arco de capotamento</dt><dd>20 G</dd></div></dl>
                <img class="parada__render" src="/showroom/desktop/sr_02.webp" alt="" width="1920" height="1200" loading="lazy" />
              </article>
              <article class="parada" data-parada="3">
                <p class="parada__indice">03 / 05</p>
                <h3 class="parada__titulo">Sidepods</h3>
                <p class="corpo">Arrefecimento redesenhado para caber um sistema de bateria maior dentro de um carro menor.</p>
                <dl class="dados"><div><dt class="rotulo">do MGU-K elétrico</dt><dd>350 kW</dd></div></dl>
                <img class="parada__render" src="/showroom/desktop/sr_03.webp" alt="" width="1920" height="1200" loading="lazy" />
              </article>
              <article class="parada" data-parada="4">
                <p class="parada__indice">04 / 05</p>
                <h3 class="parada__titulo">Assoalho</h3>
                <p class="corpo">Parcialmente plano e com difusor menos potente: menos efeito-solo e carros menos rígidos. No total, cerca de 30% menos pressão aerodinâmica.</p>
                <dl class="dados"><div><dt class="rotulo">pressão aerodinâmica (aprox.)</dt><dd>−30%</dd></div></dl>
                <img class="parada__render" src="/showroom/desktop/sr_04.webp" alt="" width="1920" height="1200" loading="lazy" />
              </article>
              <article class="parada" data-parada="5">
                <p class="parada__indice">05 / 05</p>
                <h3 class="parada__titulo">Asa traseira ativa</h3>
                <p class="corpo">Três elementos que se movem: abre na reta para cortar o arrasto, fecha na curva para dar aderência. Substitui o DRS.</p>
                <dl class="dados"><div><dt class="rotulo">arrasto (aprox.)</dt><dd>−55%</dd></div></dl>
                <a class="parada__link rotulo so-animado" href="#aero">Ver a aerodinâmica ativa <span aria-hidden="true">↓</span></a>
                <img class="parada__render" src="/showroom/desktop/sr_05.webp" alt="" width="1920" height="1200" loading="lazy" />
              </article>
            </div>
            <nav class="showroom__barras" aria-label="Peças do carro">
              <button type="button" data-ir="1"><span class="showroom__barra" aria-hidden="true"></span>01 Asa dianteira</button>
              <button type="button" data-ir="2"><span class="showroom__barra" aria-hidden="true"></span>02 Cockpit e halo</button>
              <button type="button" data-ir="3"><span class="showroom__barra" aria-hidden="true"></span>03 Sidepods</button>
              <button type="button" data-ir="4"><span class="showroom__barra" aria-hidden="true"></span>04 Assoalho</button>
              <button type="button" data-ir="5"><span class="showroom__barra" aria-hidden="true"></span>05 Asa traseira ativa</button>
            </nav>
            <div class="showroom__hotspots" aria-hidden="true">
              <span class="hotspot" data-peca="asa-dianteira"><span class="hotspot__rotulo">01 Asa dianteira</span><span class="hotspot__ponto"></span></span>
              <span class="hotspot" data-peca="halo"><span class="hotspot__rotulo">02 Cockpit e halo</span><span class="hotspot__ponto"></span></span>
              <span class="hotspot" data-peca="sidepod-esquerdo"><span class="hotspot__rotulo">03 Sidepods</span><span class="hotspot__ponto"></span></span>
              <span class="hotspot" data-peca="assoalho-difusor"><span class="hotspot__rotulo">04 Assoalho</span><span class="hotspot__ponto"></span></span>
              <span class="hotspot" data-peca="asa-traseira"><span class="hotspot__rotulo">05 Asa traseira ativa</span><span class="hotspot__ponto"></span></span>
            </div>
            <div class="showroom__carregando" role="status" hidden>
              <span class="rotulo">Carregando o carro em 3D</span>
              <span class="showroom__carga" aria-hidden="true"><span></span></span>
              <span class="showroom__pct">0%</span>
            </div>
          </div>
        </section>

        <section id="aero" class="secao aero" aria-labelledby="aero-titulo">
          <div class="aero__stage">
            <h2 id="aero-titulo" class="kicker"><span class="kicker__rule" aria-hidden="true"></span>Aerodinâmica ativa</h2>
            <div class="aero__progresso" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
            <div class="aero__etapas">
              <article class="etapa is-active" data-etapas="0 1">
                <h3 class="etapa__titulo">Duas asas.<br />Duas personalidades.</h3>
                <p class="corpo">Em 2026 o DRS sai de cena. As asas dianteira e traseira mudam de ângulo durante a volta: um modo para a curva, outro para a reta.</p>
                <div class="aero__cartoes">
                  <figure class="aero__figura so-reduzido"><img src="/aero/desktop/A_curva.webp" alt="" width="1920" height="1200" loading="lazy" /></figure>
                  <div class="cartao-modo" data-modo="curva" aria-live="polite">
                    <p class="cartao-modo__cabecalho rotulo"><span class="cartao-modo__ponto" aria-hidden="true"></span><span data-cabecalho>Modo curva · padrão</span></p>
                    <p class="cartao-modo__texto" data-texto>Flaps inclinados: mais pressão aerodinâmica para frear e contornar.</p>
                    <dl class="cartao-modo__medidores">
                      <div><dt class="rotulo">Pressão aerodinâmica</dt><dd class="rotulo" data-nivel>Alta</dd><span class="medidor" aria-hidden="true"><span></span></span></div>
                      <div><dt class="rotulo">Arrasto</dt><dd class="rotulo" data-nivel>Alta</dd><span class="medidor" aria-hidden="true"><span></span></span></div>
                    </dl>
                    <p class="rotulo cartao-modo__nota">Comparação qualitativa</p>
                  </div>
                  <figure class="aero__figura so-reduzido"><img src="/aero/desktop/A_reta.webp" alt="" width="1920" height="1200" loading="lazy" /></figure>
                  <div class="cartao-modo so-reduzido" data-modo="reta">
                    <p class="cartao-modo__cabecalho rotulo"><span class="cartao-modo__ponto" aria-hidden="true"></span>Modo reta</p>
                    <p class="cartao-modo__texto">Flaps deitados: menos arrasto nas zonas de ativação marcadas pela FIA.</p>
                    <dl class="cartao-modo__medidores">
                      <div><dt class="rotulo">Pressão aerodinâmica</dt><dd class="rotulo">Baixa</dd><span class="medidor" aria-hidden="true"><span></span></span></div>
                      <div><dt class="rotulo">Arrasto</dt><dd class="rotulo">Baixa</dd><span class="medidor" aria-hidden="true"><span></span></span></div>
                    </dl>
                    <p class="rotulo cartao-modo__nota">Comparação qualitativa</p>
                  </div>
                </div>
              </article>
              <article class="etapa" data-etapas="2">
                <h3 class="etapa__titulo">Mesma asa,<br />outro ângulo.</h3>
                <p class="corpo so-animado">No modo reta, a fenda entre os elementos se abre e o ar passa com menos resistência. Antes da curva, tudo volta à posição padrão.</p>
                <p class="rotulo so-animado">Ângulos ilustrativos</p>
                <div class="aero__perfis so-reduzido">
                  <figure><img src="/aero/desktop/B_curva.webp" alt="" width="1920" height="1200" loading="lazy" /><figcaption class="rotulo">Modo curva · corte da seção central da asa traseira</figcaption></figure>
                  <figure><img src="/aero/desktop/B_reta.webp" alt="" width="1920" height="1200" loading="lazy" /><figcaption class="rotulo">Modo reta · flap superior ≈ 30° mais deitado (ilustrativo)</figcaption></figure>
                </div>
              </article>
              <article class="etapa" data-etapas="3">
                <h3 class="etapa__titulo">As duas juntas.</h3>
                <p class="corpo">Dianteira e traseira se movem em sincronia, em toda volta e para qualquer piloto: não depende de estar a 1 segundo do carro da frente, como era com o DRS.</p>
                <p class="rotulo aero__nota so-animado">O modo ultrapassagem é outra ferramenta: energia elétrica extra para quem está a menos de 1 s do carro da frente.</p>
                <figure class="aero__figura so-reduzido"><img src="/aero/desktop/C_reta.webp" alt="" width="1920" height="1200" loading="lazy" /></figure>
              </article>
            </div>
            <p class="rotulo aero__legenda-perfil" aria-hidden="true">Corte da seção central da asa traseira · frente do carro à esquerda</p>
            <p class="rotulo aero__angulo" aria-hidden="true"><span class="aero__angulo-titulo">Flap superior ≈ 30°</span><span>– – curva &nbsp; —— reta · ilustrativo</span></p>
            <div class="aero__controle so-animado">
              <div class="seletor-modo" role="radiogroup" aria-label="Modo das asas">
                <button type="button" role="radio" aria-checked="true" data-modo="curva">Modo curva</button>
                <button type="button" role="radio" aria-checked="false" tabindex="-1" data-modo="reta">Modo reta</button>
              </div>
              <p class="rotulo">Toque para trocar · ou role para ver as asas mudarem</p>
            </div>
          </div>
        </section>
      </div>
```

- [ ] **Passo 2: estilos do palco** (`src/sections/palco3d/palco3d.css`):

```css
.palco3d { position: relative; isolation: isolate; background: radial-gradient(60% 50% at 70% 55%, rgba(11, 21, 56, 0.55), transparent 70%), var(--c-bg); }
.palco3d__fundo { position: sticky; top: 0; height: 100svh; margin-bottom: -100svh; z-index: 0; overflow: hidden; pointer-events: none; }
.palco3d__render, .palco3d__canvas, .palco3d__perfil, .palco3d__perfil img, .palco3d__perfil-svg, .palco3d__perfil-svg svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.palco3d__render, .palco3d__perfil img { object-fit: cover; }
.palco3d__canvas { opacity: 0; transition: opacity 0.4s var(--ease-out); }
.palco3d.is-3d .palco3d__canvas { opacity: var(--palco-canvas, 1); transition: none; }
.palco3d.is-3d .palco3d__render { opacity: 0; transition: opacity 0.4s var(--ease-out); }
.palco3d__perfil { opacity: var(--palco-perfil, 0); }
.palco3d__perfil img[data-perfil='reta'] { opacity: var(--palco-peso, 0); }
.palco3d > .secao { position: relative; z-index: 1; background: transparent; }

.so-reduzido { display: none !important; }
.reduced .so-reduzido { display: revert !important; }
.reduced .so-animado { display: none !important; }
.reduced .palco3d__fundo { display: none; }
```

- [ ] **Passo 3: estilos do Showroom** (`src/sections/showroom/showroom.css`). As medidas vêm dos quadros `52:69` (desktop) e `52:101` (celular):

```css
.showroom__stage { position: relative; height: 100svh; padding: 3.5rem var(--gutter); touch-action: pan-y; cursor: grab; }
.showroom__stage.is-arrastando { cursor: grabbing; }
.showroom__dica { position: absolute; top: 3.5rem; right: var(--gutter); margin: 0; padding: 0.5rem 0.875rem; border-radius: 999px; background: rgba(3, 5, 13, 0.6); }
.showroom__paradas { position: absolute; left: var(--gutter); top: 50%; transform: translateY(-50%); width: min(24rem, 32vw); }
.parada { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 100%; opacity: 0; pointer-events: none; }
.parada.is-active { opacity: 1; pointer-events: auto; z-index: 1; }
.parada__indice { margin: 0 0 1rem; color: var(--c-yellow); font: 600 0.8125rem/1.2 var(--f-body); letter-spacing: 0.22em; }
.parada__titulo { margin: 0 0 1rem; font: italic 800 clamp(2.5rem, 4.4vw, 4rem)/0.95 var(--f-display); text-transform: uppercase; }
.parada__titulo--grande { font-size: clamp(3rem, 6.7vw, 6rem); }
.dados { margin: 1.5rem 0 0; display: flex; gap: 2.5rem; }
.dados div { display: flex; flex-direction: column-reverse; gap: 0.25rem; }
.dados dd { margin: 0; font: italic 800 2.25rem/1 var(--f-display); font-variant-numeric: tabular-nums; }
.parada__link { display: inline-block; margin-top: 1.5rem; color: var(--c-yellow); text-decoration: none; }
.parada__link:focus-visible, .showroom__barras button:focus-visible { outline: 2px solid var(--c-yellow); outline-offset: 4px; }
.parada__render { display: none; }
.showroom__barras { position: absolute; left: var(--gutter); right: var(--gutter); bottom: 3.5rem; display: flex; gap: 1rem; }
.showroom__barras button { flex: 0 1 10rem; display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem 0; background: none; border: 0; color: var(--c-text-muted); font: 500 0.6875rem/1.2 var(--f-body); letter-spacing: 0.18em; text-transform: uppercase; text-align: left; cursor: pointer; }
.showroom__barra { height: 3px; background: rgba(255, 255, 255, 0.18); }
.showroom__barras [data-estado='vista'] .showroom__barra { background: rgba(255, 255, 255, 0.5); }
.showroom__barras [data-estado='ativa'] { color: var(--c-text); }
.showroom__barras [data-estado='ativa'] .showroom__barra { background: var(--c-red); }
.showroom__hotspots { position: absolute; inset: 0; pointer-events: none; }
.hotspot { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 0.75rem; transform: translate(var(--hx, 0), var(--hy, 0)); opacity: 0; transition: opacity 0.25s; }
.hotspot.is-visivel { opacity: 1; }
.hotspot__ponto { width: 1.25rem; height: 1.25rem; margin: -0.625rem; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.8); background: rgba(3, 5, 13, 0.5); }
.hotspot__rotulo { position: absolute; right: 1.5rem; white-space: nowrap; padding: 0.375rem 0.625rem; border-radius: 4px; background: rgba(3, 5, 13, 0.85); font: 600 0.6875rem/1.2 var(--f-body); letter-spacing: 0.18em; text-transform: uppercase; opacity: 0; }
.hotspot[data-lado='direita'] .hotspot__rotulo { right: auto; left: 1.5rem; }
.hotspot.is-ativo .hotspot__ponto { border-color: var(--c-yellow); background: radial-gradient(circle, var(--c-yellow) 0 40%, rgba(3, 5, 13, 0.5) 42%); box-shadow: 0 0 0 6px rgba(255, 201, 6, 0.25); }
.hotspot.is-ativo .hotspot__rotulo { opacity: 1; }
.showroom__carregando { position: absolute; left: 62%; top: 46%; display: grid; gap: 0.5rem; justify-items: start; }
.showroom__carga { width: 9rem; height: 2px; background: rgba(255, 255, 255, 0.2); }
.showroom__carga span { display: block; height: 100%; width: calc(var(--carga, 0) * 100%); background: var(--c-red); }
.showroom__pct { font: italic 800 1.5rem/1 var(--f-display); }

@media (max-aspect-ratio: 1/1) {
  .showroom__stage { padding: 4rem var(--gutter) 2.5rem; }
  .showroom__barras { top: 2.5rem; bottom: auto; gap: 0.375rem; }
  .showroom__barras button { flex: 1; font-size: 0; gap: 0; }
  .showroom__stage > .kicker { margin-top: 1.5rem; }
  .showroom__paradas { top: 9rem; transform: none; width: auto; right: var(--gutter); }
  .parada { top: 0; transform: none; }
  .parada__titulo--grande { font-size: clamp(2.5rem, 12vw, 3.5rem); }
  .showroom__dica { top: auto; bottom: 2.5rem; right: 50%; transform: translateX(50%); }
  .showroom__carregando { left: var(--gutter); top: 72%; }
}

.reduced .showroom__stage { height: auto; padding-bottom: 5rem; cursor: auto; }
.reduced .showroom__paradas { position: static; transform: none; width: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 3rem 1.5rem; margin-top: 2rem; }
.reduced .parada { position: static; transform: none; opacity: 1; pointer-events: auto; display: flex; flex-direction: column; }
.reduced .parada[data-parada='0'] { grid-column: 1 / -1; }
.reduced .parada__render { display: block; order: -1; width: 100%; height: auto; margin-bottom: 1.25rem; border-radius: 8px; }
.reduced .showroom__barras, .reduced .showroom__hotspots, .reduced .showroom__dica, .reduced .showroom__carregando { display: none; }
```

- [ ] **Passo 4: estilos da Aero** (`src/sections/aero/aero.css`). As medidas vêm dos quadros `67:82`, `67:160` e `67:122`:

```css
.aero__stage { position: relative; height: 100svh; padding: 3.5rem var(--gutter); }
.aero__progresso { position: absolute; top: 3.75rem; right: var(--gutter); display: flex; gap: 0.5rem; }
.aero__progresso span { width: 3rem; height: 2px; background: rgba(255, 255, 255, 0.18); }
.aero__progresso span.is-vista { background: rgba(255, 255, 255, 0.5); }
.aero__progresso span.is-ativa { background: var(--c-red); }
.aero__etapas { position: absolute; left: var(--gutter); top: 50%; transform: translateY(-50%); width: min(26rem, 34vw); }
.etapa { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 100%; opacity: 0; pointer-events: none; }
.etapa.is-active { opacity: 1; pointer-events: auto; z-index: 1; }
.etapa__titulo { margin: 0 0 1rem; font: italic 800 clamp(2.5rem, 4.4vw, 4rem)/0.95 var(--f-display); text-transform: uppercase; }
.aero__cartoes { margin-top: 1.5rem; }
.cartao-modo { padding: 1.25rem 1rem; border-radius: 8px; background: var(--c-navy); transition: opacity 0.3s; }
.cartao-modo__cabecalho { display: flex; align-items: center; gap: 0.625rem; margin: 0 0 0.75rem; color: var(--c-text); }
.cartao-modo__ponto { width: 6px; height: 6px; border-radius: 50%; background: var(--c-red); }
.cartao-modo[data-modo='reta'] .cartao-modo__ponto { background: var(--c-yellow); }
.cartao-modo__texto { margin: 0 0 1rem; color: var(--c-text-muted); font-size: 0.875rem; line-height: 1.6; }
.cartao-modo__medidores { margin: 0; display: grid; gap: 0.75rem; }
.cartao-modo__medidores div { display: grid; grid-template-columns: 1fr auto; row-gap: 0.375rem; }
.cartao-modo__medidores dd { margin: 0; }
.medidor { grid-column: 1 / -1; height: 3px; background: rgba(255, 255, 255, 0.18); }
.medidor span { display: block; height: 100%; width: 50%; background: var(--c-red); transition: width 0.6s var(--ease-out), background 0.3s; }
.cartao-modo[data-modo='reta'] .medidor span { width: 25%; background: var(--c-yellow); }
.cartao-modo__nota { margin: 0.75rem 0 0; }
.aero__nota { margin-top: 1.25rem; max-width: 24rem; }
.aero__legenda-perfil { position: absolute; left: 31%; top: 65%; margin: 0; opacity: var(--palco-perfil, 0); }
.aero__angulo { position: absolute; left: 66%; top: 38%; margin: 0; display: grid; gap: 0.25rem; padding: 0.5rem 0.625rem; background: rgba(3, 5, 13, 0.85); opacity: var(--palco-perfil, 0); }
.aero__angulo-titulo { color: var(--c-yellow); }
.palco3d__perfil-svg { opacity: var(--palco-perfil, 0); }
.aero__controle { position: absolute; left: var(--gutter); bottom: 3.5rem; display: flex; align-items: center; gap: 1.25rem; }
.seletor-modo { display: flex; gap: 0.25rem; padding: 0.25rem; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.24); }
.seletor-modo button { padding: 0.75rem 1.25rem; border: 0; border-radius: 999px; background: transparent; color: var(--c-text); font: 600 0.8125rem/1 var(--f-body); letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; }
.seletor-modo button[aria-checked='true'] { background: var(--c-yellow); color: #000; }
.seletor-modo button:focus-visible { outline: 2px solid var(--c-yellow); outline-offset: 3px; }

@media (max-aspect-ratio: 1/1) {
  .aero__stage { padding: 4rem var(--gutter) 2rem; }
  .aero__progresso { top: 2.5rem; left: var(--gutter); }
  .aero__progresso span { flex: 1; width: auto; }
  .aero__etapas { top: 6.5rem; transform: none; width: auto; right: var(--gutter); }
  .etapa { top: 0; transform: none; }
  .etapa__titulo { font-size: clamp(2.25rem, 10vw, 3rem); }
  .aero__controle { flex-direction: column; align-items: flex-start; gap: 0.5rem; bottom: 2rem; }
  .aero__legenda-perfil { left: var(--gutter); top: auto; bottom: 9rem; }
  .aero__angulo { left: auto; right: var(--gutter); top: 55%; }
}

.reduced .aero__stage { height: auto; padding-bottom: 5rem; }
.reduced .aero__etapas { position: static; transform: none; width: auto; margin-top: 2rem; display: grid; gap: 4rem; }
.reduced .etapa { position: static; transform: none; opacity: 1; pointer-events: auto; }
.reduced .aero__cartoes, .reduced .aero__perfis { display: grid !important; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; }
.reduced .aero__figura, .reduced .aero__perfis figure { margin: 0; }
.reduced .aero__figura img, .reduced .aero__perfis img { width: 100%; height: auto; border-radius: 8px; display: block; }
.reduced .aero__cartoes .cartao-modo { grid-row: 2; }
.reduced .aero__progresso, .reduced .aero__legenda-perfil, .reduced .aero__angulo { display: none; }
@media (max-aspect-ratio: 1/1) { .reduced .aero__cartoes, .reduced .aero__perfis { grid-template-columns: 1fr; } .reduced .aero__cartoes .cartao-modo { grid-row: auto; } }
```

- [ ] **Passo 5: ligar os CSS.** Criar o arquivo inicial `src/sections/palco3d/palco3d.ts`, que importa os três CSS e exporta uma inicialização vazia (o Task 12 a completa):

```ts
import './palco3d.css';
import '../showroom/showroom.css';
import '../aero/aero.css';

export async function initPalco3D(): Promise<void> {}
```

Em `src/main.ts`, importar `initPalco3D` e chamá-lo logo depois de `initManifesto();`:

```ts
import { initPalco3D } from './sections/palco3d/palco3d';
// ...
  initManifesto();
  await initPalco3D();
  initNumeros();
```

- [ ] **Passo 6: verificar o movimento reduzido no navegador embutido**
  - Abrir `http://localhost:5173` com `prefers-reduced-motion: reduce`. A emulação vale pela aba e é feita por `resize_window` + recarga; como alternativa, ligar a classe `reduced` com `document.documentElement.classList.add('reduced')` antes do script.
  - Comparar com os quadros `57:100` e `76:102` do Figma: título, grade de 5 artigos com render, cartões lado a lado e os dois perfis. Nenhum texto `so-animado` pode aparecer.
  - Repetir em 375×812.
- [ ] **Passo 7:** `npm test && npm run build`. Esperado: PASS.
- [ ] **Passo 8:** `git add index.html src/main.ts src/sections/palco3d src/sections/showroom/showroom.css src/sections/aero/aero.css && git commit -m "feat(showroom, aero): marcação, estilos e movimento reduzido"`

---

### Task 12: Orquestração e comportamento do Showroom

**Arquivos:**
- Modificar: `src/sections/palco3d/palco3d.ts`
- Criar: `src/sections/showroom/showroom.ts`

- [ ] **Passo 1: `palco3d.ts` completo**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../core/motion';
import { lerAmbiente, podeUsar3D } from '../../three/support';
import { toPose, type Pose, type PoseBruta } from '../../three/cameras';
import type { Palco } from '../../three/palco';
import cameras from '../../data/showroom-cameras.json';
import { initShowroom } from '../showroom/showroom';
import { initAero } from '../aero/aero';
import './palco3d.css';
import '../showroom/showroom.css';
import '../aero/aero.css';

gsap.registerPlugin(ScrollTrigger);

export type Aparelho = 'desktop' | 'mobile';

/** O que as seções compartilham: o palco 3D (quando houver) e o render de fundo. */
export interface Contexto {
  aparelho: Aparelho;
  raiz: HTMLElement;
  usa3D: boolean;
  palco: () => Palco | null;
  aoCarregar: (fn: (palco: Palco) => void) => void;
  mostrarRender: (url: string) => void;
  posesShowroom: Pose[];
}

export async function initPalco3D(): Promise<void> {
  const raiz = document.querySelector<HTMLElement>('[data-palco3d]');
  if (!raiz || prefersReducedMotion()) return;
  const aparelho: Aparelho = window.matchMedia('(max-aspect-ratio: 1/1)').matches ? 'mobile' : 'desktop';
  trocarImagensDoAparelho(raiz, aparelho);
  const usa3D = podeUsar3D(lerAmbiente());
  const render = raiz.querySelector<HTMLImageElement>('.palco3d__render')!;
  const canvas = raiz.querySelector<HTMLCanvasElement>('.palco3d__canvas')!;
  const carregando = raiz.querySelector<HTMLElement>('.showroom__carregando')!;
  let palco: Palco | null = null;
  const ouvintes: ((p: Palco) => void)[] = [];

  const ctx: Contexto = {
    aparelho,
    raiz,
    usa3D,
    palco: () => palco,
    aoCarregar: (fn) => (palco ? fn(palco) : ouvintes.push(fn)),
    mostrarRender: (url) => { if (!render.src.endsWith(url)) render.src = url; },
    posesShowroom: (cameras.cameras[aparelho] as PoseBruta[]).map(toPose),
  };

  if (usa3D) {
    const carregar = async () => {
      carregando.hidden = false;
      try {
        const { criarPalco } = await import('../../three/palco');
        const p = criarPalco(canvas, { rotacaoGraus: cameras.hdri_rotacao_z_graus, intensidade: cameras.hdri_intensidade });
        await p.carregar((f) => {
          carregando.style.setProperty('--carga', String(f));
          carregando.querySelector('.showroom__pct')!.textContent = `${Math.round(f * 100)}%`;
        });
        palco = p;
        raiz.classList.add('is-3d');
        ouvintes.splice(0).forEach((fn) => fn(p));
        new IntersectionObserver(([e]) => p.ativar(e.isIntersecting)).observe(raiz);
      } catch (erro) {
        console.error('Falha ao carregar o 3D; seguindo com os renders:', erro);
      } finally {
        carregando.hidden = true;
      }
    };
    const vigia = new IntersectionObserver(([e]) => { if (e.isIntersecting) { vigia.disconnect(); void carregar(); } }, { rootMargin: '100% 0px' });
    vigia.observe(raiz);
  }

  initShowroom(ctx);
  initAero(ctx);
}

/** Troca os renders de desktop pelos de celular quando for o caso. */
function trocarImagensDoAparelho(raiz: HTMLElement, aparelho: Aparelho): void {
  if (aparelho === 'desktop') return;
  raiz.querySelectorAll<HTMLImageElement>('img[src*="/desktop/"]').forEach((img) => {
    img.src = img.src.replace('/desktop/', '/mobile/');
    img.width = 1080;
    img.height = 2340;
  });
}
```

Observação: o Vite importa JSON nativamente. Se o `tsc` reclamar do import do JSON, acrescentar `"resolveJsonModule": true` em `tsconfig.json`.

- [ ] **Passo 2: `showroom.ts`**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startSmoothScroll } from '../../core/scroll';
import hotspotsData from '../../data/hotspots.json';
import type { Contexto } from '../palco3d/palco3d';
import { arrasto, type Orbita } from './orbit';
import { estadoHotspot, ladoDoRotulo, PECAS } from './hotspots';
import { encaixeMaisProximo, estadoBarras, paradaAtiva, poseNoTrilho, PONTOS_SHOWROOM } from './rail';

gsap.registerPlugin(ScrollTrigger);

export function initShowroom(ctx: Contexto): void {
  const section = document.querySelector<HTMLElement>('#showroom');
  const stage = section?.querySelector<HTMLElement>('.showroom__stage');
  if (!section || !stage) return;
  const paradas = Array.from(stage.querySelectorAll<HTMLElement>('.parada'));
  const barras = Array.from(stage.querySelectorAll<HTMLButtonElement>('.showroom__barras button'));
  const hotspots = PECAS.map((peca) => stage.querySelector<HTMLElement>(`.hotspot[data-peca="${peca}"]`)!);
  const textos = stage.querySelector<HTMLElement>('.showroom__paradas')!;
  const visibilidade = hotspotsData[ctx.aparelho] as Record<string, boolean>[];
  const lenis = startSmoothScroll();
  const orbita: Orbita = { giro: 0, inclina: 0 };
  let progresso = 0;
  let atual = -1;

  const trocarTexto = (nova: number) => {
    if (nova === atual) return;
    const antiga = paradas[atual];
    atual = nova;
    paradas.forEach((p, i) => p.classList.toggle('is-active', i === nova));
    if (antiga) gsap.fromTo(antiga, { opacity: 1, y: 0 }, { opacity: 0, y: -16, duration: 0.25, clearProps: 'transform,opacity' });
    gsap.fromTo(paradas[nova], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' });
    estadoBarras(nova).forEach((e, i) => {
      barras[i].dataset.estado = e;
      if (e === 'ativa') barras[i].setAttribute('aria-current', 'step'); else barras[i].removeAttribute('aria-current');
    });
    ctx.mostrarRender(`/showroom/${ctx.aparelho}/sr_0${nova}.webp`);
  };

  const desenharHotspots = () => {
    const palco = ctx.palco();
    const zona = ctx.aparelho === 'mobile' ? 0 : textos.getBoundingClientRect().right;
    PECAS.forEach((peca, i) => {
      const el = hotspots[i];
      const proj = palco?.projetar(`hotspot_${peca}`);
      if (!proj) { el.classList.remove('is-visivel'); return; }
      const est = estadoHotspot({ indice: i, parada: atual, visivelNaPose: visibilidade[atual][peca], noQuadro: proj.noQuadro, x: proj.x, zonaTexto: zona });
      el.classList.toggle('is-visivel', est.visivel);
      el.classList.toggle('is-ativo', est.ativo);
      el.style.setProperty('--hx', `${proj.x}px`);
      el.style.setProperty('--hy', `${proj.y}px`);
      el.dataset.lado = ladoDoRotulo(proj.x, el.querySelector<HTMLElement>('.hotspot__rotulo')!.offsetWidth, zona);
    });
  };

  const render = () => {
    trocarTexto(paradaAtiva(progresso));
    const palco = ctx.palco();
    if (!palco) return;
    palco.definirPeso(0);
    palco.definirPose(poseNoTrilho(ctx.posesShowroom, progresso), orbita);
    desenharHotspots();
  };

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: ctx.aparelho === 'mobile' ? '+=380%' : '+=450%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => {
      progresso = self.progress;
      if (orbita.giro || orbita.inclina) gsap.to(orbita, { giro: 0, inclina: 0, duration: 0.6, ease: 'power2.inOut', overwrite: true, onUpdate: render });
      render();
    },
    onRefresh: (self) => { progresso = self.progress; render(); },
  });

  ScrollTrigger.addEventListener('scrollEnd', () => {
    if (!st.isActive) return;
    const alvo = st.start + encaixeMaisProximo(st.progress, PONTOS_SHOWROOM) * (st.end - st.start);
    if (Math.abs(alvo - window.scrollY) > 2) lenis.scrollTo(alvo, { duration: 0.5 });
  });

  barras.forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.ir);
    lenis.scrollTo(st.start + (i / 5) * (st.end - st.start), { duration: 0.8 });
  }));

  if (ctx.usa3D) {
    let inicio: { x: number; y: number; base: Orbita } | null = null;
    stage.addEventListener('pointerdown', (e) => {
      if (!ctx.palco() || (e.target as Element).closest('button, a')) return;
      inicio = { x: e.clientX, y: e.clientY, base: { ...orbita } };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-arrastando');
    });
    stage.addEventListener('pointermove', (e) => {
      if (!inicio) return;
      Object.assign(orbita, arrasto(inicio.base, e.clientX - inicio.x, -(e.clientY - inicio.y)));
      render();
    });
    const soltar = () => { inicio = null; stage.classList.remove('is-arrastando'); };
    stage.addEventListener('pointerup', soltar);
    stage.addEventListener('pointercancel', soltar);
  }

  ctx.aoCarregar(() => render());
  trocarTexto(0);
}
```

O arraste usa `-(dy)`: arrastar para cima aumenta a inclinação, isto é, a câmera sobe.

- [ ] **Passo 3: criar o `src/sections/aero/aero.ts` provisório** para o build passar (o Task 13 o completa):

```ts
import type { Contexto } from '../palco3d/palco3d';

export function initAero(_ctx: Contexto): void {}
```

- [ ] **Passo 4: verificar no navegador embutido (1440×900).** Recarregar e rolar até o Showroom.

  Checar por JS:
  - `document.querySelector('.palco3d').classList.contains('is-3d')` vale `true`;
  - em cada uma das 6 paradas (rolar até `start + i/5*(end-start)` e esperar o encaixe), a `.parada.is-active` corresponde ao índice e as barras ficam no estado correto;
  - não há erros no console.

  Calibrar com screenshot:
  1. Na parada 0, comparar o canvas com `public/showroom/desktop/sr_00.webp` aberto em outra aba.
     - Se o carro estiver deslocado ou espelhado no quadro, o sinal do `viewOffset` está trocado: inverter `x` e/ou `y` em `src/three/convert.ts` e no teste correspondente.
     - Se os reflexos da pintura estiverem em outro ângulo, testar `AJUSTE_AMBIENTE_GRAUS` em 90, 180 e 270, escolhendo o que mais se parece com o render.
     - Se o brilho geral estiver diferente, ajustar `toneMappingExposure` entre 0,8 e 1,3.
     - Registrar os valores finais no código.
  2. Na parada 1, o hotspot da asa dianteira deve aparecer amarelo, com rótulo e sem cobrir os logos "Red"/"Bull". Comparar com o quadro `52:69` do Figma.
  3. Arrastar: o carro gira no máximo ±25°. Ao rolar, a câmera volta ao trilho em 0,6 s.
  4. Clicar em "04 Assoalho" na barra leva à parada 4.

- [ ] **Passo 5: repetir em 375×812.** Comparar com `52:38` e `52:101` e conferir que nenhum texto fica sobre o carro.
- [ ] **Passo 6:** `npm test && npm run build`. Esperado: PASS.
- [ ] **Passo 7:** `git add -A src && git commit -m "feat(showroom): carro 3D no trilho, paradas, hotspots, arraste e encaixe"`

---

### Task 13: Comportamento da Aero

**Arquivo:** substituir `src/sections/aero/aero.ts` pelo conteúdo completo.

- [ ] **Passo 1: implementação**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startSmoothScroll } from '../../core/scroll';
import { lerpPose, toPose, type Pose, type PoseBruta } from '../../three/cameras';
import { blenderToThree } from '../../three/convert';
import aeroCameras from '../../data/aero-cameras.json';
import perfilData from '../../data/perfil.json';
import type { Contexto } from '../palco3d/palco3d';
import { catmullRom, encaixeMaisProximo } from '../showroom/rail';
import { etapaAero, linhaAero, modoDoPeso, pesoAutomatico, PONTOS_AERO, type Modo } from './linha';
import { geometriaPerfil, svgPerfil, type DadosPerfil } from './perfil';

gsap.registerPlugin(ScrollTrigger);

const MODOS: Record<Modo, { cabecalho: string; texto: string; nivel: string }> = {
  curva: { cabecalho: 'Modo curva · padrão', texto: 'Flaps inclinados: mais pressão aerodinâmica para frear e contornar.', nivel: 'Alta' },
  reta: { cabecalho: 'Modo reta', texto: 'Flaps deitados: menos arrasto nas zonas de ativação marcadas pela FIA.', nivel: 'Baixa' },
};
/** Ponto de passagem pela lateral esquerda do carro na viagem de A para C (eixos do Blender). */
const LATERAL_BLENDER: [number, number, number] = [1.4, -6.5, 1.8];

export function initAero(ctx: Contexto): void {
  const section = document.querySelector<HTMLElement>('#aero');
  const stage = section?.querySelector<HTMLElement>('.aero__stage');
  if (!section || !stage) return;
  const etapas = Array.from(stage.querySelectorAll<HTMLElement>('.etapa'));
  const progresso = Array.from(stage.querySelectorAll<HTMLElement>('.aero__progresso span'));
  const cartao = stage.querySelector<HTMLElement>('.cartao-modo[aria-live]')!;
  const radios = Array.from(stage.querySelectorAll<HTMLButtonElement>('.seletor-modo [role="radio"]'));
  const raiz = ctx.raiz;
  const cams = aeroCameras[ctx.aparelho] as Record<'A' | 'C', PoseBruta>;
  const A = toPose(cams.A);
  const C = toPose(cams.C);
  const lateral = blenderToThree(LATERAL_BLENDER);
  const dados = perfilData[ctx.aparelho] as DadosPerfil;
  raiz.querySelector<HTMLElement>('.palco3d__perfil-svg')!.innerHTML = svgPerfil(geometriaPerfil(dados), dados.resolucao);
  const lenis = startSmoothScroll();

  let p = 0;
  let etapa = -1;
  let manual: number | null = null; // peso escolhido no seletor; vale até a etapa mudar
  const laco = { w: 0 };
  let tweenLaco: gsap.core.Tween | null = null;
  let modoMostrado: Modo | null = null;

  const poseDaViagem = (t: number): Pose => ({
    ...lerpPose(A, C, t),
    pos: catmullRom([A.pos, lateral, C.pos], t),
    alvo: catmullRom([A.alvo, lerpPose(A, C, 0.5).alvo, C.alvo], t),
  });

  const mostrarModo = (modo: Modo) => {
    radios.forEach((r) => {
      const sim = r.dataset.modo === modo;
      r.setAttribute('aria-checked', String(sim));
      r.tabIndex = sim ? 0 : -1;
    });
    if (modo === modoMostrado) return;
    modoMostrado = modo;
    const m = MODOS[modo];
    gsap.to(cartao, {
      opacity: 0, duration: 0.15, onComplete: () => {
        cartao.dataset.modo = modo;
        cartao.querySelector('[data-cabecalho]')!.textContent = m.cabecalho;
        cartao.querySelector('[data-texto]')!.textContent = m.texto;
        cartao.querySelectorAll('[data-nivel]').forEach((n) => { n.textContent = m.nivel; });
        gsap.to(cartao, { opacity: 1, duration: 0.15 });
      },
    });
  };

  const pesoAtual = () => (manual ?? (etapaAero(p) === 2 ? laco.w : pesoAutomatico(p)));

  const render = () => {
    const nova = etapaAero(p);
    if (nova !== etapa) {
      etapa = nova;
      manual = null;
      etapas.forEach((el) => el.classList.toggle('is-active', el.dataset.etapas!.split(' ').includes(String(nova))));
      progresso.forEach((s, i) => { s.classList.toggle('is-vista', i < nova); s.classList.toggle('is-ativa', i === nova); });
      tweenLaco?.kill();
      tweenLaco = null;
      if (nova === 2) tweenLaco = gsap.fromTo(laco, { w: 0 }, { w: 1, duration: 1.2, ease: 'power2.inOut', yoyo: true, repeat: -1, onUpdate: render });
      const fundo = nova === 3 ? 'C_reta' : `A_${modoDoPeso(pesoAtual())}`;
      ctx.mostrarRender(`/aero/${ctx.aparelho}/${fundo}.webp`);
    }
    const w = pesoAtual();
    const { perfil, viagem } = linhaAero(p);
    raiz.style.setProperty('--palco-perfil', String(perfil));
    raiz.style.setProperty('--palco-canvas', String(1 - perfil));
    raiz.style.setProperty('--palco-peso', String(w));
    stage.style.setProperty('--palco-perfil', String(perfil));
    mostrarModo(modoDoPeso(w));
    if (etapa < 2) ctx.mostrarRender(`/aero/${ctx.aparelho}/A_${modoDoPeso(w)}.webp`);
    const palco = ctx.palco();
    if (!palco) return;
    palco.definirPeso(w);
    palco.definirPose(viagem > 0 ? poseDaViagem(viagem) : A);
  };

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: ctx.aparelho === 'mobile' ? '+=240%' : '+=300%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => { p = self.progress; render(); },
    onRefresh: (self) => { p = self.progress; render(); },
    onToggle: (self) => { if (!self.isActive) { tweenLaco?.pause(); } else { tweenLaco?.resume(); } },
  });

  // Transição Showroom (parada 05) -> Aero (pose A) enquanto a Aero sobe na tela.
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'top top',
    onUpdate: (self) => {
      const palco = ctx.palco();
      if (!palco) return;
      const ultima = ctx.posesShowroom[ctx.posesShowroom.length - 1];
      palco.definirPeso(0);
      palco.definirPose(lerpPose(ultima, A, self.progress));
    },
  });

  ScrollTrigger.addEventListener('scrollEnd', () => {
    if (!st.isActive) return;
    const alvo = st.start + encaixeMaisProximo(st.progress, PONTOS_AERO) * (st.end - st.start);
    if (Math.abs(alvo - window.scrollY) > 2) lenis.scrollTo(alvo, { duration: 0.5 });
  });

  const escolher = (modo: Modo) => {
    tweenLaco?.pause();
    const alvo = modo === 'reta' ? 1 : 0;
    const estado = { w: pesoAtual() };
    gsap.to(estado, { w: alvo, duration: 0.6, ease: 'power2.inOut', onUpdate: () => { manual = estado.w; render(); } });
  };
  radios.forEach((r, i) => {
    r.addEventListener('click', () => escolher(r.dataset.modo as Modo));
    r.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const outro = radios[(i + 1) % radios.length];
      outro.focus();
      escolher(outro.dataset.modo as Modo);
    });
  });

  ctx.aoCarregar(() => render());
  render();
}
```

- [ ] **Passo 2: verificar no navegador embutido (1440×900)**
  - **Por JS e screenshot, em cada etapa** (encaixes em 0, 0,48, 0,62 e 1):
    - etapa 1: cartão "Modo curva · padrão" e flaps curvos; comparar com `67:4`;
    - etapa 2 (0,48): cartão "Modo reta", medidores amarelos curtos e flaps deitados; comparar com `67:82`. O `aria-checked` do botão "Modo reta" vale `true`;
    - etapa 3 (0,62): os renders B alternam curva ↔ reta em 1,2 s; tracejado, linha amarela e arco ficam sobre o flap superior; a legenda aparece; o canvas fica invisível. Comparar com `67:160`;
    - etapa 4 (1): a câmera chega à asa dianteira sem atravessar o carro; comparar com `67:205`.
  - **Seletor:** na etapa 2, clicar em "Modo curva" anima os flaps em 0,6 s sem mudar `window.scrollY`. As setas do teclado trocam o modo.
  - **Transição:** entre a parada 05 do Showroom e a etapa 1, a câmera desliza sem salto.
  - **Console:** sem erros.
- [ ] **Passo 3: repetir em 375×812**, comparando com `67:44`…`67:228`.
- [ ] **Passo 4:** `npm test && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** `git add src/sections/aero/aero.ts && git commit -m "feat(aero): flaps por rolagem e seletor, perfil com ângulo e viagem até a asa dianteira"`

---

### Task 14: Plano B, desempenho e tamanho do pacote

- [ ] **Passo 1: plano B.** Abrir `http://localhost:5173/?plano-b`.
  - `.palco3d` não ganha `is-3d`.
  - O `.palco3d__render` troca de `sr_00` a `sr_05` nas paradas e de `A_curva`/`A_reta`/`C_reta` na Aero.
  - Nenhuma requisição a `rb22.glb` aparece em `read_network_requests`.
  - Hotspots e arraste ficam desligados.
- [ ] **Passo 2: carregamento preguiçoso.** Recarregar no topo da página. `read_network_requests` não pode mostrar `rb22.glb` nem o chunk do three antes de rolar até perto do Showroom.
- [ ] **Passo 3: pacote.** Em `npm run build`, o chunk principal não pode conter three: o three aparece em um chunk separado, importado dinamicamente.

```bash
npm run build && ls -la dist/assets/*.js
```

- [ ] **Passo 4: fluidez.** Com o painel do navegador em 1440×900, medir por JS o tempo entre quadros durante a rolagem do Showroom:

```js
let n = 0, t0 = performance.now(), piores = [];
const f = (t) => { piores.push(t - t0); t0 = t; if (++n < 180) requestAnimationFrame(f); };
requestAnimationFrame(f);
window.scrollBy({ top: 3000, behavior: 'smooth' });
await new Promise((r) => setTimeout(r, 3500));
piores.sort((a, b) => b - a).slice(0, 5);
```

Esperado: o pior quadro abaixo de 50 ms. Se passar, reduzir `setPixelRatio` para `Math.min(dpr, 1.5)` e medir de novo.
- [ ] **Passo 5:** se algo mudou, `npm test && npm run build` e `git commit -am "perf(3d): ajustes de desempenho do palco"`.

---

### Task 15: Revisões obrigatórias da fase

- [ ] **Passo 1: acessibilidade.** Despachar o `accessibility-specialist` para o Showroom e a Aero, em modo animado, plano B e movimento reduzido. Escopo:
  - hierarquia h2/h3;
  - artigos invisíveis × leitor de tela;
  - `nav` das barras com `aria-current`;
  - `radiogroup` com teclado;
  - `aria-live` do cartão sem repetir a cada quadro;
  - `role="status"` do carregamento;
  - foco visível;
  - contraste dos rótulos sobre o render;
  - `touch-action` e arraste sem armadilha;
  - zoom de 200% e 400%.

  Corrigir os achados altos.
- [ ] **Passo 2: testes.** Despachar o `test-engineer` para revisar `convert`, `cameras`, `rail`, `orbit`, `hotspots`, `support`, `linha` e `perfil`, acrescentando bordas pertinentes.
- [ ] **Passo 3:** `npm test && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** `git add -A && git commit -m "fix: ajustes de revisão da fase 4"`
