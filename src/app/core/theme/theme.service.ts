import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, Signal, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'zarlania-theme';

/** Pure resolution shared conceptually with the no-flash inline script in index.html. */
export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return prefersDark ? 'dark' : 'light';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly current = signal<Theme>(this.readInitial());
  readonly theme: Signal<Theme> = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  setTheme(theme: Theme): void {
    this.current.set(theme);
    if (this.isBrowser) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Persistence is best-effort; theming must keep working even if storage is unavailable.
      }
    }
    this.apply(theme);
  }

  toggle(): void {
    this.setTheme(this.current() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): Theme {
    // During prerender/SSR there is no window or storage; the no-flash inline
    // script in index.html resolves the real theme on the client. Bake a safe
    // default so the static HTML is valid.
    if (!this.isBrowser) {
      return resolveInitialTheme(null, true);
    }
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Treat an inaccessible store as "no stored value" and fall back to OS preference.
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    return resolveInitialTheme(stored, prefersDark);
  }

  private apply(theme: Theme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
