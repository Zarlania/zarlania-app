import { TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../core/theme/theme.service';

function stubMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('ThemeToggleComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    stubMatchMedia(true); // OS prefers dark
  });

  it('renders a labelled button reflecting the current (dark) theme', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
  });

  it('toggles the theme when clicked', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    const service = TestBed.inject(ThemeService);
    fixture.detectChanges();
    expect(service.theme()).toBe('dark');

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(service.theme()).toBe('light');
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(
      'Switch to dark theme',
    );
  });
});
