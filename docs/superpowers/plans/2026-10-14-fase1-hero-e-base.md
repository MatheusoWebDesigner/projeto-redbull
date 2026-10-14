# Fase 1 — Hero final e base compartilhada · Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar a Hero idêntica ao Figma aprovado (página "01 · Hero") e criar a base de rolagem e formatação que as próximas seções vão reaproveitar.

**Architecture:** A Hero já existe em `src/hero/`: módulos puros testados e um `hero.ts` que liga GSAP, ScrollTrigger e Lenis. Esta fase faz quatro coisas:
- extrai a rolagem suave para `src/core/scroll.ts`, numa instância única para a página toda;
- cria `src/core/format.ts` para números em pt-BR;
- aplica os ajustes do Figma no CSS e no HTML;
- move os quadros WebP para `public/`.

**Tech Stack:** Vite 8, TypeScript 7, GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3, Vitest 5.

**Contexto para quem executa (zero contexto):**
- Projeto: landing conceitual do carro de F1 Red Bull RB22 (2026), em português do Brasil. Rodar os comandos na raiz `C:\Users\Matheus Workspace\Desktop\Projetos\Projeto RedBull`, branch `feat/landing-completa`.
- Testes: `npm test` (Vitest, ambiente node, arquivos `src/**/*.test.ts`). Build: `npm run build` (`tsc --noEmit` + `vite build`).
- Spec da Hero: `docs/superpowers/specs/2026-10-07-hero-design.md`. A seção "Fonte da verdade: Figma" lista os ajustes que esta fase implementa.
- Os quadros WebP estão hoje em `assets/hero/frames/{desktop,mobile}/f_001…f_240.webp`, junto com `poster_desktop.webp` e `poster_mobile.webp`. O celular usa 720×1560 (proporção 9:19,5); o desktop, 1280×800.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/core/format.ts` (novo) | `formatNumber(n)`: inteiro no formato pt-BR (`13200` → `13.200`) |
| `src/core/format.test.ts` (novo) | testes do formatador |
| `src/core/scroll.ts` (novo) | instância única de Lenis ligada ao ScrollTrigger e ao ticker do GSAP |
| `src/hero/hero.ts` (modificar) | usa `startSmoothScroll()` e `formatNumber()` |
| `src/styles/hero.css` (modificar) | degradê inferior; no celular, degradê superior novo e barras de progresso no topo |
| `index.html` (modificar) | valor inicial do rpm em pt-BR (`4.500`) |
| `public/hero/frames/**` (mover de `assets/hero/frames/**`) | quadros servidos pelo Vite |
| `.gitignore` (modificar) | ignora `assets/referencias/` e `assets/marcas/` (fotos e marcas de terceiros que não vão para o repositório) |
| `.claude/launch.json` (novo) | servidor `rb22-dev` para verificação no navegador embutido |

---

### Task 1: Formatador de números pt-BR

**Files:**
- Create: `src/core/format.ts`
- Test: `src/core/format.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// src/core/format.test.ts
import { describe, expect, it } from 'vitest';
import { formatNumber } from './format';

describe('formatNumber', () => {
  it('usa ponto como separador de milhar', () => {
    expect(formatNumber(13200)).toBe('13.200');
    expect(formatNumber(4500)).toBe('4.500');
  });
  it('não mexe em números abaixo de mil', () => {
    expect(formatNumber(320)).toBe('320');
    expect(formatNumber(0)).toBe('0');
  });
  it('arredonda para inteiro', () => {
    expect(formatNumber(15000.4)).toBe('15.000');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/core/format.test.ts`
Expected: FAIL com "Failed to resolve import './format'".

- [ ] **Step 3: Implementação mínima**

```ts
// src/core/format.ts
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** Inteiro no formato brasileiro: 13200 → "13.200". */
export function formatNumber(n: number): string {
  return inteiro.format(Math.round(n));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/core/format.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/core/format.ts src/core/format.test.ts
git commit -m "feat(core): formatador de números pt-BR"
```

---

### Task 2: Rolagem suave compartilhada

**Files:**
- Create: `src/core/scroll.ts`
- Modify: `src/hero/hero.ts` (imports e linhas 85–88)

Não há teste unitário: o módulo só liga bibliotecas de DOM. A verificação acontece no navegador, na Task 5.

- [ ] **Step 1: Criar o módulo**

```ts
// src/core/scroll.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Liga a rolagem suave uma única vez para a página inteira. Chamadas repetidas devolvem a mesma instância. */
export function startSmoothScroll(): Lenis {
  if (lenis) return lenis;
  const instance = new Lenis();
  instance.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => instance.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis = instance;
  return instance;
}
```

- [ ] **Step 2: Usar o módulo na Hero**

Em `src/hero/hero.ts`, remover a linha `import Lenis from 'lenis';` e adicionar:

```ts
import { startSmoothScroll } from '../core/scroll';
import { formatNumber } from '../core/format';
```

Trocar o bloco:

```ts
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
```

por:

```ts
  startSmoothScroll();
```

- [ ] **Step 3: Números da telemetria em pt-BR**

Ainda em `src/hero/hero.ts`, dentro de `render`, trocar:

```ts
    speedEl.textContent = String(speedKmh(progress));
    rpmEl.textContent = String(rpm(progress));
```

por:

```ts
    speedEl.textContent = formatNumber(speedKmh(progress));
    rpmEl.textContent = formatNumber(rpm(progress));
```

Em `index.html`, trocar `<span class="telemetry__value" data-rpm>4500</span>` por `<span class="telemetry__value" data-rpm>4.500</span>`.

- [ ] **Step 4: Testes e build**

Run: `npm test && npm run build`
Expected: 28 testes PASS, build sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/core/scroll.ts src/hero/hero.ts index.html
git commit -m "refactor(hero): rolagem suave compartilhada e telemetria em pt-BR"
```

---

### Task 3: Ajustes visuais do Figma na Hero

**Files:**
- Modify: `src/styles/hero.css`

Referências no Figma, página "01 · Hero":
- **Desktop:** a camada "degradê inferior" vai de y=640 a 900 (0 → 82% de opacidade).
- **Celular:**
  - a camada "degradê de contraste" tem as paradas 92% → 86% (30%) → 40% (42%) → 0 (55%);
  - o "degradê inferior" começa em 64% da altura (0 → 82%);
  - as barras de progresso ficam no topo, acima do capítulo, com largura total.

- [ ] **Step 1: Degradê inferior no desktop**

Trocar a regra `.hero__shade` (linha 19) por:

```css
.hero__shade {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(3, 5, 13, 0) 71%, rgba(3, 5, 13, 0.82) 100%),
    linear-gradient(90deg, rgba(3, 5, 13, 0.92) 0%, rgba(3, 5, 13, 0.55) 38%, rgba(3, 5, 13, 0) 62%);
}
```

- [ ] **Step 2: Celular — degradês e barras no topo**

Dentro de `@media (max-aspect-ratio: 1/1)`, trocar as regras `.hero__shade` e `.hero__chapters` por:

```css
  .hero__shade {
    background:
      linear-gradient(180deg, rgba(3, 5, 13, 0) 64%, rgba(3, 5, 13, 0.82) 100%),
      linear-gradient(180deg, rgba(3, 5, 13, 0.92) 0%, rgba(3, 5, 13, 0.86) 30%, rgba(3, 5, 13, 0.4) 42%, rgba(3, 5, 13, 0) 55%);
  }
  .hero__progress { top: clamp(3.5rem, 8.5vh, 4.5rem); bottom: auto; left: var(--gutter); right: var(--gutter); }
  .hero__progress span { flex: 1; width: auto; }
  .hero__chapters { top: clamp(5.5rem, 12vh, 7.5rem); bottom: auto; width: calc(100% - 2 * var(--gutter)); }
```

(Manter as regras `.chapter`, `.chapter__title` e `.telemetry` que já estão no bloco.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/styles/hero.css
git commit -m "style(hero): degradês e barras de progresso conforme o Figma"
```

---

### Task 4: Quadros em `public/` e higiene do repositório

**Files:**
- Move: `assets/hero/` → `public/hero/`
- Modify: `.gitignore`
- Create: `.claude/launch.json`

- [ ] **Step 1: Mover os quadros** (PowerShell, mesmo disco)

```powershell
New-Item -ItemType Directory -Force public | Out-Null
Move-Item "assets\hero" "public\hero"
(Get-ChildItem public\hero\frames\desktop -Filter *.webp).Count
(Get-ChildItem public\hero\frames\mobile -Filter *.webp).Count
Test-Path public\hero\frames\poster_desktop.webp, public\hero\frames\poster_mobile.webp
```
Expected: `240`, `240`, `True`, `True`.

- [ ] **Step 2: Ignorar material de terceiros**

Acrescentar ao fim do `.gitignore`:

```
assets/referencias/
assets/marcas/
```

- [ ] **Step 3: Configuração do servidor de pré-visualização**

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "rb22-dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5173 }
  ]
}
```

Salvar em `.claude/launch.json`.

- [ ] **Step 4: Conferir que nada de terceiros entra no commit**

Run: `git status --short`
Expected: aparecem só `.gitignore`, `.claude/launch.json` e `public/hero/...`, e nenhum arquivo de `assets/referencias` ou `assets/marcas`.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .claude/launch.json public/hero
git commit -m "chore(hero): quadros WebP finais em public/ e config de pré-visualização"
```

---

### Task 5: Verificação no navegador embutido

Sem mudança de código. Se algo falhar, a correção vira um passo novo com commit próprio.

- [ ] **Step 1: Desktop 1440×900.** Abrir o servidor `rb22-dev` (`preview_start` com name `rb22-dev`) e tirar screenshot em cada ponto:
  1. Loader: as 5 luzes acendem e apagam, e a Hero aparece no quadro 1.
  2. Rolar até 0, 25, 50, 75 e 100% da Hero. Em cada ponto, conferir:
     - o capítulo certo aparece (01…04);
     - o texto não cobre o carro;
     - as barras acompanham a rolagem;
     - a telemetria sobe de 0 km/h a 320 km/h, com rpm no formato "13.200";
     - o degradê inferior escurece o reflexo do chão atrás da telemetria.
  3. Rolar para cima: o vídeo volta quadro a quadro, sem piscar.
  4. Console sem erros (`read_console_messages`, só erros).
- [ ] **Step 2: Celular 390×844.** Recarregar e conferir:
  - os quadros usados são os de `mobile`;
  - o carro aparece inteiro, sem corte lateral;
  - as barras ficam no topo e o texto logo abaixo;
  - o parágrafo fica legível sobre as faixas de luz do teto.
- [ ] **Step 3: Movimento reduzido.** Emular `prefers-reduced-motion: reduce` e conferir: pôster estático, os 4 capítulos empilhados e legíveis, sem pin.
- [ ] **Step 4:** Restaurar o viewport (`resize_window` preset `desktop`).

---

### Task 6: Revisões obrigatórias

- [ ] **Step 1: Acessibilidade.** Despachar o `accessibility-specialist` (Modo A) para auditar:
  - `index.html` e `src/styles/hero.css`;
  - o comportamento da página: foco do link "Pular introdução", ordem de leitura, contraste do texto sobre os degradês, `prefers-reduced-motion`, o loader com `role="progressbar"` e o texto alternativo do canvas.

  Corrigir os achados de severidade alta, cada correção com o seu teste ou verificação.
- [ ] **Step 2: Testes.** Despachar o `test-engineer` (Modo A) para revisar a cobertura de `src/hero/*.ts` e de `src/core/format.ts`. Aplicar, em TDD, os casos faltantes que forem pertinentes.
- [ ] **Step 3: Rodar tudo**

Run: `npm test && npm run build`
Expected: todos os testes PASS, build ok.

- [ ] **Step 4: Commit das correções**

```bash
git add -A
git commit -m "fix(hero): ajustes da revisão de acessibilidade e testes"
```
