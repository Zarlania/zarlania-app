import { Injectable, Signal, signal } from '@angular/core';

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
  private readonly current = signal<Theme>(this.readInitial());
  readonly theme: Signal<Theme> = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  setTheme(theme: Theme): void {
    this.current.set(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.apply(theme);
  }

  toggle(): void {
    this.setTheme(this.current() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    return resolveInitialTheme(stored, prefersDark);
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
