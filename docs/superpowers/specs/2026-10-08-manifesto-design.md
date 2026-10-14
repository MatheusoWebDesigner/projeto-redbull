# Manifesto — RB22 Landing (design)

Status: em validação com o usuário · 2026-10-08
Fonte da verdade: Figma "Projeto F1 RedBull", página **02 · Manifesto** (telas desktop 1440×900 e celular 390×844 em 3 estados, movimento reduzido e linha do tempo do scroll, com anotações).

## Objetivo
Ponte entre a Hero (vídeo) e o Showroom 3D. Uma frase só, tipográfica, que conta por que 2026 é diferente para a Red Bull: carro e motor feitos em casa, e o motor com o nome do fundador.

## Copy
- Kicker (`<h2>`): MANIFESTO
- Frase (`<p>`): "Pela primeira vez, a Red Bull faz o carro e o motor. Os dois nascem sob o mesmo teto, em Milton Keynes. E o motor leva as iniciais do fundador que deu o sinal verde: DM01, de Dietrich Mateschitz."
- Assinatura: "Red Bull Ford Powertrains · Milton Keynes · 2026" + "Parceria técnica com a Ford: bateria, motor elétrico e software de controle."
- Fatos conferidos (2026-10-08): DM01 homenageia Dietrich Mateschitz, nome anunciado no lançamento em Detroit; primeiro power unit próprio da Red Bull; carro e motor no mesmo campus em Milton Keynes; a Ford contribui com bateria, motor elétrico e software de controle. O "sonho de 2005" do esboço foi descartado por não ter fonte.

## Visual
- Fundo `cor/fundo`; frase em `Manifesto/Declaração` (Barlow Condensed ExtraBold Italic, caixa alta, 68 px desktop / 38 px celular); "DM01" em `cor/vermelho`.
- Marca d'água "DM01" só com contorno (canto inferior direito, `aria-hidden`).
- Brilho azul radial (`cor/azul-racing` → `cor/azul-marinho`) no canto inferior direito, que continua no Showroom 3D.

## Scroll e animação
- Pin 150vh no desktop / 120vh no celular, logo após a Hero; sem snap.
- 0–80%: palavras acendem em scrub, opacidade 0,2 → 1, em ordem (SplitText por palavra). No Figma as apagadas usam a cor equivalente #363740; no código, opacidade.
- Brilho azul 0 → 1 e marca d'água deslizando −80 px (contorno 5% → 14%) ao longo da seção.
- 85–100%: assinatura entra uma vez (toggle): opacidade 0 → 1, y 12 → 0, 0,5 s power2.out.

## Acessibilidade
- Frase inteira no DOM; o efeito por palavra é só visual.
- Contraste no estado final: branco ≈ 19:1; DM01 vermelho ≈ 3,7:1 (texto grande e negrito).
- `prefers-reduced-motion`: sem pin e sem scrub, mostra o estado final estático.
