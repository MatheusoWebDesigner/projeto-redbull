# Showroom 3D — RB22 Landing (design)

Status: em validação com o usuário · 2026-10-08
Fonte da verdade: Figma "Projeto F1 RedBull", página **03 · Showroom 3D**. Ela traz:
- 6 paradas em desktop 1440×900 e em celular 390×844;
- os estados de carregamento e de movimento reduzido;
- a linha do tempo do scroll e o componente `hotspot`;
- as anotações.

## Objetivo
Mostrar o RB22 inteiro em 3D e passar pelas 5 peças que mais mudaram em 2026: a câmera percorre um trilho com o scroll, e o usuário pode arrastar para girar.

## Conteúdo (fatos conferidos em 2026-10-08)
| Parada | Texto | Dado |
|---|---|---|
| 00 Visão geral | Menor, mais leve e com asas que se mexem. | 3.400 mm entre-eixos (−200) · 1.900 mm largura (−100) |
| 01 Asa dianteira | 100 mm mais estreita; flap de dois elementos ativo (deita na reta, levanta na curva). | −100 mm |
| 02 Cockpit e halo | Estrutura frontal em dois estágios, mais proteção lateral, arco de capotamento testado a 20 G (antes 16 G). | 20 G |
| 03 Sidepods | Arrefecimento redesenhado para um sistema de bateria maior num carro menor. | 350 kW do MGU-K |
| 04 Assoalho | Parcialmente plano, difusor menos potente, menos efeito-solo; ~30% menos pressão aerodinâmica. | −30% |
| 05 Asa traseira ativa | Três elementos móveis; abre na reta, fecha na curva; substitui o DRS. | −55% arrasto |

## Comportamento
**Scroll e câmera**
- Pin de 450vh no desktop e 380vh no celular, com snap nas 6 paradas.
- A câmera segue um trilho CatmullRom em scrub, com `power2.inOut` entre as paradas. As poses estão em `showroom_cameras.json`; o shift vira `setViewOffset`.
- O texto troca por limiar de parada (toggle). As barras de progresso funcionam como `<nav>` de botões.

**Hotspots**
- São rótulos HTML projetados das âncoras 3D (empties `hotspot_*`) e somem quando a âncora sai do quadro ou fica oculta.
- O ativo fica em amarelo, com rótulo.
- Os inativos que caem na zona do texto ficam ocultos.
- Nenhum rótulo pode cobrir logo da pintura; se cobrir, o rótulo vira para o outro lado. A âncora da asa dianteira fica na ponta externa do flap.

**Arraste**
- Limite de ±25° na horizontal e ±10° na vertical.
- A câmera volta ao trilho em 0,6 s quando o scroll recomeça.
- No toque, só gira com gesto horizontal (`touch-action: pan-y`).

**Carregamento e fallback**
- O GLB carrega de forma preguiçosa, uma tela antes da seção.
- Até lá aparece o pôster `sr_00` com barra de progresso (`role="status"`).
- Sem WebGL ou em aparelho fraco, os renders `sr_00…05` trocam por parada (plano B).

**Movimento reduzido:** sem pin; a seção vira uma lista de artigos com os renders.

## Assets
Pasta-base: `D:\Projeto RedBull - Arquivos Brutos (Blender)\`.
- Renders: `07_quadros-para-figma\showroom\{desktop,mobile}\sr_00…sr_05.png`.
- Hotspots: `07_quadros-para-figma\showroom\hotspots.json`.
- Cena: `01_cenas-blender\showroom_v01.blend`, com a asa dianteira corrigida por UV próprio e a textura `livery_rb22_showroom_v01.png`.
- HDRI: Poly Haven "Studio Small 09" (CC0), versão escurecida.

## Pendências para a fase de código
- O GLB atual tem 1,15 M triângulos (alvo: 150–300 mil). É preciso decimar ou fazer LOD.
- As máscaras e os detalhes procedurais (bico amarelo, sol, carbono, jacquard) precisam virar bake em textura antes de exportar o glTF.
- O tamanho realista depois da otimização fica em torno de 2,5–4 MB (Draco + KTX2).
- Há um leve banding no fundo escuro e um granulado no assoalho perto do sidepod. Os dois podem ser refinados em uma v02 dos renders.
