# Em números — RB22 Landing (design)

Status: em validação com o usuário · 2026-10-14

**Fonte da verdade:** página **06 · Em números** do Figma "Projeto F1 RedBull". Ela tem:
- 3 estados em desktop e em celular;
- o estado de movimento reduzido;
- a linha do tempo do scroll;
- o componente "cartão de número";
- as anotações.

## Objetivo
Resumir o carro em 8 números antes da seção Pintura. A seção é só tipográfica, sem 3D.

## Cartões
Todos os números já foram conferidos nas seções anteriores.

| # | Valor | Rótulo | Tema |
|---|---|---|---|
| 1 | 768 kg | Peso mínimo (−30 kg vs 2025) | chassi |
| 2 | 3.400 mm | Entre-eixos máximo (−200 mm) | chassi |
| 3 | 1.900 mm | Largura (−100 mm) | chassi |
| 4 | −55% | Arrasto (aprox.) | chassi |
| 5 | 350 kW | MGU-K (quase 3× os 120 kW) | energia |
| 6 | 8,5 MJ | Recuperados por volta (aprox.) | energia |
| 7 | 100% | Combustível sustentável | energia |
| 8 | 0 | DRS (trocado pela aerodinâmica ativa) | chassi |

## Comportamento
- **Pin:** 250vh no desktop e 300vh no celular. O scroll vertical move o trilho na horizontal, em scrub e sem snap.
- **Contagem:** cada valor conta do zero uma única vez, quando o cartão entra na tela.
- **Cartão 8:** em vez de contar, mostra "DRS" riscado.
- **Barra de progresso e contador:** ficam no topo e mostram o trecho visível, por exemplo "01–03 / 08".
- **Acessibilidade:** o trilho é uma `<ul>` e os valores finais já estão no HTML. A contagem é só visual.
- **Movimento reduzido:** os cartões ficam numa grade 4×2 (2 colunas no celular), sem pin.

## Tipografia nova
- `Números/Valor — desktop`: 108 px.
- `Números/Valor — mobile`: 80 px.
- `Números/Unidade`: 36 px.

Os três usam Barlow Condensed Italic.
