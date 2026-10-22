import { expect, test } from '@playwright/test';
import { Landing, SECOES } from './landing.page';

const PECAS_TERMICAS = ['turbo', 'v6'];
const TODAS_AS_PECAS = ['bateria', 'eletronica', 'mgu-k', 'turbo', 'v6'];

test.describe('Landing RB22', () => {
  let landing: Landing;

  test.beforeEach(async ({ page }) => {
    landing = new Landing(page);
  });

  test('carrega a página inteira, com o 3D, sem erro no console', async () => {
    await landing.abrir();
    await landing.percorrer();
    await expect(landing.page.locator('.palco3d')).toHaveClass(/\bis-3d\b/, { timeout: 45_000 });
    await expect(landing.page.locator('#dm01')).toHaveClass(/\bis-3d\b/, { timeout: 45_000 });
    expect(landing.requisicoesDe('rb22.glb')).toHaveLength(1);
    expect(landing.requisicoesDe('dm01.glb')).toHaveLength(1);
    await landing.page.waitForLoadState('networkidle');
    expect(landing.erros).toEqual([]);
  });

  test('as seções aparecem na ordem do roteiro', async () => {
    await landing.abrir();
    const tops: number[] = [];
    for (const s of SECOES) {
      await expect(landing.page.locator(s)).toHaveCount(1);
      tops.push(await landing.topoDe(s));
    }
    // .palco3d começa junto com o #showroom (é o primeiro filho); o resto desce estritamente.
    for (let i = 1; i < tops.length; i++) {
      if (SECOES[i] === '#showroom') expect(tops[i], `${SECOES[i]} depois de ${SECOES[i - 1]}`).toBeGreaterThanOrEqual(tops[i - 1]);
      else expect(tops[i], `${SECOES[i]} depois de ${SECOES[i - 1]}`).toBeGreaterThan(tops[i - 1]);
    }
    await expect(landing.page.locator('.palco3d #showroom + #aero, .palco3d #showroom ~ #aero')).toHaveCount(1);
  });

  test('largada: as luzes ficam verdes antes de o loader sair e a abertura pousa no capítulo 1', async ({ page }) => {
    await page.goto('/');
    // O verde dura 400 ms antes de o loader sair: confere a cada quadro, para não perder a janela.
    await page.waitForFunction(() => document.querySelector('.loader__lights')!.classList.contains('is-verde')
      && !document.querySelector('.loader')!.classList.contains('is-done'), null, { polling: 'raf', timeout: 30_000 });
    await expect(page.locator('.loader__label')).toHaveText('Largada!');
    await expect(page.locator('.loader')).toHaveClass(/\bis-done\b/);
    await expect(page.locator('html')).not.toHaveClass(/\bis-abertura\b/, { timeout: 5_000 });
    await expect(page.locator('.chapter[data-chapter="0"]')).toHaveClass(/\bis-active\b/);
    expect(landing.requisicoes.filter((u) => u.includes('/hero/abertura/')).length).toBeGreaterThan(0);
  });

  test('"Reduzir movimento" do rodapé recarrega sem pins e "Ativar movimento" volta', async ({ page }) => {
    await landing.abrir();
    const botao = page.locator('footer [data-alternar-movimento]');
    await expect(botao).toHaveText('Reduzir movimento');
    await botao.click();
    await expect(page.locator('html')).toHaveClass(/\breduced\b/, { timeout: 30_000 });
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(botao).toHaveText('Ativar movimento');
    await expect(page.locator('.loader [data-alternar-movimento]')).toBeHidden();
    await botao.click();
    await expect(page.locator('.pin-spacer .fechamento__stage')).toBeAttached({ timeout: 30_000 });
    await expect(page.locator('html')).not.toHaveClass(/\breduced\b/);
  });

  test('Showroom: as barras levam às paradas', async () => {
    // Sem o 3D: no WebGL por software do headless cada quadro com a câmera em movimento leva ~1,4 s, e um quadro
    // acima de 200 ms dispara o encaixe no meio do lenis.scrollTo (bug documentado no teste "corrida" abaixo).
    // Aqui se testa só a navegação das barras, que é a mesma com ou sem 3D.
    await landing.abrir('?plano-b');
    await landing.rolarPara(await landing.topoDe('#showroom'));
    await expect(landing.paradaAtiva).toHaveAttribute('data-parada', '0');
    await expect(landing.barrasAtuais).toHaveCount(0);

    // Ida (1 → 5) e volta para uma parada anterior (2). Entre um clique e outro a rolagem assenta por 600 ms:
    // um clique logo depois de chegar (200–450 ms) cai na corrida do encaixe (ver o teste "corrida").
    for (const i of [1, 2, 3, 4, 5, 2]) {
      await landing.barraShowroom(i).click();
      await expect(landing.paradaAtiva).toHaveAttribute('data-parada', String(i));
      await expect(landing.barrasAtuais).toHaveCount(1);
      await expect(landing.barraShowroom(i)).toHaveAttribute('aria-current', 'step');
      // Depois de assentar (incluindo o encaixe), continua na mesma parada.
      await landing.esperarRolagemParar();
      await expect(landing.paradaAtiva).toHaveAttribute('data-parada', String(i));
    }
  });

  test('corrida: um quadro longo no meio da navegação das barras não pode cancelá-la', async () => {
    // Regressão do bug achado na Fase 6 (Task 4): o `scrollEnd` do ScrollTrigger pode sair no primeiro quadro de um
    // lenis.scrollTo, ou depois de um quadro > 200 ms, com o progresso antigo, e o encaixe mandava a página de volta.
    // Corrigido em src/core/encaixe.ts (ignora enquanto o Lenis anima e usa a posição atual). Reproduz o quadro longo.
    await landing.abrir('?plano-b');
    await landing.rolarPara(await landing.topoDe('#showroom'));
    await expect(landing.paradaAtiva).toHaveAttribute('data-parada', '0');
    await landing.page.evaluate(() => {
      document.querySelector<HTMLButtonElement>('.showroom__barras button[data-ir="2"]')!.click();
      // Dois quadros depois do clique, um quadro de 400 ms (o que o WebGL por software faz em todo quadro).
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const inicio = performance.now();
        while (performance.now() - inicio < 400) { /* quadro longo */ }
      }));
    });
    await expect(landing.paradaAtiva).toHaveAttribute('data-parada', '2', { timeout: 5_000 });
  });

  test('Aero: o seletor troca o modo sem mexer na rolagem', async () => {
    await landing.abrir();
    await landing.rolarPara(await landing.topoDe('#aero'));
    const curva = landing.modoAero('Modo curva');
    const reta = landing.modoAero('Modo reta');
    await expect(curva).toHaveAttribute('aria-checked', 'true');
    await expect(landing.cartaoModo).toHaveAttribute('data-modo', 'curva');
    const y = await landing.scrollY();

    await reta.click();
    await expect(reta).toHaveAttribute('aria-checked', 'true');
    await expect(curva).toHaveAttribute('aria-checked', 'false');
    await expect(landing.cartaoModo).toHaveAttribute('data-modo', 'reta');
    await expect(landing.cartaoModo).toContainText('Modo reta');
    expect(await landing.esperarRolagemParar()).toBe(y);

    await curva.click();
    await expect(curva).toHaveAttribute('aria-checked', 'true');
    await expect(reta).toHaveAttribute('aria-checked', 'false');
    await expect(landing.cartaoModo).toHaveAttribute('data-modo', 'curva');
    await expect(landing.cartaoModo).toContainText('Modo curva');
    expect(await landing.esperarRolagemParar()).toBe(y);
  });

  test('DM01: as 4 etapas mostram os rótulos certos', async ({}, testInfo) => {
    await landing.abrir();
    const pin = await landing.pinDe('#dm01', '.dm01__stage');
    expect(pin.temSpacer).toBe(true);
    const fator = testInfo.project.name === 'celular' ? 2.4 : 3;
    expect(pin.duracao).toBeCloseTo(fator * pin.alturaTela, 0);

    const etapas = [
      { p: 0, etapa: 0, rotulos: [] as string[] },
      { p: 0.4, etapa: 1, rotulos: PECAS_TERMICAS },
      { p: 0.65, etapa: 2, rotulos: TODAS_AS_PECAS },
      { p: 1, etapa: 3, rotulos: TODAS_AS_PECAS },
      { p: 0.4, etapa: 1, rotulos: PECAS_TERMICAS }, // na volta os elétricos somem
      { p: 0, etapa: 0, rotulos: [] as string[] },
    ];
    for (const { p, etapa, rotulos } of etapas) {
      await test.step(`p = ${p} → etapa ${etapa}`, async () => {
        await landing.rolarPara(pin.inicio + p * pin.duracao);
        await expect(landing.etapaDm01Ativa).toHaveAttribute('data-etapa', String(etapa));
        await expect.poll(() => landing.rotulosVisiveis()).toEqual(rotulos);
      });
    }
  });

  test('Pintura: o nav leva à era 2026 e o render aparece', async () => {
    await landing.abrir();
    await landing.rolarPara(await landing.topoDe('#pintura'));
    await expect(landing.eraAtiva).toHaveAttribute('data-era', '0');
    expect(await landing.opacidade('.pintura__render[data-brilho="a"]')).toBe(0);

    const botao = landing.botaoEra('2026 RB22');
    await botao.click();
    await expect(landing.eraAtiva).toHaveAttribute('data-era', '4');
    await expect(botao).toHaveAttribute('aria-current', 'step');
    await expect.poll(() => landing.opacidade('.pintura__render[data-brilho="a"]')).toBeGreaterThan(0.99);
    await landing.esperarRolagemParar();
    await expect(landing.eraAtiva).toHaveAttribute('data-era', '4');
  });

  test('Fechamento: "Voltar ao topo" sobe até o início e foca o h1', async () => {
    // Sem o 3D pelo mesmo motivo do Showroom: com ele carregado, a subida passa pelo DM01 com quadros longos e
    // o encaixe do DM01 sequestra a rolagem (bug reproduzido no teste "corrida: Voltar ao topo" abaixo).
    await landing.abrir('?plano-b');
    const pin = await landing.pinDe('#fechamento', '.fechamento__stage');
    await landing.rolarPara(pin.inicio + pin.duracao);
    await expect(landing.page.locator('#fechamento')).toHaveClass(/\bis-revelado\b/);

    await landing.voltarAoTopo.click();
    await expect.poll(() => landing.scrollY(), { timeout: 20_000 }).toBe(0);
    expect(await landing.esperarRolagemParar(), 'nenhum encaixe puxou a página de volta').toBe(0);
    await expect(landing.h1).toBeFocused();
  });

  test('corrida: um quadro longo ao passar pelo DM01 não pode parar o "Voltar ao topo"', async () => {
    // Regressão do mesmo bug: com o 3D carregado, a subida reativava o DM01, um quadro longo soltava o `scrollEnd` com o
    // progresso antigo e o encaixe dele trocava o lenis.scrollTo(0) por um encaixe no meio da seção (foco fora do h1).
    await landing.abrir('?plano-b');
    const dm01 = await landing.pinDe('#dm01', '.dm01__stage');
    const fechamento = await landing.pinDe('#fechamento', '.fechamento__stage');
    await landing.rolarPara(fechamento.inicio + fechamento.duracao);
    await landing.page.evaluate(([de, ate]) => {
      // Na primeira vez que a subida entra no pin do DM01, um quadro de 400 ms (o custo de reativar o 3D lá).
      const vigia = () => {
        if (window.scrollY < de || window.scrollY > ate) return;
        window.removeEventListener('scroll', vigia);
        const inicio = performance.now();
        while (performance.now() - inicio < 400) { /* quadro longo */ }
      };
      window.addEventListener('scroll', vigia);
    }, [dm01.inicio, dm01.inicio + dm01.duracao] as const);

    await landing.voltarAoTopo.click();
    expect(await landing.esperarRolagemParar(), 'a subida precisa chegar ao topo').toBe(0);
    await expect(landing.h1).toBeFocused();
  });

  test('?plano-b não baixa os modelos 3D', async () => {
    await landing.abrir('?plano-b');
    await landing.percorrer();
    await landing.page.waitForLoadState('networkidle');
    expect(landing.requisicoesDe('rb22.glb', 'dm01.glb')).toEqual([]);
    await expect(landing.page.locator('.palco3d')).not.toHaveClass(/\bis-3d\b/);
    await expect(landing.page.locator('#dm01')).not.toHaveClass(/\bis-3d\b/);
    expect(landing.erros).toEqual([]);
  });

  test('sem rolagem horizontal em nenhum ponto da página', async () => {
    await landing.abrir();
    const vazamentos: string[] = [];
    await landing.percorrer(async (y) => {
      const m = await landing.page.evaluate(() => {
        const raiz = document.documentElement;
        const sobra = raiz.scrollWidth - raiz.clientWidth;
        window.scrollTo({ left: 9999, top: window.scrollY, behavior: 'instant' });
        const x = window.scrollX;
        window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' });
        return { sobra, x };
      });
      if (m.sobra > 0 || m.x !== 0) vazamentos.push(`y=${y}: scrollWidth sobra ${m.sobra}px, scrollX ${m.x}`);
    });
    expect(vazamentos).toEqual([]);
  });
});

test.describe('Landing RB22 · movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('sem pin e com todo o texto das seções visível', async ({ page }) => {
    const landing = new Landing(page);
    await landing.abrir();
    await expect(page.locator('html')).toHaveClass(/\breduced\b/);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    expect(landing.requisicoes.filter((u) => u.includes('/hero/abertura/'))).toHaveLength(0); // sem abertura no movimento reduzido

    // Blocos que no modo animado entram e saem por opacidade: aqui ficam todos à mostra.
    const blocosApagados = await page.locator('main :is(article, .etapa, .etapa-dm01, .era, .parada, .chapter)').evaluateAll((els) =>
      els.filter((el) => parseFloat(getComputedStyle(el).opacity) === 0).map((el) => el.className));
    expect(blocosApagados).toEqual([]);

    // Todo texto legível tem caixa e opacidade. Ficam de fora, por projeto:
    // - .so-animado, .sr-only, aria-hidden e [hidden]: só do modo animado, só para leitor de tela ou decorativos;
    // - nav: as barras do Showroom e a linha do tempo da Pintura só navegam o pin, que aqui não existe;
    // - a nota da etapa 0 do DM01: no modo reduzido ela aparece uma vez só, no fim (cópia .so-reduzido da etapa 3).
    const textosInvisiveis = await page.evaluate(() => {
      const ignorar = '.so-animado, .sr-only, [aria-hidden="true"], [hidden], nav, .etapa-dm01[data-etapa="0"] .dm01__nota';
      const textos = Array.from(document.querySelectorAll<HTMLElement>('main :is(h1, h2, h3, p, dt, dd, li), footer :is(h2, p)'));
      const invisivel = (el: HTMLElement): boolean => {
        if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return true;
        for (let n: HTMLElement | null = el; n; n = n.parentElement) if (parseFloat(getComputedStyle(n).opacity) === 0) return true;
        return false;
      };
      return textos.filter((el) => !el.closest(ignorar) && el.textContent?.trim() && invisivel(el)).map((el) => el.textContent!.trim().slice(0, 50));
    });
    expect(textosInvisiveis).toEqual([]);
    await expect(page.locator('.etapa-dm01[data-etapa="3"] .dm01__nota.so-reduzido')).toBeVisible();
    expect(landing.erros).toEqual([]);
  });
});
