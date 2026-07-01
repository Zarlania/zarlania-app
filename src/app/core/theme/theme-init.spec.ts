import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('theme initialization', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('sets a data-theme attribute as soon as the service is constructed', () => {
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    TestBed.inject(ThemeService);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
