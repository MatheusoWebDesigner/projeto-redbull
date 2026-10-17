# Fase 5: DM01 e Pintura (plano de implementação)

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:executing-plans ou superpowers:subagent-driven-development. Passos com caixas de seleção (`- [ ]`).

**Objetivo:** construir a seção **Red Bull Ford DM01**, com o motor em Three.js se desmontando em 4 estados, e a seção **Pintura**, com chips de cor em CSS e o render do RB22 no fim. As duas têm plano B e movimento reduzido conforme o Figma.

**Arquitetura:**
- **DM01:** tem canvas próprio, fixado no palco da seção. A lógica de estados é pura e testada (`estados.ts`, `cabos.ts`). A parte Three.js reaproveita a base extraída de `palco.ts` (`src/three/base.ts`).
- **Pintura:** é só DOM e CSS, com lógica pura de era e reflexo.
- **Trabalho em paralelo:**
  - a **Pintura** é delegada ao `frontend-specialist`, que mexe só nos seus arquivos e no bloco `#pintura` do `index.html`;
  - o **DM01** é feito na sessão principal;
  - a base compartilhada (assets, marcação do DM01 e ligações no `main.ts`) entra antes de despachar a Pintura.

**Fontes da verdade:**
- **Figma `M4LbG2oj3n7rGn3YesgOBV`, página "05 · Red Bull Ford DM01":**
  - desktop: `91:4`, `91:37`, `91:88`, `91:139`;
  - celular: `91:22`, `91:64`, `91:115`, `91:166`;
  - movimento reduzido: `100:20`;
  - linha do tempo: `92:20`;
  - componentes: `90:16` (rótulo) e `90:17` (barra 50/50).
- **Figma, página "07 · Pintura":**
  - desktop: `110:4`, `110:92`, `110:180`, `110:260`, `110:340`;
  - celular: `110:51`…`110:387`;
  - movimento reduzido: `111:110`;
  - linha do tempo: `111:182`;
  - componente amostra: `109:3`.
- **Specs:** `docs/superpowers/specs/2026-10-14-dm01-design.md` e `2026-10-14-pintura-design.md`.

**Pins:**

| Seção | Desktop | Celular | Snap |
|---|---|---|---|
| DM01 | 300vh | 240vh | 4 etapas |
| Pintura | 350vh | 280vh | 5 eras |

As duas seguem a regra de `PALCO_CABE` da Fase 4: abaixo dela, o conteúdo empilha.

---

## Linha do tempo do DM01 (progresso p do pin)

| p | Etapa | Estado do motor | Luz | Rótulos | Números |
|---|---|---|---|---|---|
| 0–0,25 | 0 "50% fogo. 50% faísca." | E0; giro de 0→8° em Y | neutra | ocultos | — |
| 0,25–0,5 | 1 "Fogo." | E0→E1 entre 0,25 e 0,35 | neutra, escape um pouco mais quente | V6 e Turbo (vermelhos) | contadores sobem ao entrar |
| 0,5–0,75 | 2 "Faísca." | E1→E2 entre 0,5 e 0,6 | neutra | + MGU-K, Eletrônica e Bateria (azuis) | contadores sobem ao entrar |
| 0,75–1 | 3 "Meio a meio." | E2→E3 entre 0,75 e 0,85 | âmbar no térmico e azul no elétrico, entre 0,75 e 0,85 | todos | barra 50/50 preenche entre 0,85 e 0,95; "+1.000 cv" conta ao completar |

Pontos de encaixe: `[0, 0.4, 0.65, 1]`.

---

## Tarefas

### Task 1: Assets e dados (sessão principal)
- [ ] Estender `scripts/importar-assets-3d.py`:
  - **Renders em WebP:**
    - `dm01/{desktop,mobile}/E0…E3.png` vão para `public/dm01/...`;
    - `pintura/{desktop,mobile}/brilho_a.png` e `brilho_b.png` vão para `public/pintura/...`.
  - **`src/data/dm01.json` a partir de `explosao.json` e `dm01_cameras.json`:**
    - deslocamentos `*_threejs` por peça e subpeça;
    - cabos com pontos e direções convertidos para o Three: `(x, y, z) → (x, z, −y)`;
    - grupos;
    - poses de câmera.
  - **Luzes e emissão por estado:** constantes copiadas de `05_scripts/dm01_comum_v01.py` (`LUZ` e `EMIS`), com posição, euler, tamanho e cor das 4 luzes de área de `dm01_v02.blend`.
- [ ] Rodar o script, conferir os tamanhos (cada WebP com no máximo 350 KB) e fazer o commit.

### Task 2: Marcação do DM01 e ligações (sessão principal, antes de despachar a Pintura)
- [ ] `index.html`: no lugar de `<!-- Fase 5: #dm01 entra aqui -->`, entra `<section id="dm01" class="secao dm01">`, com:
  - 4 artigos `.etapa-dm01`, com h3 e `<dl class="dados">`;
  - os rótulos visuais em `aria-hidden`;
  - `<dl class="dm01__pecas">` com as 5 peças, visível no movimento reduzido e `sr-only` no modo animado;
  - a barra 50/50;
  - o "+1.000 cv";
  - a nota "Representação esquemática · não é o desenho real do DM01";
  - a dica "Role para desmontar o motor";
  - o canvas e o render.
- [ ] Criar `src/sections/pintura/pintura.ts` com `export function initPintura(): void {}` e `pintura.css` vazio.
- [ ] `src/main.ts`:
  - `initDm01()` logo depois de `initPalco3D()`, na ordem do DOM (DM01 vem antes de Números);
  - `initPintura()` depois de `initNumeros()` (Pintura vem antes de Legado).
- [ ] Commit.

### Task 3: Pintura (delegada ao `frontend-specialist`, em paralelo)

A missão vai no despacho. Arquivos dela:
- `src/sections/pintura/*`, com lógica pura e testes TDD de `eraAtiva`, faixa de reflexo, crossfade do render e estado das barras;
- o bloco `#pintura` do `index.html`.

O que ela precisa entregar:
- pin, snap, chip em CSS com crossfade e faixa de reflexo;
- selo de acabamento sempre escrito;
- final com `brilho_a`/`brilho_b` em crossfade por scrub;
- `<nav>` com 5 botões e "Cores aproximadas";
- movimento reduzido conforme `111:110`, empilhamento quando não cabe e celular.

### Task 4: Direção das luzes de área (TDD, sessão principal)
- [ ] `src/three/convert.ts` ganha `alvoAreaBlender(pos, eulerGraus)`: o ponto a 1 m na direção −Z local rotacionado pelo euler XYZ, em eixos do Blender.
- [ ] Teste com casos conhecidos:
  - softbox `(0,0,0)` aponta para baixo;
  - `recorte_tras` do Showroom `(72.6, 0, 119.8)` dá a direção `(−0.828, −0.474, −0.299)`.

### Task 5: Estados e cabos do DM01 (TDD, sessão principal)
- [ ] `src/sections/dm01/estados.ts`:
  - `PONTOS_DM01`;
  - `etapaDm01(p)`;
  - `estadoContinuo(p)`, que devolve `{ de, para, t }` com t suavizado (power2.inOut) nas janelas da tabela;
  - `interpolarEstado(tabela, p)`, para vetores e números;
  - `giroGraus(p)`;
  - `barra5050(p)`;
  - `PROPORCAO_FOGO = 400/750`.
- [ ] `src/sections/dm01/cabos.ts`: `pontosBezier(p0, d0, p3, d3)` com alça `max(0.05, 0.42·L)`, a mesma regra de `dm01_comum_v01.py`.

### Task 6: Base Three compartilhada e palco do DM01 (sessão principal)
- [ ] Extrair de `src/three/palco.ts` para `src/three/base.ts`:
  - `criarRenderer`;
  - `carregarAmbiente` (HDR + PMREM);
  - `luzDeArea`, que recebe os dados do Blender;
  - `aplicarCamera`, com pose, órbita, `fitFov` e `viewOffset`.

  O comportamento do Showroom fica igual. Para conferir, rodar de novo `showroom.mjs` e `aero.mjs` no headless.
- [ ] `src/three/dm01Palco.ts`:
  - carrega `dm01.glb`;
  - guarda a posição base de cada peça;
  - aplica deslocamentos e giro;
  - recria os 5 cabos (`TubeGeometry` de `CubicBezierCurve3`, material `dm01_laranja_hv`);
  - aplica luzes e emissão interpoladas;
  - projeta âncoras;
  - desenha sob demanda, com `aoDesenhar`.

### Task 7: Seção DM01 (sessão principal)
- [ ] `src/sections/dm01/dm01.ts`:
  - pin, scrub e encaixe;
  - troca de texto e contadores (`countFrame`);
  - rótulos posicionados pelo Figma, com transição e linha guia SVG até a âncora projetada, desenhando de 0 a 100% em 0,4 s;
  - barra 50/50 e "+1.000 cv";
  - carregamento preguiçoso;
  - plano B com os renders E0–E3;
  - empilhamento.
- [ ] `src/sections/dm01/dm01.css`: desktop, celular, compacto (altura ≤ 45rem), reduzido e empilhado.
- [ ] Verificar no Chrome headless as 4 etapas, no desktop e no celular, comparando com os quadros do Figma; conferir o plano B e o reduzido.

### Task 8: Revisões obrigatórias
- [ ] `accessibility-specialist` (DM01 e Pintura) e `test-engineer` (módulos puros das duas), em paralelo.
- [ ] `npm test && npm run build` e commit.
