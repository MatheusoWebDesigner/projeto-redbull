# Legado — RB22 Landing (design)

Status: em validação com o usuário · 2026-10-14

**Fonte da verdade:** a página **08 · Legado** do Figma "Projeto F1 RedBull". Ela tem dois estados, entrada e final, em desktop e celular, com anotações.

## Conteúdo (fatos conferidos)
- **Título:** "Construído por uma equipe. Não por um nome."
- **Corpo:** "Desde a estreia em 2005, os títulos saíram do mesmo lugar: a fábrica de Milton Keynes. Em 2026, ela passa a fazer o carro e o motor."
- **Números:**

  | Valor | Rótulo |
  |---|---|
  | 6 | títulos de construtores (2010–2013, 2022, 2023) |
  | 8 | títulos de pilotos (2010–2013, 2021–2024) |
  | 130 | vitórias até o fim de 2025 |
  | 2005 | estreia |

- **Faixa de anos 2005–2026:**
  - quadrado vermelho para título de construtores;
  - círculo amarelo para título de pilotos.
- **Fica de fora:**
  - nomes e fotos de pilotos;
  - poles, porque as fontes divergem.

## Comportamento
- **Sem pin.** As animações disparam uma vez, quando a seção chega a 40% da tela:
  - o título sobe linha a linha;
  - os números contam do zero;
  - os marcos da faixa acendem da esquerda para a direita.
- **Acessibilidade:**
  - os números ficam numa `<dl>`;
  - a faixa é um SVG com `role="img"` e um `aria-label` que resume os anos;
  - construtores e pilotos se distinguem pela forma, não só pela cor.
- **Movimento reduzido:** mostra direto o estado final.
