import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { routes } from './app.routes';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
class RootHarness {}

async function navigateAndRead(path: string): Promise<string> {
  const fixture = TestBed.createComponent(RootHarness);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(path);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement.textContent as string;
}

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('renders the landing page at the root path', async () => {
    expect(await navigateAndRead('/')).toContain('Zarlania');
  });

  it('renders the signup page at /signup', async () => {
    expect(await navigateAndRead('/signup')).toContain('Create your vault');
  });

  it('renders the login page at /login', async () => {
    expect(await navigateAndRead('/login')).toContain('Welcome back');
  });

  it('renders the home page at /home', async () => {
    expect(await navigateAndRead('/home')).toContain('Welcome');
  });

  it('renders the not-found page for unknown paths', async () => {
    expect(await navigateAndRead('/nope')).toContain('Page not found');
  });
});
