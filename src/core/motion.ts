/** Escolha feita no botão "Reduzir movimento" da página (guardada no navegador ou na URL). */
const CHAVE = 'rb22-movimento';

/** O sistema pedindo menos movimento sempre vale; a escolha salva na página só pode reduzir. */
export function movimentoReduzido(sistema: boolean, escolha: string | null): boolean {
  return sistema || escolha === 'reduzido';
}

export function sistemaPedeMenosMovimento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function escolhaSalva(): string | null {
  const daUrl = new URLSearchParams(location.search).get('movimento');
  if (daUrl) return daUrl;
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null; // armazenamento bloqueado: vale só a URL
  }
}

export function prefersReducedMotion(): boolean {
  return movimentoReduzido(sistemaPedeMenosMovimento(), escolhaSalva());
}

/** Troca a escolha e recarrega: o modo de movimento é decidido na montagem da página. */
export function alternarMovimento(): void {
  const nova = prefersReducedMotion() ? 'completo' : 'reduzido';
  const url = new URL(location.href);
  url.searchParams.delete('movimento');
  try {
    localStorage.setItem(CHAVE, nova);
  } catch {
    url.searchParams.set('movimento', nova); // sem armazenamento, a escolha vai na própria URL
  }
  location.replace(url);
}
