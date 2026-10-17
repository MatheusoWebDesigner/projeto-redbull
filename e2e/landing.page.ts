import { expect, type Locator, type Page } from '@playwright/test';

/** Ordem das seções no index.html, de cima para baixo. */
export const SECOES = ['.hero', '#manifesto', '.palco3d', '#showroom', '#aero', '#dm01', '#numeros', '#pintura', '#legado', '#fechamento', 'footer.rodape'] as const;

/** Objeto de página da landing RB22: seletores, espera de prontidão e rolagem controlada. */
export class Landing {
  /** Erros de console e exceções não tratadas desde a criação. */
  readonly erros: string[] = [];
  /** URLs de todas as requisições feitas pela página. */
  readonly requisicoes: string[] = [];

  constructor(readonly page: Page) {
    page.on('console', (m) => { if (m.type() === 'error') this.erros.push(m.text()); });
    page.on('pageerror', (e) => this.erros.push(`pageerror: ${e.message}`));
    page.on('request', (r) => this.requisicoes.push(r.url()));
  }

  // ---- seletores ----
  get h1(): Locator { return this.page.locator('h1'); }
  get paradaAtiva(): Locator { return this.page.locator('#showroom .parada.is-active'); }
  barraShowroom(i: number): Locator { return this.page.locator(`.showroom__barras button[data-ir="${i}"]`); }
  get barrasAtuais(): Locator { return this.page.locator('.showroom__barras button[aria-current="step"]'); }
  modoAero(nome: 'Modo curva' | 'Modo reta'): Locator { return this.page.locator('.seletor-modo').getByRole('radio', { name: nome }); }
  get cartaoModo(): Locator { return this.page.locator('#aero .cartao-modo[aria-live]'); }
  get etapaDm01Ativa(): Locator { return this.page.locator('#dm01 .etapa-dm01.is-active'); }
  get eraAtiva(): Locator { return this.page.locator('#pintura .era.is-active'); }
  botaoEra(nome: string): Locator { return this.page.getByRole('navigation', { name: 'Eras da pintura' }).getByRole('button', { name: nome }); }
  get voltarAoTopo(): Locator { return this.page.locator('[data-topo]'); }

  // ---- carregamento ----
  /** Abre a página e espera o loader sair e todos os módulos terminarem de montar. */
  async abrir(busca = ''): Promise<void> {
    await this.page.goto(`/${busca}`);
    await expect(this.page.locator('.loader')).toHaveClass(/\bis-done\b/, { timeout: 30_000 });
    const reduzido = await this.page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduzido) {
      await expect(this.page.locator('html')).toHaveClass(/\breduced\b/);
      // Sem pins não há marco no DOM do fim da montagem: o último módulo (Fechamento) termina ao baixar os quadros.
      await this.page.waitForLoadState('networkidle');
    } else {
      // O Fechamento é o último módulo a montar (main.ts); o pin dele existe = a página inteira montou.
      await expect(this.page.locator('.pin-spacer .fechamento__stage')).toBeAttached({ timeout: 30_000 });
    }
    await this.page.evaluate(() => document.fonts.ready.then(() => undefined));
  }

  // ---- rolagem ----
  scrollY(): Promise<number> { return this.page.evaluate(() => window.scrollY); }

  /** Topo de um elemento no documento (em px), independente da rolagem atual. */
  topoDe(seletor: string): Promise<number> {
    return this.page.locator(seletor).first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  }

  /** Pin do stage da seção: onde começa e quanto dura (padding do pin-spacer do ScrollTrigger). */
  pinDe(secao: string, stage: string): Promise<{ inicio: number; duracao: number; alturaTela: number; temSpacer: boolean }> {
    return this.page.evaluate(([s, st]) => {
      const sec = document.querySelector<HTMLElement>(s)!;
      const spacer = sec.querySelector<HTMLElement>(st)!.parentElement!;
      return {
        inicio: sec.getBoundingClientRect().top + window.scrollY,
        duracao: parseFloat(getComputedStyle(spacer).paddingBottom),
        alturaTela: window.innerHeight,
        temSpacer: spacer.classList.contains('pin-spacer'),
      };
    }, [secao, stage] as const);
  }

  /** Rola na hora (sem animação) e espera a rolagem assentar, incluindo um eventual encaixe do Lenis. */
  async rolarPara(y: number): Promise<void> {
    await this.page.evaluate((alvo) => window.scrollTo({ top: alvo, behavior: 'instant' }), Math.round(y));
    await this.esperarRolagemParar();
  }

  /**
   * Espera scrollY ficar parado por `estavelMs`. 600 ms passa do limite de 200 ms do `scrollEnd` do ScrollTrigger
   * somado ao intervalo de 250 ms em que ele é avaliado com a página parada: depois disso, qualquer encaixe
   * pendente já rodou e a próxima ação não cai na corrida descrita no teste "corrida" da spec.
   */
  async esperarRolagemParar(estavelMs = 600): Promise<number> {
    let ultimo = Number.NaN;
    let desde = 0;
    let atual = 0;
    await expect.poll(async () => {
      atual = await this.scrollY();
      const agora = Date.now();
      if (atual !== ultimo) { ultimo = atual; desde = agora; }
      return agora - desde >= estavelMs;
    }, { intervals: [100], timeout: 20_000, message: 'a rolagem não assentou' }).toBe(true);
    return atual;
  }

  /** Dois quadros de animação: tempo para o IntersectionObserver e o ScrollTrigger reagirem. */
  doisQuadros(): Promise<void> {
    return this.page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  }

  /** Percorre a página inteira, uma tela por vez, chamando `aCadaTela` em cada parada. */
  async percorrer(aCadaTela?: (y: number) => Promise<void>): Promise<void> {
    const { total, tela } = await this.page.evaluate(() => ({ total: document.documentElement.scrollHeight - innerHeight, tela: innerHeight }));
    for (let y = 0; ; y = Math.min(total, y + tela)) {
      await this.page.evaluate((alvo) => window.scrollTo({ top: alvo, behavior: 'instant' }), y);
      await this.doisQuadros();
      await aCadaTela?.(y);
      if (y >= total) break;
    }
  }

  // ---- leituras ----
  /** Peças com rótulo à mostra no DM01, em ordem alfabética. */
  rotulosVisiveis(): Promise<string[]> {
    return this.page.locator('#dm01 .rotulo-peca.is-visivel').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.peca!).sort());
  }

  /** Opacidade calculada de um elemento. */
  opacidade(seletor: string): Promise<number> {
    return this.page.locator(seletor).first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  }

  /** Requisições cujo caminho termina em algum dos nomes dados. */
  requisicoesDe(...arquivos: string[]): string[] {
    return this.requisicoes.filter((u) => arquivos.some((a) => new URL(u).pathname.endsWith(`/${a}`)));
  }
}
