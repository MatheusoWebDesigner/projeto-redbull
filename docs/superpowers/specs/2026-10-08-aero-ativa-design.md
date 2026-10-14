# Aerodinâmica ativa — RB22 Landing (design)

Status: em validação com o usuário · 2026-10-08
Fonte da verdade: a página **04 · Aerodinâmica ativa** do Figma "Projeto F1 RedBull". Ela reúne:
- 4 etapas em desktop e em celular;
- a tela de movimento reduzido;
- a linha do tempo do scroll;
- os componentes "seletor de modo" e "cartão de modo";
- as anotações.

## Objetivo
Explicar a troca do DRS pela aerodinâmica ativa de 2026, mostrando as asas mudarem de ângulo entre o **modo curva** (padrão, mais pressão aerodinâmica) e o **modo reta** (menos arrasto).

## Fatos (conferidos em 2026-10-08)
- O modo reta substitui o DRS e vale nas zonas de ativação definidas pela FIA.
- Vale para qualquer piloto, sem a regra de 1 segundo.
- As asas dianteira e traseira se movem juntas.
- As fontes divergem sobre a volta ao modo curva ser automática na freada ou manual, por isso o texto diz apenas "antes da curva".
- O modo ultrapassagem é outra ferramenta: energia elétrica extra para quem está a menos de 1 s.
- Os ângulos de giro são ilustrativos, porque não há números oficiais. Os medidores de pressão e de arrasto são qualitativos (ALTA/BAIXA).

## Etapas (pin de 300vh no desktop, 240vh no celular, snap em 4 etapas)
1. **Asa traseira em 3/4, modo curva:** "Duas asas. Duas personalidades." e o cartão do modo curva.
2. **Asa traseira em 3/4, modo reta:** os flaps giram por scrub e o cartão troca, com aria-live.
3. **Perfil (corte da seção central):** "Mesma asa, outro ângulo." Mostra a corda tracejada da pose curva, a corda amarela da pose reta e o arco "≈ 30° · ilustrativo". Os flaps alternam em loop lento.
4. **Asa dianteira:** "As duas juntas." e a nota sobre o modo ultrapassagem.

O seletor `role="radiogroup"` anima as duas asas em 0,6 s sem mexer na rolagem.

## Assets
Os caminhos abaixo partem de `D:\Projeto RedBull - Arquivos Brutos (Blender)\`.

- **Cena:** `01_cenas-blender\aero_v01.blend`. Os flaps ficam em objetos separados (`aero_tras_flap1/2` e `aero_diant_flap1/2`). Um shape key define a pose reta, e todos os flaps são controlados por `scene["aero_modo"]`.
- **Giro na pose reta:**

  | Asa | Flap | Giro | Dobradiça |
  |---|---|---|---|
  | Traseira | 1 | 15° | 12% da corda |
  | Traseira | 2 | 30° | 12% da corda |
  | Dianteira | 1 | 12° | 88% da corda |
  | Dianteira | 2 | 15° | 88% da corda |

- **Renders:** `07_quadros-para-figma\aero\{desktop,mobile}\{A,B,C}_{curva,reta}.png`.
- **Pontos de perfil:** `07_quadros-para-figma\aero\perfil.json`.
- **Câmeras:** `07_quadros-para-figma\aero\aero_cameras.json`.

## Pendências para a fase de código
- Na pose reta, o flap 1 dianteiro invade 1,5 mm a placa lateral. Isso não aparece nos renders, mas é preciso corrigir no GLB (reduzir para cerca de 10° ou ajustar a placa).
- No corte B, os flaps de carbono têm contraste baixo sobre o fundo. A linha tracejada resolve no layout; um material mais claro só para a vista em corte é opcional.
