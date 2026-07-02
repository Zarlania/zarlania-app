// Manual Jest mock for @angular/ssr.
//
// The real package's main entry eagerly loads its SSR-only critical-CSS engine
// (third_party/beasties), which is not loadable in the jsdom unit-test
// environment. Since our specs only need the public render-mode contract, this
// mock reproduces the parts of the API our code imports: the `RenderMode` enum
// (values mirror @angular/ssr), the `ServerRoute` shape, and no-op wiring
// helpers used by app.config.server.ts.
export enum RenderMode {
  Server = 0,
  Client = 1,
  Prerender = 2,
}

export interface ServerRoute {
  path: string;
  renderMode?: RenderMode;
}

export function provideServerRendering(...features: unknown[]): unknown[] {
  return features;
}

export function withRoutes(routes: unknown): unknown {
  return routes;
}
