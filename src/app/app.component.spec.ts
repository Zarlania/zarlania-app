import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

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

describe('AppComponent (shell)', () => {
  beforeEach(() => {
    localStorage.clear();
    stubMatchMedia(true);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('renders the brand logo in a header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const header: HTMLElement = fixture.nativeElement.querySelector('header');
    expect(header).toBeTruthy();
    expect(header.querySelector('app-logo')).toBeTruthy();
  });

  it('renders the theme toggle and a router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-theme-toggle')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('links to signup and login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('a')).map((a) =>
      (a as HTMLAnchorElement).getAttribute('href'),
    );
    expect(hrefs).toContain('/signup');
    expect(hrefs).toContain('/login');
  });

  it('renders a footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('footer')).toBeTruthy();
  });

  it('footer shows the current year dynamically', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const footer: HTMLElement = fixture.nativeElement.querySelector('footer');
    expect(footer.textContent).toContain(String(new Date().getFullYear()));
  });

  it('footer links to signup and login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const footerHrefs = Array.from(fixture.nativeElement.querySelectorAll('footer a')).map((a) =>
      (a as HTMLAnchorElement).getAttribute('href'),
    );
    expect(footerHrefs).toContain('/signup');
    expect(footerHrefs).toContain('/login');
  });
});
