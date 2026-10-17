import { describe, expect, it } from 'vitest';
import type { Pose } from '../../three/cameras';
import type { Vec3 } from '../../three/convert';
import { catmullRom, easeInOut, encaixeMaisProximo, estadoBarras, paradaAtiva, poseNoTrilho, PONTOS_SHOWROOM, railU } from './rail';

const amostras = (n: number) => Array.from({ length: n + 1 }, (_, k) => k / n);
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('easeInOut (power2.inOut)', () => {
  it('fixa as pontas e o meio', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.25)).toBe(0.125);
  });
  it('é crescente e simétrica em torno do meio', () => {
    const t = amostras(200);
    t.slice(1).forEach((v, k) => expect(easeInOut(v)).toBeGreaterThan(easeInOut(t[k])));
    t.forEach((v) => expect(easeInOut(1 - v)).toBeCloseTo(1 - easeInOut(v), 12));
  });
});

describe('railU', () => {
  it('passa exatamente pelas 6 paradas', () => {
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((p) => expect(railU(p)).toBeCloseTo(p, 10));
  });
  it('desacelera perto da parada', () => {
    expect(railU(0.05)).toBeCloseTo(0.025, 10);
    expect(railU(0.25)).toBeCloseTo(0.225, 10);
  });
  it('limita progresso fora de 0..1 e trata NaN como início', () => {
    expect(railU(-1)).toBe(0);
    expect(railU(2)).toBe(1);
    expect(railU(Number.NaN)).toBe(0);
  });
  it('nunca volta para trás quando o progresso avança', () => {
    const p = amostras(1000);
    p.slice(1).forEach((v, k) => expect(railU(v)).toBeGreaterThanOrEqual(railU(p[k])));
  });
});

describe('paradaAtiva', () => {
  it('troca na metade do caminho entre paradas', () => {
    expect(paradaAtiva(0)).toBe(0);
    expect(paradaAtiva(0.09)).toBe(0);
    expect(paradaAtiva(0.1)).toBe(1);
    expect(paradaAtiva(1)).toBe(5);
  });
  it('fora de 0..1 fica na primeira ou na última parada; NaN é a primeira', () => {
    expect(paradaAtiva(-0.3)).toBe(0);
    expect(paradaAtiva(1.4)).toBe(5);
    expect(paradaAtiva(Number.NaN)).toBe(0);
  });
});

describe('catmullRom', () => {
  const pts: Vec3[] = [[0, 0, 0], [1, 2, 0], [3, 2, 1], [4, 0, 1]];
  it('passa pelos pontos de controle', () => {
    pts.forEach((p, i) => {
      const r = catmullRom(pts, i / (pts.length - 1));
      r.forEach((v, k) => expect(v).toBeCloseTo(p[k], 10));
    });
  });
  it('é contínua entre os pontos', () => {
    const a = catmullRom(pts, 0.5 - 1e-6);
    const b = catmullRom(pts, 0.5 + 1e-6);
    a.forEach((v, k) => expect(v).toBeCloseTo(b[k], 4));
  });
  it('não muda de velocidade de repente ao cruzar um ponto de controle', () => {
    const h = 1e-6;
    [1 / 3, 2 / 3].forEach((u) => {
      const antes = catmullRom(pts, u - h).map((v, k) => (catmullRom(pts, u)[k] - v) / h);
      const depois = catmullRom(pts, u + h).map((v, k) => (v - catmullRom(pts, u)[k]) / h);
      antes.forEach((v, k) => expect(v).toBeCloseTo(depois[k], 3));
    });
  });
  it('com só 2 pontos anda em linha reta de um ao outro', () => {
    const dois: Vec3[] = [[0, 0, 0], [2, 4, -2]];
    expect(catmullRom(dois, 0)).toEqual([0, 0, 0]);
    catmullRom(dois, 1).forEach((v, k) => expect(v).toBeCloseTo(dois[1][k], 12));
    catmullRom(dois, 0.5).forEach((v, k) => expect(v).toBeCloseTo(dois[1][k] / 2, 12));
    const q = catmullRom(dois, 0.3);
    expect(q[1]).toBeCloseTo(2 * q[0], 12);
    expect(q[2]).toBeCloseTo(-q[0], 12);
  });
  it('u fora de 0..1 fica nas pontas; NaN é o primeiro ponto', () => {
    expect(catmullRom(pts, -1)).toEqual(pts[0]);
    expect(catmullRom(pts, Number.NaN)).toEqual(pts[0]);
    catmullRom(pts, 3).forEach((v, k) => expect(v).toBeCloseTo(pts[3][k], 10));
  });
});

describe('poseNoTrilho', () => {
  const pose = (k: number): Pose => ({
    pos: [k * 2, 1 + (k % 2) * 0.6, -k],
    alvo: [k, 0.5, k % 2 ? 0.3 : 0],
    fov: 30 + k * 2,
    shiftX: -0.2 + k * 0.05,
    shiftY: 0.01 * k,
    aspecto: 1.6,
  });
  const poses = Array.from({ length: 6 }, (_, k) => pose(k));
  const pertoDe = (r: Pose, e: Pose, casas: number) => {
    r.pos.forEach((v, k) => expect(v).toBeCloseTo(e.pos[k], casas));
    r.alvo.forEach((v, k) => expect(v).toBeCloseTo(e.alvo[k], casas));
    expect(r.fov).toBeCloseTo(e.fov, casas);
    expect(r.shiftX).toBeCloseTo(e.shiftX, casas);
    expect(r.shiftY).toBeCloseTo(e.shiftY, casas);
    expect(r.aspecto).toBeCloseTo(e.aspecto, casas);
  };

  it('em cada parada a câmera está exatamente na pose daquela parada', () => {
    PONTOS_SHOWROOM.forEach((p, k) => pertoDe(poseNoTrilho(poses, p), poses[k], 10));
  });
  it('não salta ao cruzar as fronteiras entre trechos', () => {
    PONTOS_SHOWROOM.slice(1, -1).forEach((p) => pertoDe(poseNoTrilho(poses, p - 1e-9), poseNoTrilho(poses, p + 1e-9), 6));
  });
  it('anda sem saltos ao longo de todo o trilho', () => {
    const p = amostras(2000);
    p.slice(1).forEach((v, k) => {
      const a = poseNoTrilho(poses, p[k]);
      const b = poseNoTrilho(poses, v);
      expect(dist(a.pos, b.pos)).toBeLessThan(0.05);
      expect(dist(a.alvo, b.alvo)).toBeLessThan(0.05);
      expect(Math.abs(a.fov - b.fov)).toBeLessThan(0.05);
    });
  });
  it('fora de 0..1 fica na primeira ou na última pose; NaN é a primeira', () => {
    pertoDe(poseNoTrilho(poses, -0.5), poses[0], 10);
    pertoDe(poseNoTrilho(poses, Number.NaN), poses[0], 10);
    pertoDe(poseNoTrilho(poses, 1.5), poses[5], 10);
  });
});

describe('estadoBarras', () => {
  it('na visão geral fica tudo apagado', () => {
    expect(estadoBarras(0)).toEqual(['apagada', 'apagada', 'apagada', 'apagada', 'apagada']);
  });
  it('na parada 3 tem duas vistas e uma ativa', () => {
    expect(estadoBarras(3)).toEqual(['vista', 'vista', 'ativa', 'apagada', 'apagada']);
  });
  it('na última parada todas as anteriores estão vistas e a última, ativa', () => {
    expect(estadoBarras(5)).toEqual(['vista', 'vista', 'vista', 'vista', 'ativa']);
  });
});

describe('encaixeMaisProximo', () => {
  const pontos = [0, 0.48, 0.62, 1];
  it('devolve o ponto mais próximo', () => {
    expect(encaixeMaisProximo(0.2, pontos)).toBe(0);
    expect(encaixeMaisProximo(0.3, pontos)).toBe(0.48);
    expect(encaixeMaisProximo(0.9, pontos)).toBe(1);
  });
  it('no empate vai para o ponto seguinte', () => {
    expect(encaixeMaisProximo(0.24, pontos)).toBe(0.48);
    expect(encaixeMaisProximo(0.5, [0, 1])).toBe(1);
  });
  it('fora de 0..1 encaixa na ponta; NaN encaixa no primeiro ponto', () => {
    expect(encaixeMaisProximo(-0.2, pontos)).toBe(0);
    expect(encaixeMaisProximo(1.3, pontos)).toBe(1);
    expect(encaixeMaisProximo(Number.NaN, pontos)).toBe(0);
  });
  it('no showroom encaixa na parada cujo texto está na tela, inclusive no meio exato entre duas', () => {
    amostras(1000).forEach((p) => expect([p, PONTOS_SHOWROOM.indexOf(encaixeMaisProximo(p, PONTOS_SHOWROOM))]).toEqual([p, paradaAtiva(p)]));
  });
});
