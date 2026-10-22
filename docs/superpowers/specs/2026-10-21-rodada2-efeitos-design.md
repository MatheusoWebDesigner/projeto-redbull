# Rodada 2 · Efeitos — design aprovado

Aprovado pelo usuário em 2026-10-21 ("tudo aprovado"). Fonte da verdade visual: Figma, página **"11 · Rodada 2 · Efeitos"** (`M4LbG2oj3n7rGn3YesgOBV`, página `165:737`), com anotações em cada tela.

Fora desta rodada: som do motor (recusado), pintura ao vivo no 3D (adiada).

## 1. Largada vermelho → verde

- Igual a hoje até 100%: uma luz vermelha a cada 20% do carregamento.
- O carregamento passa a contar **os quadros prioritários da Hero + os 39 quadros da abertura**.
- Em 100%: as 5 vermelhas seguram **450 ms** → viram **verdes** juntas (120 ms) e o rótulo muda para **"Largada!"** → seguram **400 ms** → o loader some (0,5 s, como hoje) enquanto a abertura começa por baixo.
- Licença criativa: na F1 real as luzes apagam. Aprovado assim pelo usuário.
- Cor nova `--c-luz-verde: #00db6b` (variável Figma `cor/luz-verde`). O brilho é a mesma sombra das vermelhas, recolorida.
- Acessibilidade: o rótulo tem `aria-live="polite"` e o "Largada!" é anunciado. O verde não depende só da cor, porque o texto também muda.

## 2. Abertura "câmera atravessa o carro"

- **Origem:** render do Blender `hero_v17_abertura.blend` (desktop) e `hero_v17_abertura_mobile.blend`. São 39 quadros (o 40º é o próprio quadro 1 da Hero), em `public/hero/abertura/{desktop,mobile}/a_###.{avif,webp}`, com as mesmas dimensões dos quadros da Hero.
- **Reprodução:** 30 fps desenhando no mesmo `<canvas>` da Hero; termina desenhando o quadro 1 da Hero, que é idêntico ao último da abertura (diferença máxima de 1/255).
- **Durante a abertura (~1,3 s):**
  - rolagem travada (`html.is-abertura { overflow: hidden }`);
  - capítulos, barras e telemetria ocultos.
- **No pouso:**
  - eles aparecem (fade de 0,4 s);
  - o capítulo 1 entra letra a letra (animação que já existe);
  - a rolagem suave liga e o pin da Hero é montado, como hoje.
- **Movimento reduzido:** sem abertura e sem baixar os quadros dela (fluxo atual do pôster).
- **Se algum quadro da abertura falhar:** desenha o carregado mais próximo; se nenhum carregou, pula direto para o quadro 1.

## 3. Fundo vivo

- Uma camada fixa `.fundo-vivo` com `pointer-events: none` e `aria-hidden`, abaixo do loader e acima das seções. As seções têm fundo opaco, por isso a camada fica por cima, com alfa baixo e sem `mix-blend-mode`.
- **Grão:** reaproveita `src/assets/grao-pintura.webp`, com opacidade ~5%, e pula de posição a 12 fps (`steps`, só `transform`).
- **Luz:** gradiente radial azul-racing no alto à direita, com alfa baixo. Com `--vel-abs` → 1, ela vira um rastro horizontal (escala X maior, Y menor).
- Só CSS. Nenhum contexto WebGL novo.
- **Movimento reduzido:** grão parado e luz fixa.

## 4. Velocidade nos títulos

- **Medidor único:** a velocidade do Lenis, normalizada para −1…1 e suavizada, gera `--vel` (com sinal) e `--vel-abs`.
- **Onde é escrito:** só na camada `.fundo-vivo` e nos títulos grandes. Nunca no `:root`, para não recalcular o estilo da página inteira a cada quadro.
- **Títulos:** `.titulo-secao`, `.parada__titulo`, `.etapa__titulo`, `.etapa-dm01__titulo`, `.era__titulo` e `.legado__titulo`. Recebem `skewX(var(--vel) × −8°)` e `scaleX(1 + var(--vel-abs) × 0,04)`, com `transform-origin` à esquerda.
- **Fora:** os títulos da Hero, que já têm a animação letra a letra.
- **Linhas de velocidade:** 7 linhas finas dentro de `.fundo-vivo`, com opacidade proporcional a `--vel-abs`.
- **Ritmo:** só escreve quando a mudança passa de 0,002, e volta exatamente a 0 quando a rolagem para.
- **Movimento reduzido:** desligado (o medidor nem liga).

## 5. Faixas diagonais

- **Onde:** só em 2 pontos, na entrada do `#dm01` e do `#pintura`.
- **Forma:** uma camada fixa `.faixas-transicao` (`aria-hidden`), com um grupo girado −20°: faixa amarela fina, vermelha larga e uma faixa da cor do fundo.
- **Movimento:**
  - ScrollTrigger com scrub de `top bottom` até `top top` da seção;
  - o grupo atravessa da esquerda para a direita;
  - fica invisível fora desse trecho.
- **Movimento reduzido:** sem faixas.

## 6. Cursor próprio no Showroom

- **Já existe:** o arraste que gira o carro (`orbit.ts`, até ±25° e ±10°, volta à pose quando a rolagem anda). Nada muda nele.
- **Novo:** com `pointer: fine` e o 3D ativo, o cursor sobre o palco vira um anel de 88 px com "ARRASTE PARA GIRAR".
  - segue o mouse com atraso (lerp 0,2);
  - some sobre `button`, `a` e `.hotspot`, onde volta o cursor normal;
  - com `.is-arrastando`, encolhe para 56 px, fica vermelho e o texto vira "← GIRANDO →";
  - é `aria-hidden`.
- **Movimento reduzido e celular:** sem anel.

## 7. Correção: dica do Em números

- `.numeros__dica` sai do rodapé absoluto (encostava nos cartões) e vai para logo abaixo do subtítulo, no fluxo.
- Continua oculta sem pin, como hoje.

## Qualidade

- **Desempenho:** sem regressão no Lighthouse (celular 93 e LCP 2,7 s; desktop 98). A abertura acrescenta ~0,27 MB em AVIF.
- **Testes de unidade:** toda lógica nova (combinação do progresso, quadro da abertura no tempo, nível de velocidade e suavização, posição das faixas).
- **E2E:**
  - a largada fica verde antes de o loader sair;
  - a abertura termina com o capítulo 1 ativo;
  - o resto da suíte continua verde.
- **Revisão de acessibilidade** do especialista antes do commit.
