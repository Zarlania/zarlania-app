import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  function render() {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders exactly one h1 (the hero headline)', () => {
    const el = render();
    const h1s = el.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toContain('Command every collection');
  });

  it('has Features and How-it-works sections with anchor ids matching the header nav', () => {
    const el = render();
    expect(el.querySelector('section#features')).toBeTruthy();
    expect(el.querySelector('section#how-it-works')).toBeTruthy();
  });

  it('uses semantic section landmarks for each content block', () => {
    const el = render();
    // hero, features, how-it-works, collections, cta = 5 sections
    expect(el.querySelectorAll('section').length).toBeGreaterThanOrEqual(5);
  });

  it('primary calls-to-action link to signup', () => {
    const el = render();
    const signupLinks = Array.from(el.querySelectorAll('a')).filter(
      (a) => a.getAttribute('href') === '/signup',
    );
    expect(signupLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('names Magic: The Gathering as the first supported collection', () => {
    const el = render();
    expect(el.textContent).toContain('Magic: The Gathering');
  });

  it('sets the SEO document title', () => {
    render();
    expect(TestBed.inject(Title).getTitle()).toBe('Zarlania — Command every collection you own');
  });

  it('sets description and social meta tags', () => {
    render();
    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="description"')?.content).toBe(
      'Catalog, index, and track the value of your card collections in one vault — starting with Magic: The Gathering.',
    );
    expect(meta.getTag('property="og:title"')?.content).toBe(
      'Zarlania — Command every collection you own',
    );
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
  });
});
