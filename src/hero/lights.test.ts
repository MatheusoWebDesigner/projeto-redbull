import { describe, expect, it } from 'vitest';
import { litLights } from './lights';

describe('litLights', () => {
  it('nenhuma luz no começo', () => {
    expect(litLights(0)).toBe(0);
  });
  it('acende uma a cada 20%', () => {
    expect(litLights(0.19)).toBe(0);
    expect(litLights(0.2)).toBe(1);
    expect(litLights(0.99)).toBe(4);
  });
  it('as 5 acesas quando carregou tudo', () => {
    expect(litLights(1)).toBe(5);
    expect(litLights(1.3)).toBe(5);
  });
});
