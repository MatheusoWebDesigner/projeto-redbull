# Rodada 2 · Efeitos — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** implementar a spec `docs/superpowers/specs/2026-10-21-rodada2-efeitos-design.md` (Figma, página "11 · Rodada 2 · Efeitos").

**Arquitetura:**
- A abertura reaproveita o `FrameStore` da Hero (com pasta e prefixo de arquivo como parâmetros) e o mesmo `<canvas>`.
- Fundo vivo, velocidade e faixas são camadas fixas novas, só com `transform` e `opacity`, alimentadas por um medidor de velocidade do Lenis.
- O cursor do Showroom usa `gsap.quickTo`.

**Stack:** Vite 8, TypeScript, GSAP 3.15 (ScrollTrigger), Lenis 1.3, Vitest 5, Playwright.

**Regras:**
- Movimento reduzido desliga tudo o que é novo.
- Nenhuma dependência nova.
- A CSP não muda: estilos só por classe ou CSSOM (`style.setProperty`).

---

### Task 1: `FrameStore` com pasta e passo configuráveis

**Arquivos:**
- `src/hero/frames.ts`
- teste: `src/hero/frames.test.ts`

- [ ] **Teste (falha):**

```ts
it('a abertura mora em /hero/abertura com prefixo a_', () => {
  expect(frameUrl('mobile', 0, 'avif', 'abertura')).toBe('/hero/abertura/mobile/a_001.avif');
  expect(frameUrl('desktop', 38, 'webp', 'abertura')).toBe('/hero/abertura/desktop/a_039.webp');
});
it('a Hero continua em /hero/frames com prefixo f_', () => {
  expect(frameUrl('desktop', 0, 'avif')).toBe('/hero/frames/desktop/f_001.avif');
});
it('com passo 1, todos os quadros são prioritários', () => {
  expect(splitLoadOrder(39, 1).priority).toHaveLength(39);
  expect(new FrameStore('desktop', 39, 'abertura', 1).prioritarios).toBe(39);
  expect(new FrameStore('desktop').prioritarios).toBe(splitLoadOrder(240, PASSO_PRIORITARIO).priority.length);
});
```

- [ ] **Implementação:**

```ts
export type Pasta = 'frames' | 'abertura';
const PREFIXO: Record<Pasta, string> = { frames: 'f', abertura: 'a' };
export function frameUrl(set: FrameSet, index: number, formato: Formato = 'webp', pasta: Pasta = 'frames'): string {
  const n = String(index + 1).padStart(3, '0');
  return asset(`/hero/${pasta}/${set}/${PREFIXO[pasta]}_${n}.${formato}`);
}
// FrameStore:
//   constructor(set, count = FRAME_COUNT, pasta: Pasta = 'frames', passo = PASSO_PRIORITARIO)
//   get prioritarios(): number { return splitLoadOrder(this.count, this.passo).priority.length; }
//   loadAll e loadOne usam this.passo e this.pasta.
export function getAberturaStore(set: FrameSet): FrameStore  // singleton por set: new FrameStore(set, QUADROS_ABERTURA, 'abertura', 1)
```

- [ ] Rodar `npx vitest run src/hero/frames.test.ts`: tudo verde.

### Task 2: progresso combinado e quadro da abertura

**Arquivos:**
- `src/hero/lights.ts` (+ teste)
- novo: `src/hero/abertura.ts` (+ teste)

- [ ] **Testes (falham):**

```ts
// lights.test.ts
it('combina carregamentos pelo peso de cada um', () => {
  expect(combinarProgresso([{ fracao: 1, peso: 31 }, { fracao: 0, peso: 39 }])).toBeCloseTo(31 / 70);
  expect(combinarProgresso([{ fracao: 0.5, peso: 10 }, { fracao: 0.5, peso: 30 }])).toBe(0.5);
  expect(combinarProgresso([{ fracao: 2, peso: 1 }, { fracao: NaN, peso: 1 }])).toBe(0.5);
  expect(combinarProgresso([])).toBe(1);
});
// abertura.test.ts
it('30 fps: um quadro a cada 33,3 ms', () => {
  expect(quadroDaAbertura(0)).toBe(0);
  expect(quadroDaAbertura(33.4)).toBe(1);
  expect(quadroDaAbertura(1299)).toBe(38);
});
it('acaba depois do quadro 39 (o 40º é o quadro 1 da Hero)', () => {
  expect(quadroDaAbertura(1300)).toBeNull();
  expect(quadroDaAbertura(-5)).toBe(0);
});
```

- [ ] **Implementação:**

```ts
// lights.ts
export function combinarProgresso(partes: { fracao: number; peso: number }[]): number {
  const total = partes.reduce((s, p) => s + p.peso, 0);
  return total ? partes.reduce((s, p) => s + clamp01(p.fracao) * p.peso, 0) / total : 1;
}
// abertura.ts
export const QUADROS_ABERTURA = 39;
export const FPS_ABERTURA = 30;
export function quadroDaAbertura(ms: number, total = QUADROS_ABERTURA, fps = FPS_ABERTURA): number | null {
  const i = Math.floor((Math.max(0, ms) * fps) / 1000);
  return i < total ? i : null;
}
```

### Task 3: largada verde + abertura na Hero

**Arquivos:**
- `index.html`: `aria-live="polite"` no `.loader__label`
- `src/styles/tokens.css`: `--c-luz-verde`
- `src/styles/hero.css`
- `src/hero/hero.ts`

- [ ] **CSS:**

```css
.loader__lights.is-verde span.is-lit { background: var(--c-luz-verde); box-shadow: 0 0 24px var(--c-luz-verde), inset 0 0 0 3px #00602f; transition-duration: 0.12s; }
html.is-abertura { overflow: hidden; }
.hero__chapters, .hero__progress, .telemetry { transition: opacity 0.4s var(--ease-out); }
.hero--abertura :is(.hero__chapters, .hero__progress, .telemetry) { opacity: 0; }
```

- [ ] **`hero.ts`:**
  - `lightsOut` vira `largada(loader)`: 100% → 450 ms → `.is-verde` + rótulo "Largada!" → 400 ms → `dismissLoader`.
  - `tocarAbertura(ctx, abertura, focusX)` desenha `quadroDaAbertura(t)` em `requestAnimationFrame`. Resolve na hora se `abertura.get(0)` for `null`.
  - **Em `montarHero`:**
    - carrega a Hero e a abertura em paralelo, com `combinarProgresso` (pesos = `prioritarios`);
    - adiciona `hero--abertura` e `html.is-abertura`;
    - roda `largada` e depois `tocarAbertura`;
    - desenha o quadro 1 da Hero;
    - remove as classes;
    - segue o fluxo atual (`startSmoothScroll`, `fixar`/`empilhar`).
  - **No `finally` de `initHero`:** remove as classes, para nunca travar a rolagem se algo falhar.
- [ ] **E2E (`e2e/landing.spec.ts`):** um teste novo, "largada fica verde e a abertura pousa no capítulo 1".
  - `.loader__lights` ganha `is-verde` antes de `.loader.is-done`;
  - depois, `html` sem `is-abertura` e `.chapter[data-chapter="0"]` com `is-active`.

### Task 4: medidor de velocidade

**Arquivos:**
- novo: `src/core/velocidade.ts` (+ teste)
- `src/main.ts`

- [ ] **Testes (falham):**

```ts
it('normaliza para −1…1 com sinal', () => {
  expect(nivelDeVelocidade(30)).toBe(0.5);
  expect(nivelDeVelocidade(-200)).toBe(-1);
  expect(nivelDeVelocidade(NaN)).toBe(0);
});
it('suaviza sem depender da taxa de quadros e zera no fim', () => {
  expect(suavizar(0, 1, 90)).toBeCloseTo(0.5);              // meia-vida 90 ms
  expect(suavizar(0, 1, 45) ).toBeCloseTo(1 - 2 ** -0.5);
  expect(suavizar(0.001, 0, 16)).toBe(0);                   // abaixo de 0,002 vira 0
});
```

- [ ] **Implementação:**
  - `VEL_MAX = 60` px/quadro;
  - `nivelDeVelocidade`;
  - `suavizar(atual, alvo, dtMs, meiaVidaMs = 90)`.
  - `ligarVelocidade(lenis, alvos)`:
    - ouve `lenis.on('scroll')`;
    - zera o alvo se passar 120 ms sem evento;
    - no `gsap.ticker`, suaviza e escreve `--vel` e `--vel-abs` nos alvos só quando muda mais de 0,002.
- [ ] **`main.ts`:** depois de montar tudo e fora do movimento reduzido, `ligarVelocidade(startSmoothScroll(), [fundo-vivo, ...títulos])`.

### Task 5: fundo vivo e títulos

**Arquivos:**
- `index.html`: `<div class="fundo-vivo" aria-hidden="true"><span class="fundo-vivo__luz"></span><span class="fundo-vivo__linhas"><i></i>×7</span></div>`, logo depois do loader
- novo: `src/styles/efeitos.css`, importado no `main.ts`

- [ ] **CSS:**
  - `.fundo-vivo`: `position: fixed`, `inset: 0`, `z-index: 40`, `pointer-events: none`, `overflow: hidden`.
  - `::before`: grão em `inset: -50%` com `url(grao-pintura.webp)`, opacidade 0,05, `animation` em `steps(1)` com 9 posições a cada 1/12 s.
  - **Luz:** radial azul-racing no alto à direita; `transform: scale(1 + vel-abs × 1,6, 1 − vel-abs × 0,6)`.
  - **Linhas:** 7 `<i>`, 1 px, com degradê branco; `opacity: var(--vel-abs)`; posições via `nth-child`.
  - **Títulos:** `:is(.titulo-secao, .parada__titulo, .etapa__titulo, .etapa-dm01__titulo, .era__titulo, .legado__titulo) { transform-origin: left center; transform: skewX(calc(var(--vel, 0) * -8deg)) scaleX(calc(1 + var(--vel-abs, 0) * 0.04)); }`
  - `.legado { overflow-x: clip }`: é a única seção com título fora de um palco cortado.
  - `@media (prefers-reduced-motion: reduce)`: sem animação do grão e sem linhas.

### Task 6: faixas diagonais

**Arquivos:**
- `index.html`: `<div class="faixas-transicao" aria-hidden="true"><div class="faixas-transicao__grupo"><span></span><span></span><span></span></div></div>`
- `src/styles/efeitos.css`
- novo: `src/sections/faixas/faixas.ts` (+ teste)
- `src/main.ts`

- [ ] **Teste (falha):**

```ts
it('começa fora da tela à esquerda e termina fora à direita', () => {
  expect(faixaX(0, 1440, 900) + 900).toBeLessThanOrEqual(0);
  expect(faixaX(1, 1440, 900)).toBeGreaterThanOrEqual(1440);
  expect(faixaX(0.5, 1440, 900)).toBeGreaterThan(faixaX(0.25, 1440, 900));
  expect(faixaX(NaN, 1440, 900)).toBe(faixaX(0, 1440, 900));
});
```

- [ ] **Implementação:**

```ts
export function faixaX(p: number, tela: number, grupo: number): number {
  const inicio = -grupo - tela * 0.35, fim = tela * 1.35;
  return inicio + clamp01(p) * (fim - inicio);
}
```

  - **`initFaixas()`:** para `#dm01` e `#pintura`, um `ScrollTrigger` de `top bottom` até `top top`.
    - `onUpdate`: `gsap.set(grupo, { x: faixaX(p, innerWidth, grupo.offsetWidth) })`;
    - `.is-ativa` no overlay enquanto `0 < p < 1`.
  - Chamar no `main.ts` antes do `ScrollTrigger.refresh()`, fora do movimento reduzido.

### Task 7: cursor próprio no Showroom

**Arquivos:**
- `index.html`: dentro de `.showroom__stage`, `<div class="cursor-giro" aria-hidden="true"><span class="cursor-giro__anel"></span><span class="cursor-giro__texto"><span class="cursor-giro__parado">Arraste para girar</span><span class="cursor-giro__girando">← Girando →</span></span></div>`
- `src/sections/showroom/showroom.css`
- `src/sections/showroom/showroom.ts` (no bloco `if (ctx.usa3D)`, só com `matchMedia('(pointer: fine)')`)

- [ ] **JS:**
  - `gsap.quickTo(cursor, 'x'|'y', { duration: 0.25, ease: 'power3' })`;
  - `pointermove` posiciona em relação ao `stage.getBoundingClientRect()`;
  - `.mostra-cursor` no stage quando o alvo não é `button, a, .hotspot`;
  - `pointerleave` remove a classe.
- [ ] **CSS:**
  - anel de 88 px com borda branca 1,5 px;
  - `.mostra-cursor { cursor: none }`;
  - `.is-arrastando`: anel de 56 px vermelho e troca do texto.

### Task 8: dica do Em números

- [ ] **`index.html`:** mover `<p class="rotulo numeros__dica">` para logo depois do `<p class="corpo">`.
- [ ] **`numeros.css`:** `.numeros__dica { margin: 0; }`; remover `position`/`bottom` (também no bloco de celular).

### Task 9: verificação, revisão e entrega

- [ ] `npm test`, `npm run build` e `npm run e2e`: tudo verde.
- [ ] Captura no Chrome headless em desktop e celular:
  - loader verde;
  - meio da abertura;
  - pouso;
  - Em números com a dica;
  - faixa no meio;
  - Showroom com o anel.
- [ ] Lighthouse (celular e desktop) sem regressão.
- [ ] Revisão do `accessibility-specialist`.
- [ ] Portão de entrega.
- [ ] Commit e `git push` em `feat/landing-completa`.
