# Fase 3 — Seções sem 3D · Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar Manifesto, Em números, Legado, Fechamento e o rodapé, idênticos ao Figma aprovado (páginas 02, 06, 08 e 09).

**Architecture:**
- Cada seção fica em `src/sections/<nome>/`, com:
  - `<nome>.ts`: liga DOM, GSAP e ScrollTrigger;
  - um módulo puro com a lógica testável;
  - um CSS próprio.
- A lógica comum vai em `src/core/`:
  - `countup.ts`: contagem de números em pt-BR;
  - `motion.ts`: movimento reduzido.
- A rolagem suave é a de `src/core/scroll.ts` (Fase 1).
- `main.ts` inicializa as seções **depois** da Hero, que cria o primeiro pin, e no fim chama `ScrollTrigger.refresh()`. Assim os pins ficam na ordem do DOM.

**Tech Stack:** Vite 8, TypeScript 7, GSAP 3.15 (ScrollTrigger e SplitText), Lenis 1.3, Vitest 5.

**Contexto para quem executa:**
- **Onde rodar:** na raiz `C:\Users\Matheus Workspace\Desktop\Projetos\Projeto RedBull`, branch `feat/landing-completa`.
- **Comandos:** `npm test` (testes), `npm run build` (build) e `npm run dev` (servidor na porta 5173). A verificação visual usa o navegador embutido, com o servidor `rb22-dev` definido em `.claude/launch.json`.
- **Specs (texto e regras de cada seção):**
  - `docs/superpowers/specs/2026-10-08-manifesto-design.md`
  - `2026-10-14-numeros-design.md`
  - `2026-10-14-legado-design.md`
  - `2026-10-14-fechamento-design.md`
- **Fonte da verdade visual:** o Figma "Projeto F1 RedBull" (fileKey `M4LbG2oj3n7rGn3YesgOBV`), páginas "02 · Manifesto", "06 · Em números", "08 · Legado" e "09 · Fechamento e rodapé". As anotações têm os tempos de cada animação.
- **Tokens já existentes** em `src/styles/tokens.css`:
  - cores: `--c-bg #03050d`, `--c-navy #0b1538`, `--c-text`, `--c-text-muted`, `--c-red #d2003c`, `--c-yellow #ffc906`;
  - fontes: `--f-display` (Barlow Condensed) e `--f-body` (Inter);
  - `--gutter` e `--ease-out`.
- **Celular:** é detectado por `(max-aspect-ratio: 1/1)`, como na Hero.
- **Movimento reduzido:** a Hero põe a classe `reduced` no `<html>` quando `prefers-reduced-motion: reduce`. As seções desta fase usam `prefersReducedMotion()`.
- **Pendência registrada no roteiro:** o link de "Ver estudo de caso" ainda não foi definido. Ele fica numa constante única em `src/config.ts`.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/core/motion.ts` | `prefersReducedMotion()` |
| `src/core/countup.ts` (+ `.test.ts`) | converte texto em valor numérico e formata em pt-BR durante a contagem (`"3.400"`, `"8,5"`, `"−55%"`) |
| `src/config.ts` | `LINKS.estudoDeCaso` |
| `src/styles/base.css` | estilos comuns: `.kicker`, `.sr-only`, `.btn`, `.secao` |
| `src/sections/manifesto/words.ts` (+ teste) | opacidade de cada palavra em função do progresso |
| `src/sections/manifesto/manifesto.ts`, `manifesto.css` | pin, palavras, brilho, marca d'água e assinatura |
| `src/sections/numeros/track.ts` (+ teste) | deslocamento do trilho e faixa visível ("01–03 / 08") |
| `src/sections/numeros/numeros.ts`, `numeros.css` | pin horizontal, contagem por cartão e DRS riscado |
| `src/sections/legado/marks.ts` (+ teste) | marcos da faixa 2005–2026 |
| `src/sections/legado/legado.ts`, `legado.css` | entrada do título, contadores e SVG da faixa |
| `src/sections/fechamento/mask.ts` (+ teste) | progresso → quadro invertido e escala do título |
| `src/sections/fechamento/fechamento.ts`, `fechamento.css` | canvas com máscara de texto, botões e "voltar ao topo" |
| `index.html` | marcação das 4 seções e do rodapé; o skip link aponta para `#manifesto` |
| `src/main.ts` | ordem de inicialização |

---

### Task 1: Núcleo — movimento reduzido, contagem pt-BR e config

**Files:** Create `src/core/motion.ts`, `src/core/countup.ts`, `src/core/countup.test.ts`, `src/config.ts`

- [ ] **Step 1: Teste da contagem (falha esperada)**

```ts
// src/core/countup.test.ts
import { describe, expect, it } from 'vitest';
import { countFrame, parseValue } from './countup';

describe('parseValue', () => {
  it('lê milhar com ponto', () => expect(parseValue('3.400')).toEqual({ prefix: '', number: 3400, decimals: 0, suffix: '' }));
  it('lê decimal com vírgula', () => expect(parseValue('8,5')).toEqual({ prefix: '', number: 8.5, decimals: 1, suffix: '' }));
  it('lê sinal e porcentagem', () => expect(parseValue('−55%')).toEqual({ prefix: '−', number: 55, decimals: 0, suffix: '%' }));
  it('lê zero', () => expect(parseValue('0')).toEqual({ prefix: '', number: 0, decimals: 0, suffix: '' }));
});

describe('countFrame', () => {
  it('chega ao texto original no fim', () => {
    for (const t of ['768', '3.400', '1.900', '−55%', '350', '8,5', '100%', '130', '6']) {
      expect(countFrame(parseValue(t), 1)).toBe(t);
    }
  });
  it('começa em zero sem sinal', () => {
    expect(countFrame(parseValue('−55%'), 0)).toBe('0%');
    expect(countFrame(parseValue('8,5'), 0)).toBe('0,0');
  });
  it('desacelera no fim (power2.out)', () => {
    expect(countFrame(parseValue('100%'), 0.5)).toBe('75%');
  });
  it('limita t entre 0 e 1', () => {
    expect(countFrame(parseValue('768'), 2)).toBe('768');
    expect(countFrame(parseValue('768'), -1)).toBe('0');
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/core/countup.test.ts`. Expected: FAIL ("Failed to resolve import './countup'").

- [ ] **Step 3: Implementação**

```ts
// src/core/countup.ts
export interface ParsedValue { prefix: string; number: number; decimals: number; suffix: string }

/** "3.400" → 3400 · "8,5" → 8,5 (1 casa) · "−55%" → sinal "−", 55, sufixo "%". */
export function parseValue(text: string): ParsedValue {
  const m = /^([−+-]?)([\d.]+)(?:,(\d+))?(.*)$/.exec(text.trim());
  if (!m) throw new Error(`Valor não numérico: ${text}`);
  const inteiro = Number(m[2].replace(/\./g, ''));
  const decimais = m[3] ?? '';
  return { prefix: m[1], number: decimais ? Number(`${inteiro}.${decimais}`) : inteiro, decimals: decimais.length, suffix: m[4] };
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Texto do contador no instante t (0 → 1), já no formato pt-BR. */
export function countFrame(v: ParsedValue, t: number): string {
  const k = easeOut(Math.min(1, Math.max(0, t)));
  const n = v.number * k;
  const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: v.decimals, maximumFractionDigits: v.decimals });
  return `${n > 0 ? v.prefix : ''}${fmt.format(n)}${v.suffix}`;
}
```

- [ ] **Step 4:** Run `npx vitest run src/core/countup.test.ts`. Expected: PASS (8 testes).

- [ ] **Step 5: Movimento reduzido e config**

```ts
// src/core/motion.ts
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

```ts
// src/config.ts
/** Links externos. estudoDeCaso ainda será definido com o usuário (pendência do roteiro). */
export const LINKS = {
  estudoDeCaso: '#fechamento',
} as const;
```

- [ ] **Step 6: Commit**

```bash
git add src/core/motion.ts src/core/countup.ts src/core/countup.test.ts src/config.ts
git commit -m "feat(core): contagem pt-BR, movimento reduzido e config de links"
```

---

### Task 2: Estilos base compartilhados

**Files:** Create `src/styles/base.css`; Modify `src/main.ts`

- [ ] **Step 1: Criar `src/styles/base.css`**

```css
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.secao { position: relative; background: var(--c-bg); color: var(--c-text); }

.kicker { display: flex; align-items: center; gap: 0.75rem; margin: 0; color: var(--c-yellow); font: 600 0.8125rem/1.2 var(--f-body); letter-spacing: 0.22em; text-transform: uppercase; }
.kicker__rule { width: 1.75rem; height: 2px; background: var(--c-red); flex: none; }

.titulo-secao { margin: 0; font-family: var(--f-display); font-style: italic; font-weight: 800; text-transform: uppercase; line-height: 0.92; font-size: clamp(2.375rem, 5vw, 4.5rem); }
.corpo { margin: 0; color: var(--c-text-muted); font-size: clamp(1rem, 1.3vw, 1.125rem); line-height: 1.6; }
.rotulo { font-size: 0.6875rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-text-muted); }

.btn { display: inline-flex; align-items: center; gap: 0.6rem; min-height: 2.75rem; padding: 0.875rem 1.5rem; border-radius: 999px; font: 600 0.8125rem/1 var(--f-body); letter-spacing: 0.22em; text-transform: uppercase; text-decoration: none; cursor: pointer; border: 1px solid transparent; }
.btn--primario { background: var(--c-yellow); color: var(--c-bg); }
.btn--secundario { background: transparent; color: var(--c-text); border-color: var(--c-text); }
.btn:focus-visible { outline: 3px solid var(--c-yellow); outline-offset: 3px; }
```

- [ ] **Step 2: Importar no `src/main.ts`**, logo após `tokens.css`:

```ts
import './styles/base.css';
```

- [ ] **Step 3:** Run `npm run build`. Expected: ok.
- [ ] **Step 4: Commit:** `git add src/styles/base.css src/main.ts && git commit -m "style: base compartilhada (kicker, botões, sr-only)"`

---

### Task 3: Manifesto

**Files:** Create `src/sections/manifesto/words.ts`, `words.test.ts`, `manifesto.ts`, `manifesto.css`; Modify `index.html`, `src/main.ts`

- [ ] **Step 1: Teste da opacidade por palavra (falha esperada)**

```ts
// src/sections/manifesto/words.test.ts
import { describe, expect, it } from 'vitest';
import { DIM, LIT_END, wordOpacity } from './words';

describe('wordOpacity', () => {
  it('tudo apagado no início', () => {
    for (let i = 0; i < 39; i++) expect(wordOpacity(i, 39, 0)).toBe(DIM);
  });
  it('tudo aceso a partir de LIT_END', () => {
    for (let i = 0; i < 39; i++) expect(wordOpacity(i, 39, LIT_END)).toBe(1);
    expect(wordOpacity(38, 39, 1)).toBe(1);
  });
  it('acende em ordem: palavra anterior nunca é mais apagada que a seguinte', () => {
    for (const p of [0.1, 0.33, 0.5, 0.7]) {
      for (let i = 1; i < 39; i++) expect(wordOpacity(i - 1, 39, p)).toBeGreaterThanOrEqual(wordOpacity(i, 39, p));
    }
  });
  it('palavra no limiar fica parcialmente acesa', () => {
    const v = wordOpacity(19, 39, (19.5 / 39) * LIT_END);
    expect(v).toBeGreaterThan(DIM);
    expect(v).toBeLessThan(1);
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/sections/manifesto/words.test.ts`. Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementação**

```ts
// src/sections/manifesto/words.ts
/** Opacidade das palavras ainda não lidas. */
export const DIM = 0.2;
/** Progresso em que a última palavra termina de acender (o resto é pausa). */
export const LIT_END = 0.8;

export function wordOpacity(index: number, count: number, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  const lit = (p / LIT_END) * count - index;
  if (lit >= 1) return 1;
  if (lit <= 0) return DIM;
  return DIM + (1 - DIM) * lit;
}
```

- [ ] **Step 4:** Run o teste. Expected: PASS (4 testes).

- [ ] **Step 5: Marcação.** Em `index.html`:
  - trocar o `href` do skip link de `#depois-da-hero` para `#manifesto`;
  - substituir a `<section id="depois-da-hero" …>…</section>` por:

```html
      <section id="manifesto" class="secao manifesto" aria-labelledby="manifesto-titulo" tabindex="-1">
        <div class="manifesto__stage">
          <div class="manifesto__glow" aria-hidden="true"></div>
          <p class="manifesto__watermark" aria-hidden="true">DM01</p>
          <div class="manifesto__content">
            <h2 id="manifesto-titulo" class="kicker"><span class="kicker__rule" aria-hidden="true"></span>Manifesto</h2>
            <p class="manifesto__frase">Pela primeira vez, a Red Bull faz o carro e o motor. Os dois nascem sob o mesmo teto, em Milton Keynes. E o motor leva as iniciais do fundador que deu o sinal verde: <span class="manifesto__dm01">DM01</span>, de Dietrich Mateschitz.</p>
            <div class="manifesto__assinatura">
              <p class="rotulo">Red Bull Ford Powertrains · Milton Keynes · 2026</p>
              <p class="corpo">Parceria técnica com a Ford: bateria, motor elétrico e software de controle.</p>
            </div>
          </div>
        </div>
      </section>
      <!-- Fase 4: #showroom e #aero entram aqui · Fase 5: #dm01 entra aqui -->
```

- [ ] **Step 6: CSS** — criar `src/sections/manifesto/manifesto.css`:

```css
.manifesto__stage { position: relative; height: 100svh; overflow: hidden; display: grid; align-items: center; padding: 0 var(--gutter);
  --mf-glow: 0; --mf-wm-x: 0px; --mf-wm-op: 0.05; }
.manifesto__glow { position: absolute; inset: 0; opacity: var(--mf-glow);
  background: radial-gradient(70% 90% at 85% 100%, rgba(21, 51, 128, 0.6) 0%, rgba(11, 21, 56, 0.35) 45%, rgba(11, 21, 56, 0) 100%); }
.manifesto__watermark { position: absolute; right: -4vw; bottom: -10vh; margin: 0; font: italic 800 clamp(14rem, 39vw, 35rem)/0.9 var(--f-display);
  color: transparent; -webkit-text-stroke: 1.5px rgba(255, 255, 255, var(--mf-wm-op)); transform: translateX(var(--mf-wm-x)); pointer-events: none; user-select: none; }
.manifesto__content { position: relative; display: grid; gap: 2.5rem; max-width: 65.5rem; }
.manifesto__frase { margin: 0; font: italic 800 clamp(2.375rem, 4.72vw, 4.25rem)/0.98 var(--f-display); text-transform: uppercase; }
.manifesto__dm01 { color: var(--c-red); }
.manifesto__assinatura { display: grid; gap: 0.5rem; opacity: 0; transform: translateY(12px); }
.manifesto__assinatura .rotulo, .manifesto__assinatura .corpo { margin: 0; }
.manifesto.is-assinado .manifesto__assinatura { opacity: 1; transform: none; transition: opacity 0.5s var(--ease-out), transform 0.5s var(--ease-out); }

@media (max-aspect-ratio: 1/1) {
  .manifesto__stage { align-items: start; padding-top: 6rem; }
  .manifesto__content { gap: 1.75rem; }
  .manifesto__watermark { font-size: 14.4rem; right: -2rem; bottom: -3rem; -webkit-text-stroke-width: 1px; }
}

.reduced .manifesto__stage { height: auto; min-height: 100svh; padding-block: 6rem; --mf-glow: 1; --mf-wm-op: 0.14; --mf-wm-x: -80px; }
.reduced .manifesto__assinatura { opacity: 1; transform: none; }
```

- [ ] **Step 7: Comportamento** — criar `src/sections/manifesto/manifesto.ts`:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { prefersReducedMotion } from '../../core/motion';
import { wordOpacity } from './words';
import './manifesto.css';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initManifesto(): void {
  if (prefersReducedMotion()) return;
  const section = document.querySelector<HTMLElement>('.manifesto');
  const stage = section?.querySelector<HTMLElement>('.manifesto__stage');
  const frase = section?.querySelector<HTMLElement>('.manifesto__frase');
  if (!section || !stage || !frase) return;

  const words = SplitText.create(frase, { type: 'words' }).words as HTMLElement[];
  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;

  const render = (p: number) => {
    words.forEach((w, i) => { w.style.opacity = String(wordOpacity(i, words.length, p)); });
    stage.style.setProperty('--mf-glow', String(p));
    stage.style.setProperty('--mf-wm-x', `${-80 * p}px`);
    stage.style.setProperty('--mf-wm-op', String(0.05 + 0.09 * p));
    section.classList.toggle('is-assinado', p >= 0.85);
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: mobile ? '+=120%' : '+=150%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  });
  render(0);
}
```

- [ ] **Step 8: Ordem de inicialização** — reescrever `src/main.ts`:

```ts
import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHero } from './hero/hero';
import { initManifesto } from './sections/manifesto/manifesto';

async function start(): Promise<void> {
  await initHero();
  initManifesto();
  ScrollTrigger.refresh();
}

void start();
```

- [ ] **Step 9:** Run `npm test && npm run build`. Expected: PASS e build ok.

- [ ] **Step 10: Verificação no navegador** (`rb22-dev`, desktop 1440×900):
  1. Ao sair da Hero, a seção fica fixa.
  2. As palavras acendem em ordem até ~80% da seção.
  3. "DM01" aparece em vermelho.
  4. O brilho azul cresce no canto inferior direito.
  5. A marca d'água desliza para a esquerda.
  6. A assinatura entra uma vez.

  Comparar com a página "02 · Manifesto" do Figma. Depois conferir no celular (390×844): o texto fica no topo.

- [ ] **Step 11: Commit:** `git add index.html src/main.ts src/sections/manifesto && git commit -m "feat(manifesto): frase que acende por palavra, brilho e assinatura"`

---

### Task 4: Em números

**Files:** Create `src/sections/numeros/track.ts`, `track.test.ts`, `numeros.ts`, `numeros.css`; Modify `index.html`, `src/main.ts`

- [ ] **Step 1: Teste do trilho (falha esperada)**

```ts
// src/sections/numeros/track.test.ts
import { describe, expect, it } from 'vitest';
import { rangeLabel, trackShift, visibleRange } from './track';

describe('trackShift', () => {
  it('não anda no início e anda tudo no fim', () => {
    expect(trackShift(0, 3048, 1296)).toBe(-0);
    expect(trackShift(1, 3048, 1296)).toBe(-1752);
  });
  it('não anda quando tudo cabe na tela', () => expect(trackShift(1, 800, 1296)).toBe(-0));
  it('limita o progresso', () => expect(trackShift(2, 3048, 1296)).toBe(-1752));
});

describe('visibleRange', () => {
  it('início, meio e fim com 3 por vez', () => {
    expect(visibleRange(0, 8, 3)).toEqual([1, 3]);
    expect(visibleRange(0.5, 8, 3)).toEqual([4, 6]);
    expect(visibleRange(1, 8, 3)).toEqual([6, 8]);
  });
  it('um por vez no celular', () => expect(visibleRange(1, 8, 1)).toEqual([8, 8]));
});

describe('rangeLabel', () => {
  it('faixa no desktop', () => expect(rangeLabel(1, 3, 8)).toBe('01–03 / 08'));
  it('um cartão no celular', () => expect(rangeLabel(6, 6, 8)).toBe('06 / 08'));
});
```

- [ ] **Step 2:** Run `npx vitest run src/sections/numeros/track.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implementação**

```ts
// src/sections/numeros/track.ts
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
```

- [ ] **Step 4:** Run o teste. Expected: PASS (7 testes).

- [ ] **Step 5: Marcação** — em `index.html`, logo depois do comentário de Fase 4/5:

```html
      <section id="numeros" class="secao numeros" aria-labelledby="numeros-titulo">
        <div class="numeros__stage">
          <header class="numeros__topo">
            <p class="kicker"><span class="kicker__rule" aria-hidden="true"></span>Em números</p>
            <div class="numeros__progresso" aria-hidden="true"><span class="numeros__barra"><span></span></span><span class="rotulo numeros__contador">01–03 / 08</span></div>
          </header>
          <h2 id="numeros-titulo" class="titulo-secao">Mais leve. Mais curto. Mais esperto.</h2>
          <p class="corpo">O RB22 resumido em oito números.</p>
          <ul class="numeros__trilho">
            <li class="card" data-tema="chassi"><span class="card__indice">01 / 08</span><p class="card__numero"><span class="card__valor" aria-hidden="true">768</span><span class="card__unidade" aria-hidden="true">kg</span><span class="sr-only">768 kg</span></p><h3 class="card__rotulo">Peso mínimo</h3><p class="card__desc">30 kg a menos que em 2025.</p></li>
            <li class="card" data-tema="chassi"><span class="card__indice">02 / 08</span><p class="card__numero"><span class="card__valor" aria-hidden="true">3.400</span><span class="card__unidade" aria-hidden="true">mm</span><span class="sr-only">3.400 mm</span></p><h3 class="card__rotulo">Entre-eixos máximo</h3><p class="card__desc">200 mm mais curto.</p></li>
            <li class="card" data-tema="chassi"><span class="card__indice">03 / 08</span><p class="card__numero"><span class="card__valor" aria-hidden="true">1.900</span><span class="card__unidade" aria-hidden="true">mm</span><span class="sr-only">1.900 mm</span></p><h3 class="card__rotulo">Largura</h3><p class="card__desc">100 mm mais estreito.</p></li>
            <li class="card" data-tema="chassi"><span class="card__indice">04 / 08</span><p class="card__numero"><span class="card__valor" aria-hidden="true">−55%</span><span class="sr-only">menos 55%</span></p><h3 class="card__rotulo">Arrasto (aprox.)</h3><p class="card__desc">Menos resistência nas retas, com a aerodinâmica ativa.</p></li>
            <li class="card" data-tema="energia"><span class="card__indice">05 / 08</span><p class="card__numero"><span class="card__valor" aria-hidden="true">350</span><span class="card__unidade" aria-hidden="true">kW</span><span class="sr-only">350 kW</span></p><h3 class="card__rotulo">MGU-K</h3><p class="card__desc">Quase 3× os 120 kW de 2025.</p></li>
            <li class="card" data-tema="energia"><span class="card__indice">06 / 08</span><p class="card__numero"><span class="card__valor" aria-hidden="true">8,5</span><span class="card__unidade" aria-hidden="true">MJ</span><span class="sr-only">8,5 MJ</span></p><h3 class="card__rotulo">Recuperados por volta (aprox.)</h3><p class="card__desc">Quase o dobro da energia de antes.</p></li>
            <li class="card" data-tema="energia"><span class="card__indice">07 / 08</span><p class="card__numero"><span class="card__valor" aria-hidden="true">100%</span><span class="sr-only">100%</span></p><h3 class="card__rotulo">Combustível sustentável</h3><p class="card__desc">Sem petróleo novo no tanque.</p></li>
            <li class="card card--drs" data-tema="chassi"><span class="card__indice">08 / 08</span><p class="card__numero"><span class="card__valor" aria-hidden="true" data-sem-contagem>0</span><span class="sr-only">zero</span></p><h3 class="card__rotulo"><span class="card__risco">DRS</span></h3><p class="card__desc">Trocado pela aerodinâmica ativa.</p></li>
          </ul>
          <p class="rotulo numeros__dica" aria-hidden="true">Role para correr os números →</p>
        </div>
      </section>
      <!-- Fase 5: #pintura entra aqui -->
```

- [ ] **Step 6: CSS** — criar `src/sections/numeros/numeros.css`:

```css
.numeros__stage { position: relative; height: 100svh; overflow: hidden; padding: 3.5rem var(--gutter); display: flex; flex-direction: column; gap: 1.25rem; }
.numeros__topo { display: flex; justify-content: space-between; align-items: center; }
.numeros__progresso { display: flex; align-items: center; gap: 0.75rem; }
.numeros__barra { position: relative; width: 12.5rem; height: 2px; background: rgba(255, 255, 255, 0.18); }
.numeros__barra span { position: absolute; inset: 0 auto 0 0; width: calc(var(--nm-p, 0) * 100%); background: var(--c-red); }
.numeros__trilho { list-style: none; margin: auto 0 0; padding: 0; display: flex; gap: 1.5rem; will-change: transform; }
.card { flex: none; width: 22.5rem; height: 28.75rem; display: flex; flex-direction: column; justify-content: space-between; padding: 0 2rem 2rem; border-radius: 12px; background: var(--c-navy); border: 1px solid #153380; position: relative; overflow: hidden; }
.card::before { content: ''; height: 4px; background: var(--c-red); }
.card[data-tema='energia']::before { background: #3b6cff; }
.card__indice { margin-top: 1.75rem; color: var(--c-yellow); font: 600 0.8125rem/1.2 var(--f-body); letter-spacing: 0.22em; }
.card__numero { margin: auto 0 0.75rem; display: flex; align-items: baseline; gap: 0.5rem; }
.card__valor { font: italic 800 6.75rem/0.88 var(--f-display); font-variant-numeric: tabular-nums; }
.card__unidade { font: italic 700 2.25rem/1 var(--f-display); color: var(--c-text-muted); }
.card__rotulo { margin: 0 0 0.75rem; font: 600 0.8125rem/1.3 var(--f-body); letter-spacing: 0.22em; text-transform: uppercase; }
.card__desc { margin: 0; color: var(--c-text-muted); font-size: 1rem; line-height: 1.6; }
.card__risco { position: relative; }
.card__risco::after { content: ''; position: absolute; left: -0.15em; right: -0.15em; top: 50%; height: 2px; background: var(--c-red); transform: scaleX(0); transform-origin: left; transition: transform 0.4s var(--ease-out); }
.card--drs.is-contado .card__risco::after { transform: scaleX(1); }
.numeros__dica { position: absolute; left: var(--gutter); bottom: 3.5rem; margin: 0; }

@media (max-aspect-ratio: 1/1) {
  .numeros__stage { padding: 4rem var(--gutter) 2.5rem; }
  .numeros__barra { width: 5rem; }
  .card { width: 18.75rem; height: 25rem; }
  .card__valor { font-size: 5rem; }
  .numeros__trilho { gap: 1rem; }
  .numeros__dica { bottom: 2.5rem; }
}

.reduced .numeros__stage { height: auto; }
.reduced .numeros__trilho { display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); transform: none !important; }
.reduced .card { width: auto; height: 25rem; }
.reduced .card__valor { font-size: 5rem; }
.reduced .card--drs .card__risco::after { transform: scaleX(1); }
.reduced .numeros__progresso, .reduced .numeros__dica { display: none; }
```

- [ ] **Step 7: Comportamento** — criar `src/sections/numeros/numeros.ts`:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { countFrame, parseValue } from '../../core/countup';
import { prefersReducedMotion } from '../../core/motion';
import { rangeLabel, trackShift, visibleRange } from './track';
import './numeros.css';

gsap.registerPlugin(ScrollTrigger);

function contar(card: HTMLElement): void {
  if (card.classList.contains('is-contado')) return;
  card.classList.add('is-contado');
  const el = card.querySelector<HTMLElement>('.card__valor');
  if (!el || el.hasAttribute('data-sem-contagem')) return;
  const alvo = parseValue(el.textContent ?? '0');
  const estado = { t: 0 };
  gsap.to(estado, { t: 1, duration: 1.2, ease: 'none', onUpdate: () => { el.textContent = countFrame(alvo, estado.t); } });
}

export function initNumeros(): void {
  if (prefersReducedMotion()) return;
  const section = document.querySelector<HTMLElement>('.numeros');
  const stage = section?.querySelector<HTMLElement>('.numeros__stage');
  const trilho = section?.querySelector<HTMLElement>('.numeros__trilho');
  const contador = section?.querySelector<HTMLElement>('.numeros__contador');
  if (!section || !stage || !trilho || !contador) return;
  const cards = Array.from(trilho.querySelectorAll<HTMLElement>('.card'));
  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  const perView = mobile ? 1 : 3;

  const render = (p: number) => {
    const visible = stage.clientWidth - 2 * parseFloat(getComputedStyle(stage).paddingLeft);
    gsap.set(trilho, { x: trackShift(p, trilho.scrollWidth, visible) });
    stage.style.setProperty('--nm-p', String(p));
    const [a, b] = visibleRange(p, cards.length, perView);
    contador.textContent = rangeLabel(a, b, cards.length);
    const limite = window.innerWidth * 0.6;
    cards.forEach((c) => { if (c.getBoundingClientRect().left < limite) contar(c); });
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: mobile ? '+=300%' : '+=250%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  });
}
```

- [ ] **Step 8: Ligar no `src/main.ts`:** importar `initNumeros` de `./sections/numeros/numeros` e chamá-lo logo depois de `initManifesto();`.

- [ ] **Step 9:** Run `npm test && npm run build`. Expected: PASS e build ok.

- [ ] **Step 10: Verificação no navegador** (desktop e celular). Conferir:
  1. A seção fica fixa e o trilho anda para a esquerda com a rolagem.
  2. O 4º cartão aparece cortado no início.
  3. Cada número conta uma vez ao entrar.
  4. O contador mostra "01–03 / 08" e termina em "06–08 / 08"; no celular, "08 / 08".
  5. O "DRS" fica riscado no fim.

  Comparar com a página "06 · Em números" do Figma.

- [ ] **Step 11: Commit:** `git add index.html src/main.ts src/sections/numeros && git commit -m "feat(numeros): trilho horizontal com contagem pt-BR"`

---

### Task 5: Legado

**Files:** Create `src/sections/legado/marks.ts`, `marks.test.ts`, `legado.ts`, `legado.css`; Modify `index.html`, `src/main.ts`

- [ ] **Step 1: Teste dos marcos (falha esperada)**

```ts
// src/sections/legado/marks.test.ts
import { describe, expect, it } from 'vitest';
import { CONSTRUTORES, PILOTOS, titleMarks } from './marks';

describe('titleMarks', () => {
  const m = titleMarks(2005, 2026, CONSTRUTORES, PILOTOS);
  it('um marco por ano, de 2005 a 2026', () => {
    expect(m).toHaveLength(22);
    expect(m[0].ano).toBe(2005);
    expect(m.at(-1)?.ano).toBe(2026);
  });
  it('posição vai de 0 a 1', () => {
    expect(m[0].x).toBe(0);
    expect(m.at(-1)?.x).toBe(1);
  });
  it('conta 6 títulos de construtores e 8 de pilotos', () => {
    expect(m.filter((a) => a.construtores)).toHaveLength(6);
    expect(m.filter((a) => a.pilotos)).toHaveLength(8);
  });
  it('2021 e 2024 têm só título de pilotos', () => {
    for (const ano of [2021, 2024]) {
      const a = m.find((x) => x.ano === ano);
      expect(a?.pilotos).toBe(true);
      expect(a?.construtores).toBe(false);
    }
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/sections/legado/marks.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implementação**

```ts
// src/sections/legado/marks.ts
export const CONSTRUTORES = [2010, 2011, 2012, 2013, 2022, 2023] as const;
export const PILOTOS = [2010, 2011, 2012, 2013, 2021, 2022, 2023, 2024] as const;

export interface Marco { ano: number; x: number; construtores: boolean; pilotos: boolean }

export function titleMarks(inicio: number, fim: number, construtores: readonly number[], pilotos: readonly number[]): Marco[] {
  const total = fim - inicio;
  return Array.from({ length: total + 1 }, (_, i) => {
    const ano = inicio + i;
    return { ano, x: i / total, construtores: construtores.includes(ano), pilotos: pilotos.includes(ano) };
  });
}
```

- [ ] **Step 4:** Run o teste. Expected: PASS (4 testes).

- [ ] **Step 5: Marcação** — em `index.html`, depois do comentário de Fase 5:

```html
      <section id="legado" class="secao legado" aria-labelledby="legado-titulo">
        <div class="legado__inner">
          <p class="kicker"><span class="kicker__rule" aria-hidden="true"></span>Legado</p>
          <h2 id="legado-titulo" class="legado__titulo">Construído por uma equipe.<br />Não por um nome.</h2>
          <p class="corpo legado__corpo">Desde a estreia em 2005, os títulos saíram do mesmo lugar: a fábrica de Milton Keynes. Em 2026, ela passa a fazer o carro e o motor.</p>
          <dl class="legado__numeros">
            <div><dt class="rotulo">títulos de construtores</dt><dd class="legado__valor" data-contar>6</dd></div>
            <div><dt class="rotulo">títulos de pilotos</dt><dd class="legado__valor" data-contar>8</dd></div>
            <div><dt class="rotulo">vitórias até o fim de 2025</dt><dd class="legado__valor" data-contar>130</dd></div>
            <div><dt class="rotulo">ano da estreia</dt><dd class="legado__valor">2005</dd></div>
          </dl>
          <figure class="legado__faixa">
            <svg class="legado__svg" role="img" aria-label="Títulos de construtores em 2010, 2011, 2012, 2013, 2022 e 2023; títulos de pilotos de 2010 a 2013 e de 2021 a 2024." viewBox="0 0 1000 110" preserveAspectRatio="none"></svg>
            <figcaption class="legado__legenda rotulo"><span class="legado__q" aria-hidden="true"></span>Título de construtores <span class="legado__c" aria-hidden="true"></span>Título de pilotos</figcaption>
          </figure>
        </div>
      </section>
```

- [ ] **Step 6: CSS** — criar `src/sections/legado/legado.css`:

```css
.legado { padding: 6rem var(--gutter) 4.5rem; background: radial-gradient(70% 90% at 50% 120%, rgba(11, 21, 56, 0.9), var(--c-bg) 70%); }
.legado__inner { display: grid; gap: 2.5rem; }
.legado__titulo { margin: 0; font: italic 800 clamp(2.9rem, 6.1vw, 5.5rem)/0.92 var(--f-display); text-transform: uppercase; }
.legado__corpo { max-width: 40rem; }
.legado__numeros { margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 15rem)); gap: 1.5rem 4rem; }
.legado__numeros div { display: flex; flex-direction: column-reverse; gap: 0.25rem; }
.legado__numeros dd { margin: 0; }
.legado__valor { font: italic 800 6rem/0.88 var(--f-display); font-variant-numeric: tabular-nums; }
.legado__svg { width: 100%; height: 7.5rem; overflow: visible; }
.legado__svg text { fill: var(--c-text-muted); font: 500 11px var(--f-body); }
.legado__marca { opacity: 0.15; transition: opacity 0.3s; }
.legado.is-visto .legado__marca { opacity: 1; transition-delay: calc(var(--i) * 60ms); }
.legado__legenda { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.5rem; margin-top: 1rem; }
.legado__q, .legado__c { display: inline-block; width: 10px; height: 10px; margin-right: 0.5rem; vertical-align: middle; }
.legado__q { background: var(--c-red); border-radius: 2px; }
.legado__c { background: var(--c-yellow); border-radius: 50%; }

@media (max-aspect-ratio: 1/1) {
  .legado { padding: 4.5rem var(--gutter) 3rem; }
  .legado__titulo { font-size: 2.95rem; }
  .legado__numeros { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
  .legado__valor { font-size: 4rem; }
  .legado__svg { height: 6rem; }
}

.reduced .legado__marca { opacity: 1; }
```

- [ ] **Step 7: Comportamento** — criar `src/sections/legado/legado.ts`:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { countFrame, parseValue } from '../../core/countup';
import { prefersReducedMotion } from '../../core/motion';
import { CONSTRUTORES, PILOTOS, titleMarks } from './marks';
import './legado.css';

gsap.registerPlugin(ScrollTrigger, SplitText);
const NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function desenharFaixa(svg: SVGSVGElement, mobile: boolean): void {
  const marcos = titleMarks(2005, 2026, CONSTRUTORES, PILOTOS);
  const meio = 56;
  svg.append(svgEl('line', { x1: 0, x2: 1000, y1: meio, y2: meio, stroke: 'rgba(255,255,255,0.25)' }));
  marcos.forEach((m, i) => {
    const x = m.x * 1000;
    svg.append(svgEl('line', { x1: x, x2: x, y1: meio - 4, y2: meio + 4, stroke: 'rgba(255,255,255,0.35)' }));
    const mostrar = !mobile || [2005, 2010, 2015, 2020, 2026].includes(m.ano);
    if (mostrar) {
      const t = svgEl('text', { x, y: meio + 26, 'text-anchor': 'middle' });
      t.textContent = mobile ? String(m.ano) : `’${String(m.ano).slice(2)}`;
      svg.append(t);
    }
    if (m.construtores) svg.append(svgEl('rect', { class: 'legado__marca', style: `--i:${i}`, x: x - 7, y: meio - 26, width: 14, height: 14, rx: 2, fill: '#d2003c' }));
    if (m.pilotos) svg.append(svgEl('circle', { class: 'legado__marca', style: `--i:${i}`, cx: x, cy: m.construtores ? meio - 38 : meio - 18, r: 6, fill: '#ffc906' }));
  });
}

export function initLegado(): void {
  const section = document.querySelector<HTMLElement>('.legado');
  const svg = section?.querySelector<SVGSVGElement>('.legado__svg');
  if (!section || !svg) return;
  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  desenharFaixa(svg, mobile);
  if (prefersReducedMotion()) return;

  const titulo = section.querySelector<HTMLElement>('.legado__titulo');
  const valores = Array.from(section.querySelectorAll<HTMLElement>('[data-contar]'));
  const alvos = valores.map((v) => parseValue(v.textContent ?? '0'));
  valores.forEach((v) => { v.textContent = '0'; v.setAttribute('aria-hidden', 'true'); });
  valores.forEach((v, i) => v.insertAdjacentHTML('afterend', `<span class="sr-only">${alvos[i].number}</span>`));

  ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    once: true,
    onEnter: () => {
      if (titulo) gsap.from(SplitText.create(titulo, { type: 'lines', mask: 'lines' }).lines, { yPercent: 100, duration: 0.8, stagger: 0.08, ease: 'power3.out' });
      valores.forEach((v, i) => {
        const estado = { t: 0 };
        gsap.to(estado, { t: 1, duration: 1.4, onUpdate: () => { v.textContent = countFrame(alvos[i], estado.t); } });
      });
      gsap.delayedCall(0.6, () => section.classList.add('is-visto'));
    },
  });
}
```

- [ ] **Step 8: Ligar no `src/main.ts`:** importar `initLegado` e chamá-lo depois de `initNumeros();`.
- [ ] **Step 9:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 10: Verificação no navegador.** Conferir:
  1. Ao entrar, o título sobe por linha.
  2. Os números contam de 0 a 6, 8 e 130, e "2005" não conta.
  3. Os marcos acendem da esquerda para a direita.
  4. Quadrado vermelho para construtores e círculo amarelo para pilotos, nos anos certos.
  5. No celular, a faixa mostra só os rótulos 2005, 2010, 2015, 2020 e 2026.

  Comparar com a página "08 · Legado" do Figma.
- [ ] **Step 11: Commit:** `git add index.html src/main.ts src/sections/legado && git commit -m "feat(legado): números da equipe e faixa de títulos"`

---

### Task 6: Fechamento e rodapé

**Files:** Create `src/sections/fechamento/mask.ts`, `mask.test.ts`, `fechamento.ts`, `fechamento.css`; Modify `index.html`, `src/main.ts`

- [ ] **Step 1: Teste da máscara (falha esperada)**

```ts
// src/sections/fechamento/mask.test.ts
import { describe, expect, it } from 'vitest';
import { REVEAL_AT, reverseFrame, titleScale } from './mask';

describe('reverseFrame', () => {
  it('toca a Hero de trás para a frente', () => {
    expect(reverseFrame(0, 240)).toBe(239);
    expect(reverseFrame(1, 240)).toBe(0);
    expect(reverseFrame(0.5, 240)).toBe(120);
  });
  it('limita o progresso', () => expect(reverseFrame(2, 240)).toBe(0));
});

describe('titleScale', () => {
  it('encolhe de 1,4 para 1 até REVEAL_AT e depois para', () => {
    expect(titleScale(0)).toBeCloseTo(1.4);
    expect(titleScale(REVEAL_AT)).toBeCloseTo(1);
    expect(titleScale(1)).toBeCloseTo(1);
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/sections/fechamento/mask.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implementação**

```ts
// src/sections/fechamento/mask.ts
/** A partir deste progresso o título está no tamanho final e entram texto e botões. */
export const REVEAL_AT = 0.7;
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

export function reverseFrame(progress: number, count: number): number {
  return Math.round((1 - clamp01(progress)) * (count - 1));
}

export function titleScale(progress: number): number {
  const t = Math.min(1, clamp01(progress) / REVEAL_AT);
  return 1.4 - 0.4 * t;
}
```

- [ ] **Step 4:** Run o teste. Expected: PASS (4 testes).

- [ ] **Step 5: Marcação.** Em `index.html`, depois da seção Legado e antes de `</main>`:

```html
      <section id="fechamento" class="secao fechamento" aria-labelledby="fechamento-titulo">
        <div class="fechamento__stage">
          <canvas class="fechamento__canvas" aria-hidden="true"></canvas>
          <h2 id="fechamento-titulo" class="fechamento__titulo">Te dá asas.</h2>
          <div class="fechamento__acoes">
            <p class="corpo">Um carro novo, um motor próprio e uma pintura que voltou a brilhar.</p>
            <div class="fechamento__botoes">
              <a class="btn btn--primario" data-link="estudo-de-caso" href="#fechamento">Ver estudo de caso</a>
              <button class="btn btn--secundario" type="button" data-topo>Voltar ao topo <span aria-hidden="true">↑</span></button>
            </div>
          </div>
        </div>
      </section>
```

Trocar o `<footer class="disclaimer">…</footer>` atual por:

```html
    <footer class="rodape">
      <div class="rodape__colunas">
        <div><h2 class="kicker">Projeto</h2><p>Projeto conceitual de portfólio. Não é afiliado, patrocinado nem endossado pela Red Bull GmbH, pela Oracle Red Bull Racing ou pela Ford. Marcas, nomes e logotipos pertencem aos seus donos.</p></div>
        <div><h2 class="kicker">Créditos</h2><p>Modelo 3D: “F1 2026 Concept” por Qvist_designs (Sketchfab), licença CC BY 4.0 — modificado: pintura, UV da asa dianteira, flaps móveis. Iluminação: “Studio Small 09” por Sergej Majboroda (Poly Haven, CC0). Motor DM01: representação esquemática própria. Fontes: Barlow Condensed e Inter (SIL OFL).</p></div>
        <div><h2 class="kicker">Dados</h2><p>Números de fontes públicas, conferidos em outubro de 2026. Valores marcados “aprox.” são aproximados; cores das pinturas antigas também.</p></div>
      </div>
      <div class="rodape__base"><p class="kicker">RB22 · 2026</p><p class="rotulo">Design e desenvolvimento: Matheus Reis</p></div>
    </footer>
```

- [ ] **Step 6: CSS** — criar `src/sections/fechamento/fechamento.css` e remover de `src/styles/hero.css` as regras `.next` e `.disclaimer`, que ficam órfãs:

```css
.fechamento__stage { position: relative; height: 100svh; display: grid; place-items: center; align-content: center; gap: 2.5rem; padding: 0 var(--gutter); overflow: hidden; }
.fechamento__canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.fechamento__titulo { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.fechamento__acoes { position: relative; display: grid; gap: 1.5rem; justify-items: center; text-align: center; margin-top: 34vh; opacity: 0; transform: translateY(16px); transition: opacity 0.5s var(--ease-out), transform 0.5s var(--ease-out); }
.fechamento.is-revelado .fechamento__acoes { opacity: 1; transform: none; }
.fechamento__botoes { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }

.rodape { padding: 3.5rem var(--gutter); border-top: 1px solid rgba(255, 255, 255, 0.15); display: grid; gap: 2rem; color: var(--c-text-muted); }
.rodape__colunas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; }
.rodape__colunas p { margin: 0.625rem 0 0; font-size: 0.8125rem; line-height: 1.5; }
.rodape__base { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.rodape__base p { margin: 0; }
.rodape .kicker { color: var(--c-yellow); }
.rodape__base .kicker { color: var(--c-text); }

@media (max-aspect-ratio: 1/1) {
  .fechamento__acoes { margin-top: 30vh; }
  .fechamento__botoes { flex-direction: column; align-items: center; }
  .rodape__colunas { grid-template-columns: 1fr; gap: 1.5rem; }
  .rodape__base { flex-direction: column; align-items: flex-start; }
}

.reduced .fechamento__acoes { opacity: 1; transform: none; }
```

- [ ] **Step 7: Comportamento** — criar `src/sections/fechamento/fechamento.ts`:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LINKS } from '../../config';
import { prefersReducedMotion } from '../../core/motion';
import { startSmoothScroll } from '../../core/scroll';
import { FrameStore, type FrameSet } from '../../hero/frames';
import { FRAME_COUNT } from '../../hero/scrub';
import { REVEAL_AT, reverseFrame, titleScale } from './mask';
import './fechamento.css';

gsap.registerPlugin(ScrollTrigger);
const QUADRO_ESTATICO = 159; // quadro 160 (faixas azuis), usado no movimento reduzido

function desenhar(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, escala: number, mobile: boolean): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, w, h);
  if (img) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    ctx.drawImage(img, (w - img.naturalWidth * s) / 2, (h - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
  }
  const base = mobile ? w * (128 / 390) : w * (230 / 1440);
  const tam = base * escala;
  ctx.font = `italic 800 ${tam}px "Barlow Condensed"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const linhas = mobile ? ['TE DÁ', 'ASAS.'] : ['TE DÁ ASAS.'];
  const y0 = h * 0.42 - ((linhas.length - 1) * tam * 0.86) / 2;
  ctx.globalCompositeOperation = 'destination-in';
  linhas.forEach((l, i) => ctx.fillText(l, w / 2, y0 + i * tam * 0.86));
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.5 * Math.min(window.devicePixelRatio || 1, 2);
  linhas.forEach((l, i) => ctx.strokeText(l, w / 2, y0 + i * tam * 0.86));
}

export async function initFechamento(): Promise<void> {
  const section = document.querySelector<HTMLElement>('.fechamento');
  const stage = section?.querySelector<HTMLElement>('.fechamento__stage');
  const canvas = section?.querySelector<HTMLCanvasElement>('.fechamento__canvas');
  const ctx = canvas?.getContext('2d');
  if (!section || !stage || !canvas || !ctx) return;

  section.querySelector<HTMLAnchorElement>('[data-link="estudo-de-caso"]')?.setAttribute('href', LINKS.estudoDeCaso);
  section.querySelector<HTMLButtonElement>('[data-topo]')?.addEventListener('click', () => {
    startSmoothScroll().scrollTo(0, { onComplete: () => document.querySelector<HTMLElement>('h1')?.focus() });
  });

  const mobile = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  const set: FrameSet = mobile ? 'mobile' : 'desktop';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ajustar = () => { canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr); };
  ajustar();
  await document.fonts.load('italic 800 100px "Barlow Condensed"');
  const store = new FrameStore(set);
  await store.load(() => {});

  if (prefersReducedMotion()) {
    const pintar = () => { ajustar(); desenhar(ctx, store.get(QUADRO_ESTATICO), 1, mobile); };
    pintar();
    window.addEventListener('resize', pintar);
    return;
  }

  const render = (p: number) => {
    desenhar(ctx, store.get(reverseFrame(p, FRAME_COUNT)), titleScale(p), mobile);
    section.classList.toggle('is-revelado', p >= REVEAL_AT);
  };
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=150%',
    pin: stage,
    scrub: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => { ajustar(); render(self.progress); },
  });
  render(0);
}
```

O `h1` da Hero precisa aceitar foco. Em `index.html`, adicionar `tabindex="-1"` ao `<h1 class="chapter__title">`.

- [ ] **Step 8: Ligar no `src/main.ts`:** importar `initFechamento` e chamar `await initFechamento();` depois de `initLegado();` e antes de `ScrollTrigger.refresh();`.
- [ ] **Step 9:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 10: Verificação no navegador.** Conferir:
  1. Na seção fixa, o vídeo da Hero toca invertido dentro de "TE DÁ ASAS.", com contorno claro.
  2. O título encolhe e, perto de 70%, entram o texto e os botões.
  3. "Voltar ao topo" leva ao início e põe o foco no título.
  4. O rodapé tem as 3 colunas e a linha final.

  Comparar com a página "09 · Fechamento e rodapé" do Figma (desktop e celular).
- [ ] **Step 11: Commit:** `git add index.html src/main.ts src/styles/hero.css src/sections/fechamento && git commit -m "feat(fechamento): título-máscara com o vídeo, ações e rodapé"`

---

### Task 7: Revisões obrigatórias da fase

- [ ] **Step 1: Acessibilidade.** Despachar o `accessibility-specialist` para auditar as 4 seções novas e o rodapé:
  - ordem de leitura;
  - `<h2>`/`<h3>`;
  - SplitText sem quebrar o nome acessível;
  - valores com `sr-only`;
  - foco dos botões;
  - contraste (inclusive "DM01" vermelho e os rótulos suaves);
  - movimento reduzido em cada seção.

  Corrigir os achados altos.
- [ ] **Step 2: Testes.** Despachar o `test-engineer` para revisar `countup`, `words`, `track`, `marks` e `mask`, acrescentando bordas pertinentes.
- [ ] **Step 3:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 4: Commit:** `git add -A && git commit -m "fix: ajustes de revisão da fase 3"`
