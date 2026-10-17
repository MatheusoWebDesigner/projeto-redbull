/** Caminho de um arquivo de `public/` com a base de publicação do Vite (raiz ou subcaminho). */
export function asset(caminho: string, base: string = import.meta.env.BASE_URL): string {
  return base + caminho.replace(/^\//, '');
}
