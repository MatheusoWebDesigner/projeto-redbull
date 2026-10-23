/** Caminho de um arquivo de `public/` com a base de publicação do Vite (raiz ou subcaminho). */
export function asset(caminho: string, base: string = import.meta.env.BASE_URL): string {
  return base + caminho.replace(/^\//, '');
}

export type Aparelho = 'desktop' | 'mobile';

/** Caminho do render do aparelho: os de celular moram em `/mobile/`, ao lado dos de desktop. */
export function caminhoDoAparelho(caminho: string, aparelho: Aparelho): string {
  return aparelho === 'mobile' ? caminho.replace('/desktop/', '/mobile/') : caminho;
}

/**
 * Imagens com `data-src` (caminho de desktop) só ganham `src` aqui, já com o arquivo do aparelho:
 * com o `src` no HTML, o celular baixava a versão desktop antes de o script trocá-la.
 */
export function carregarImagensDoAparelho(raiz: ParentNode, aparelho: Aparelho): void {
  raiz.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
    if (aparelho === 'mobile') { img.width = 1080; img.height = 2340; }
    img.src = asset(caminhoDoAparelho(img.dataset.src!, aparelho));
  });
}
