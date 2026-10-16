import { describe, expect, it } from 'vitest';
import { podeUsar3D } from './support';

describe('podeUsar3D', () => {
  it('exige WebGL2', () => {
    expect(podeUsar3D({ webgl2: false })).toBe(false);
    expect(podeUsar3D({ webgl2: true })).toBe(true);
  });
  it('recusa aparelho com pouca memória ou poucos núcleos', () => {
    expect(podeUsar3D({ webgl2: true, memoriaGb: 2 })).toBe(false);
    expect(podeUsar3D({ webgl2: true, nucleos: 2 })).toBe(false);
    expect(podeUsar3D({ webgl2: true, memoriaGb: 4, nucleos: 4 })).toBe(true);
  });
  it('o parâmetro ?plano-b força os renders (teste manual)', () => {
    expect(podeUsar3D({ webgl2: true, forcarPlanoB: true })).toBe(false);
  });
});
