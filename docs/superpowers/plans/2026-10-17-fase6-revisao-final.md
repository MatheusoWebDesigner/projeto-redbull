# Fase 6: Revisão final (plano)

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: superpowers:executing-plans. Passos com caixas de seleção (`- [ ]`).

**Objetivo:** fechar a landing RB22 para publicação:
- página inteira acessível;
- desempenho medido;
- testes de ponta a ponta automatizados;
- dependências e cabeçalhos de segurança revisados;
- endereços prontos para publicar em subcaminho;
- Figma sincronizado com o que foi implementado.

**Ponto de partida:**
- todas as seções existem (Hero, Manifesto, Showroom, Aero, DM01, Números, Pintura, Legado, Fechamento e rodapé);
- os 3 modos de cada seção já passaram por revisão de acessibilidade isolada;
- `npm test` passa, com cerca de 230 testes unitários.

---

### Task 1: Endereços prontos para subcaminho
Hoje o código usa caminhos absolutos: `/hero/...`, `/models/...`, `/env/...`, `/showroom/...`, `/aero/...`, `/dm01/...` e `/pintura/...`.

- [ ] Criar `src/core/url.ts` com `asset(caminho)`, que devolve `import.meta.env.BASE_URL + caminho sem a barra inicial`. Escrever o teste antes (TDD).
- [ ] Trocar os caminhos absolutos em TS por `asset(...)`. No `index.html`, usar caminhos relativos (sem a barra inicial), que o Vite reescreve no build.
- [ ] Validar com `npx vite build --base=/rb22/` + `npx vite preview --base=/rb22/`. Rodar `checks.mjs` (scratchpad/fase4) contra `http://localhost:4174/rb22/`: 3D carrega, plano B funciona e nenhuma requisição dá 404.
- [ ] Commit.

### Task 2: Acessibilidade da página inteira (`accessibility-specialist`)
Escopo: o que cruza seções e nenhuma revisão isolada cobriu.
- Landmarks (`main`, `footer`, `nav`) e esqueleto de títulos da página toda (h1 → h2 → h3).
- O skip link e a ordem de foco de ponta a ponta.
- Lighthouse Accessibility = 100 no desktop e no celular.
- Zoom de 400% rolando a página inteira.
- `prefers-reduced-motion` da página inteira.
- O comportamento do Lenis com teclado (Page Down, espaço, Home, End).

Os achados altos são corrigidos.

**Entregável extra:** um roteiro curto, para o usuário seguir, de teste manual com NVDA + Firefox (Windows) e VoiceOver + Safari (iPhone). As revisões apontaram itens que só um leitor de tela real confirma.

### Task 3: Desempenho (`performance-optimizer`)
- [ ] Lighthouse (`npx lighthouse@latest`, sem instalar no projeto) no `vite preview` do build, no celular e no desktop.
- Metas:
  - LCP < 2,5 s;
  - CLS < 0,1;
  - TBT < 300 ms;
  - JavaScript inicial (sem o 3D) < 200 KB gzip.
- Alvos de investigação:
  - quadros da Hero (pré-carregamento e tamanho);
  - fontes do Google (`font-display`, preconnect);
  - chunk do three (~263 KB gzip, que só carrega perto do Showroom);
  - o pin de 300vh de cada seção no celular;
  - fluidez da rolagem (sem quadros acima de 50 ms).
- [ ] Corrigir o que estiver fora da meta e medir de novo. Commit.

### Task 4: Testes de ponta a ponta (`qa-automation-engineer` + revisão do `appsec-engineer` na dependência nova)
- [ ] Instalar `@playwright/test` (devDependency, versão fixa) e só o navegador `chromium`. O `appsec-engineer` revisa a procedência e os scripts de instalação.
- [ ] Em `e2e/landing.spec.ts`:
  - página carrega sem erro no console;
  - cada seção aparece na ordem;
  - Showroom: as barras levam às paradas;
  - Aero: o seletor troca o modo sem mexer na rolagem;
  - DM01: as 4 etapas mostram os rótulos certos;
  - Pintura: o `nav` leva à era 2026 e o render aparece;
  - "Voltar ao topo" foca o h1;
  - `?plano-b` não baixa `rb22.glb`;
  - modo `reducedMotion: 'reduce'` sem pin e com todo o texto visível;
  - viewport de celular 390×844.
- [ ] Script `npm run e2e`. Commit.

### Task 5: Segurança de publicação (`appsec-engineer`)
- [ ] `npm audit` e conferência das versões travadas.
- [ ] Cabeçalhos recomendados para o servidor de publicação (a definir com o usuário), tomando como base a CSP da revisão da Fase 4:
  - `default-src 'self'`;
  - `script-src 'self' 'wasm-unsafe-eval'`;
  - `worker-src 'self' blob:`;
  - `connect-src 'self' blob:`;
  - `img-src 'self' data: blob:`;
  - `style-src 'self' https://fonts.googleapis.com`;
  - `font-src https://fonts.gstatic.com`;
  - `frame-ancestors 'none'`.
- [ ] Testar a CSP com uma `<meta>` provisória no preview: 3D, Draco e fontes funcionam, e não há violação no console.

### Task 6: Figma sincronizado
- [ ] Páginas 05 (DM01) e 07 (Pintura): anotar os ajustes de implementação e de acessibilidade, como já foi feito nas páginas 03 e 04.
- [ ] Página "10 · Página final": anotar a ordem real das seções e os pins usados.

### Task 7: Pendências do usuário (perguntar antes de fechar)
- Link real de "Ver estudo de caso" (hoje `#fechamento`).
- Nome no rodapé (hoje "Matheus Reis").
- Onde publicar (GitHub Pages, Vercel, Netlify...). Isso define o subcaminho da Task 1 e onde configurar os cabeçalhos da Task 5.

### Task 8: Fechamento
- [ ] `npm test && npm run e2e && npm run build`.
- [ ] Usar o superpowers:finishing-a-development-branch: o usuário escolhe entre merge na `main`, PR ou manter o branch.
