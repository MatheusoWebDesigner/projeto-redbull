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
Render próprio 9:16 (`camera_mobile`, mesmo arco): carro inteiro no terço de baixo, texto no terço de cima. O mesmo vídeo serve para o Reels.

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

## Em aberto
- Copy final dos capítulos.
- Aviso "projeto conceitual, não afiliado à Red Bull" (rodapé) e créditos do modelo (CC-BY).
