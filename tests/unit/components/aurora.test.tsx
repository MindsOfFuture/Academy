import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

// Estado compartilhado entre o mock do ogl e os testes
const ogl = vi.hoisted(() => ({
  renderers: [] as Array<{ render: { mock: { calls: unknown[] } } }>,
  programs: [] as Array<{ uniforms: Record<string, { value: unknown }> }>,
  colorCalls: 0,
  failRenderer: false,
  loseContext: 0,
}));

vi.mock('ogl', () => {
  class Renderer {
    gl: Record<string, unknown>;
    render = vi.fn();
    setSize = vi.fn();
    constructor() {
      if (ogl.failRenderer) throw new TypeError('WebGL indisponível');
      const canvas = document.createElement('canvas');
      this.gl = {
        canvas,
        BLEND: 1,
        ONE: 1,
        ONE_MINUS_SRC_ALPHA: 2,
        clearColor: vi.fn(),
        enable: vi.fn(),
        blendFunc: vi.fn(),
        getExtension: () => ({ loseContext: () => { ogl.loseContext++; } }),
      };
      ogl.renderers.push(this as never);
    }
  }
  class Program {
    uniforms: Record<string, { value: unknown }>;
    constructor(_gl: unknown, opts: { uniforms: Record<string, { value: unknown }> }) {
      this.uniforms = opts.uniforms;
      ogl.programs.push(this);
    }
  }
  class Mesh {}
  class Triangle {
    attributes: Record<string, unknown> = { uv: {} };
  }
  class Color {
    r: number; g: number; b: number;
    constructor(hex: string) {
      ogl.colorCalls++;
      const n = parseInt(hex.slice(1), 16);
      this.r = ((n >> 16) & 255) / 255;
      this.g = ((n >> 8) & 255) / 255;
      this.b = (n & 255) / 255;
    }
  }
  return { Renderer, Program, Mesh, Triangle, Color };
});

import Aurora from '@/components/aurora/aurora';

// RAF determinístico: cada tick() executa os callbacks pendentes com o tempo atual
let rafQueue = new Map<number, FrameRequestCallback>();
let rafId = 0;
let now = 0;
function tick(frames = 1, ms = 1000 / 60) {
  for (let i = 0; i < frames; i++) {
    now += ms;
    const pending = rafQueue;
    rafQueue = new Map();
    act(() => { pending.forEach((cb) => cb(now)); });
  }
}

let reducedMotion = false;
let hidden = false;
let onIntersection: IntersectionObserverCallback;
const disconnectObserver = vi.fn();
function setIntersecting(isIntersecting: boolean) {
  act(() => onIntersection([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
}
function setHidden(value: boolean) {
  hidden = value;
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
}

const renders = () => ogl.renderers.reduce((n, r) => n + r.render.mock.calls.length, 0);
const STOPS = ['#684A97', '#FFD300', '#684A97'];

beforeEach(() => {
  ogl.renderers = [];
  ogl.programs = [];
  ogl.colorCalls = 0;
  ogl.failRenderer = false;
  ogl.loseContext = 0;
  rafQueue = new Map();
  rafId = 0;
  now = 0;
  reducedMotion = false;
  hidden = false;
  onIntersection = () => {};
  disconnectObserver.mockClear();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { onIntersection = callback; }
    observe = vi.fn();
    disconnect = disconnectObserver;
  });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.set(++rafId, cb);
    return rafId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { rafQueue.delete(id); });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') && reducedMotion,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Aurora', () => {
  it('limita a renderização a no máximo 30fps', () => {
    render(<Aurora colorStops={STOPS} />);
    tick(60); // 1s de quadros a 60Hz
    expect(renders()).toBeGreaterThan(0);
    expect(renders()).toBeLessThanOrEqual(31);
  });

  it('não recria as cores do shader a cada quadro', () => {
    render(<Aurora colorStops={STOPS} />);
    const afterMount = ogl.colorCalls;
    tick(30);
    expect(ogl.colorCalls).toBe(afterMount);
  });

  it('com movimento reduzido desenha um quadro estático e não mantém loop', () => {
    reducedMotion = true;
    render(<Aurora colorStops={STOPS} />);
    tick(10);
    expect(renders()).toBe(1);
    expect(rafQueue.size).toBe(0);
  });

  it('para o loop com a aba oculta e retoma sem duplicar ao voltar', () => {
    render(<Aurora colorStops={STOPS} />);
    tick(4);
    setHidden(true);
    const before = renders();
    tick(20);
    expect(renders()).toBe(before);
    expect(rafQueue.size).toBe(0);

    setHidden(false);
    setHidden(false); // evento repetido não pode abrir segundo loop
    expect(rafQueue.size).toBe(1);
    tick(60);
    expect(renders() - before).toBeLessThanOrEqual(31);
  });

  it('para fora da tela e só retoma quando a aba e o fundo estão visíveis', () => {
    const { unmount } = render(<Aurora colorStops={STOPS} />);
    tick(4);
    setIntersecting(false);
    const before = renders();
    tick(60);
    expect(renders()).toBe(before);
    expect(rafQueue.size).toBe(0);
    setHidden(true);
    setIntersecting(true);
    expect(rafQueue.size).toBe(0);
    setHidden(false);
    expect(rafQueue.size).toBe(1);
    setIntersecting(true);
    expect(rafQueue.size).toBe(1);
    tick(4);
    expect(renders()).toBeGreaterThan(before);
    unmount();
    expect(disconnectObserver).toHaveBeenCalledTimes(1);
  });

  it('não recria o contexto WebGL quando o pai re-renderiza com array novo', () => {
    const { rerender } = render(<Aurora colorStops={[...STOPS]} />);
    rerender(<Aurora colorStops={[...STOPS]} />);
    expect(ogl.renderers).toHaveLength(1);
    expect(ogl.loseContext).toBe(0);
  });

  it('atualiza os uniforms quando as props mudam de verdade', () => {
    const { rerender } = render(<Aurora colorStops={STOPS} amplitude={0.3} blend={1} />);
    rerender(<Aurora colorStops={['#FFFFFF', '#000000', '#FFFFFF']} amplitude={0.5} blend={0.2} />);
    expect(ogl.renderers).toHaveLength(1);
    const { uniforms } = ogl.programs[0];
    expect(uniforms.uColorStops.value).toEqual([[1, 1, 1], [0, 0, 0], [1, 1, 1]]);
    expect(uniforms.uAmplitude.value).toBe(0.5);
    expect(uniforms.uBlend.value).toBe(0.2);
  });

  it('com movimento reduzido redesenha o quadro estático ao mudar props', () => {
    reducedMotion = true;
    const { rerender } = render(<Aurora colorStops={STOPS} />);
    rerender(<Aurora colorStops={['#FFFFFF', '#000000', '#FFFFFF']} />);
    expect(renders()).toBe(2);
    expect(rafQueue.size).toBe(0);
  });

  it('limpa loop, listeners e contexto ao desmontar', () => {
    const { unmount, container } = render(<Aurora colorStops={STOPS} />);
    tick(2);
    unmount();
    expect(rafQueue.size).toBe(0);
    expect(ogl.loseContext).toBe(1);
    expect(container.querySelector('canvas')).toBeNull();
    setHidden(true);
    setHidden(false); // listener removido: nada volta a agendar
    expect(rafQueue.size).toBe(0);
  });

  it('não quebra a página quando WebGL não está disponível', () => {
    ogl.failRenderer = true;
    expect(() => render(<Aurora colorStops={STOPS} />)).not.toThrow();
    expect(rafQueue.size).toBe(0);
  });
});
