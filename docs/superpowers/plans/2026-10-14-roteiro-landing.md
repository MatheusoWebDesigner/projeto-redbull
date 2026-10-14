# Roteiro de implementação — Landing RB22

Design aprovado no Figma ("Projeto F1 RedBull", páginas 01–10) em 2026-10-14. Cada seção tem uma spec em `docs/superpowers/specs/`. O código foi liberado pelo usuário ("Tudo aprovado"). Branch: `feat/landing-completa`.

A landing tem vários subsistemas independentes, por isso o trabalho vai em fases, cada uma com **plano próprio**, escrito quando a fase começa. Toda fase termina funcionando e testada.

| Fase | Entrega | Depende de | Plano |
|---|---|---|---|
| 1 | Hero finalizada (ajustes do Figma, quadros em `public/`) e base compartilhada: rolagem suave única e formatação pt-BR | — | `2026-10-14-fase1-hero-e-base.md` |
| 2 | Pipeline 3D para a web: GLB do carro otimizado (decimado, textura assada, Draco/KTX2), flaps separados, GLB do DM01, HDRI | — (paralelo à Fase 1) | missão do `blender-3d-specialist` |
| 3 | Seções sem 3D: Manifesto, Em números, Legado, Fechamento e rodapé | 1 | escrito no início da fase |
| 4 | Seções com Three.js: Showroom 3D e Aerodinâmica ativa (mesmo canvas) | 1, 2 | escrito no início da fase |
| 5 | DM01 (Three.js) e Pintura (chips em CSS + renders) | 1, 2 | escrito no início da fase |
| 6 | Revisão final: acessibilidade completa, desempenho (Lighthouse), E2E com Playwright, dependências | 3, 4, 5 | escrito no início da fase |

## Regras que valem para todas as fases
- O Figma é a fonte da verdade. Na dúvida, abrir a página da seção e ler as anotações.
- TDD para lógica pura (mapeamentos de progresso, formatação, cálculos). Comportamento visual se verifica no navegador embutido, com screenshot.
- Quando uma mudança altera interface, entra o `accessibility-specialist`. Quando altera código, entra o `test-engineer`. Nova dependência (three.js, Playwright) passa pelo `appsec-engineer`.
- `prefers-reduced-motion` tem versão própria em todas as seções, conforme o Figma.
- Orçamento de rolagem com pin: Hero 400, Manifesto 150, Showroom 450, Aerodinâmica 300, DM01 300, Números 250, Pintura 350, Fechamento 150 (vh no desktop). No celular, os valores estão nas specs.
- Pendências conhecidas: o link de "Ver estudo de caso" ainda está a definir, e o nome no rodapé é "Matheus Reis".
