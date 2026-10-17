import { describe, expect, it } from 'vitest';
import { asset } from './url';

describe('asset', () => {
  it('publicado na raiz: mantém o caminho', () => {
    expect(asset('/models/rb22.glb', '/')).toBe('/models/rb22.glb');
  });
  it('publicado em subcaminho: prefixa a base sem barra dobrada', () => {
    expect(asset('/models/rb22.glb', '/rb22/')).toBe('/rb22/models/rb22.glb');
    expect(asset('dm01/desktop/E0.webp', '/rb22/')).toBe('/rb22/dm01/desktop/E0.webp');
  });
  it('sem base explícita usa a do Vite', () => {
    expect(asset('/env/x.hdr')).toBe(`${import.meta.env.BASE_URL}env/x.hdr`);
  });
});
