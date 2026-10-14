# Hero — RB22 Landing (design)

Status: em validação com o usuário · 2026-10-07

## Objetivo
Primeira seção da landing conceitual do RB22 (portfólio + Reels). Mostrar o **carro e a marca**, não o piloto.
O vídeo de fundo avança e volta conforme a rolagem; o texto troca na coluna esquerda e nunca cobre o carro.

## Conteúdo visual (Blender)
- Cena: túnel escuro com faixas de luz, piso molhado. Carro: modelo F1 2026 (Qvist_designs, CC-BY 4.0) com pintura Red Bull 2026 aplicada por shader.
- Arquivos: `D:\Projeto RedBull - Arquivos Brutos (Blender)\01_cenas-blender\hero_v10.blend` (atual) e scripts em `05_scripts\`.
- Animação: 240 quadros (8 s a 30 fps). Câmera em arco frente → lateral → traseira; cenário anda para trás (arranque suave); rodas giram pela distância; faixas do teto acendem no início; motion blur.
- Terço esquerdo do quadro sempre livre para o texto.

## Capítulos de texto (rascunho de copy) e evento visual de cada um (v11)
| Quadros | Título | Apoio | Evento no vídeo |
|---|---|---|---|
| 1–60 | Uma nova era. | 2026 reescreve a Fórmula 1: carro novo, regras novas, motor novo. | Túnel escuro; as faixas acendem em onda a partir do carro |
| 60–120 | Feito em casa. | Red Bull Ford DM01 — o primeiro power unit da história da Red Bull. | Luz de chuva traseira pulsa |
| 120–180 | 50% elétrico. | 400 kW do V6 + 350 kW do MGU-K. Metade da força vem da bateria. | Faixas viram azul-elétrico e voltam ao branco |
| 180–240 | RB22. | Mais leve, mais curto, mais esperto. Role para conhecer. | Câmera desacelera e pousa na traseira |

Faixas verticais nas paredes reforçam a sensação de velocidade (paralaxe).

## Celular (decidido 2026-10-07)
Render próprio **9:19,5** (1080×2340, `camera_mobile` do `hero_v16d.blend`, mesmo arco; v16d = v16c com `luz_chave` excluída do piso por light linking, para tirar o reflexo branco no chão perto da câmera — o desktop segue renderizado do v16c): carro inteiro com margem ≥ 6% de cada lado, texto no terço de cima. WebP 720×1560 em `assets/hero/frames/mobile/`. (O 9:16 inicial cortava as laterais em celulares atuais.) Para o Reels, recortar 9:16 do centro.

## Interações da página (decidido 2026-10-07)
- Carregamento = largada de F1: 5 luzes vermelhas acendem conforme os quadros carregam; "lights out" revela a Hero.
- Telemetria no canto inferior direito (km/h e rpm ilustrativos) acompanhando o scroll.
- Encaixe suave por capítulo (snap) + entrada do texto letra a letra (SplitText).

## Implementação web
- Stack: Vite + TypeScript, GSAP (ScrollTrigger + SplitText), Lenis para rolagem suave. Three.js entra nas seções seguintes.
- Vídeo → **sequência de quadros** desenhada em `<canvas>` (avanço e retorno lisos; MP4 não garante scrub quadro a quadro).
- Seção fixada (pin) por ~400vh; progresso do scroll → índice do quadro.
- Assets web: WebP 1280 px de largura (~50 KB/quadro, ~12 MB total) com carregamento progressivo (1 a cada 4 quadros primeiro, depois o resto). Renders brutos em PNG ficam no D:, só o WebP entra no projeto.
- Degradê escuro à esquerda para contraste AA do texto.

## Acessibilidade
- Título real em `<h1>`; capítulos como texto no DOM (não dentro do canvas), lidos em ordem.
- `prefers-reduced-motion`: sem scrub — mostra um quadro estático (o do capítulo 4) e os 4 textos empilhados.
- Contraste do texto ≥ 4.5:1 sobre o degradê; foco visível; nada depende só de cor.

## Fonte da verdade: Figma (decidido 2026-10-08)
O design final da Hero, com anotações de scroll/animação/interação/acessibilidade, está no Figma ("Projeto F1 RedBull", página **01 · Hero**: telas desktop 1440×900 e celular 390×844, movimento reduzido e o quadro "Linha do tempo do scroll"). O código só é retomado após o usuário aprovar ("Jarvis, tudo aprovado").
Ajustes nascidos no Figma que o código (já iniciado em `src/`) precisa incorporar:
- Degradê escuro na base (0 → 82%) para telemetria e barras sobre o reflexo claro do chão.
- No celular, as barras de progresso ficam no topo (acima do capítulo).
- No celular, degradê superior de contraste: fundo a 92% → 86% (30% da altura) → 40% (42%) → 0 (55%). Cobre o texto contra as faixas de luz do teto sem escurecer o carro (57–69% da altura).
- Números da telemetria no formato pt-BR (13.200 rpm).

## Em aberto
- Copy final dos capítulos.
- Aviso "projeto conceitual, não afiliado à Red Bull" (rodapé) e créditos do modelo (CC-BY).
