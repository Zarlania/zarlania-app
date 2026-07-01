import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

function modeFor(path: string): RenderMode | undefined {
  return serverRoutes.find((r) => r.path === path)?.renderMode;
}

describe('server routes', () => {
  it('prerenders the public landing route', () => {
    expect(modeFor('')).toBe(RenderMode.Prerender);
  });

  it('client-renders the app routes (no prerender of stateful pages)', () => {
    expect(modeFor('signup')).toBe(RenderMode.Client);
    expect(modeFor('login')).toBe(RenderMode.Client);
    expect(modeFor('home')).toBe(RenderMode.Client);
  });
});
