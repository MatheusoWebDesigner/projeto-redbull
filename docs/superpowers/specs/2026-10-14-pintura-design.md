# Pintura — RB22 Landing (design)

Status: em validação com o usuário · 2026-10-14

**Fonte da verdade:** página **07 · Pintura** do Figma "Projeto F1 RedBull". Ela reúne:
- 5 eras em desktop e celular;
- a versão de movimento reduzido;
- a linha do tempo do scroll;
- o componente "amostra de cor";
- as anotações.

## Decisão
A seção não usa fotos dos carros antigos, porque elas têm direitos de imagem e muitas mostram piloto. A história é contada por **chips de pintura**: um "chip" grande na cor-base de cada era, com acabamento brilhante (faixa de reflexo) ou fosco (luz difusa). Ao lado ficam as amostras de cor com código aproximado, com a nota "Cores aproximadas" visível. Na última era, o chip vira um render próprio do RB22 de perfil, com reflexo ao longo da carroceria (`07_quadros-para-figma/pintura/{desktop,mobile}/brilho_a.png` e `brilho_b.png`, cena `pintura_brilho_v01.blend`).

## Eras (fatos conferidos)
| Era | Título | Acabamento | Cores aproximadas |
|---|---|---|---|
| 2005 · RB1 | A estreia. | brilhante | azul-marinho #102154, prata #A7ADB5, vermelho #D2003C, amarelo #FFC906 |
| 2010–2013 · RB6 → RB9 | Os anos dos títulos. | brilhante | azul-escuro #14204A, amarelo #FFCC00, vermelho #D2003C, roxo #5E2A84 |
| 2016 · RB12 | O fosco. | fosco | azul #1B2A6B, vermelho #DB0A40, amarelo #FFD000 |
| 2023 · RB19 | A assinatura. | fosco | azul-marinho #121F45, vermelho #CC1E4A, amarelo #FFCC00 |
| 2026 · RB22 | O brilho voltou. | brilhante | azul racing #153380, azul brilho #2C55C9, vermelho #D2003C, amarelo #FFC906 |

Não citamos a "base branca" do RB22, porque as fontes divergem.

## Comportamento
- **Pin e snap:** a seção fica fixa por 350vh no desktop e 280vh no celular, com snap nas 5 eras.
- **Chip:**
  - A cor-base troca em crossfade a cada era.
  - Nas eras brilhantes, uma faixa de reflexo desliza junto com a rolagem.
  - No fosco, o reflexo some.
- **Final:** o chip cresce e vira o render de perfil do RB22; o brilho "passa" pela carroceria com crossfade em scrub entre `brilho_a` e `brilho_b`.
- **Implementação:** o chip é feito em CSS, com gradientes animados.
- **Linha do tempo inferior:** é um `<nav>` com 5 botões.
- **Acessibilidade:** o acabamento aparece sempre escrito no selo.
- **Movimento reduzido:** as eras aparecem empilhadas e paradas.
