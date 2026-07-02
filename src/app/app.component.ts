import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LogoComponent } from './shared/logo/logo.component';
import { ThemeToggleComponent } from './shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, LogoComponent, ThemeToggleComponent],
  template: `
    <header class="site-header">
      <a class="brand" routerLink="/">
        <app-logo />
        <span class="brand-name">Zarlania</span>
      </a>
      <nav class="site-nav">
        <a routerLink="/" fragment="features">Features</a>
        <a routerLink="/" fragment="how-it-works">How it works</a>
      </nav>
      <div class="header-actions">
        <app-theme-toggle />
        <a class="link-login" routerLink="/login">Log in</a>
        <a class="btn-signup" routerLink="/signup">Sign up</a>
      </div>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="footer-brand">
        <app-logo />
        <span>&copy; {{ year }} Zarlania</span>
      </div>
      <nav class="footer-links" aria-label="Footer">
        <div class="footer-group">
          <span class="footer-heading">Product</span>
          <a routerLink="/" fragment="features">Features</a>
          <a routerLink="/" fragment="how-it-works">How it works</a>
        </div>
        <div class="footer-group">
          <span class="footer-heading">Account</span>
          <a routerLink="/signup">Sign up</a>
          <a routerLink="/login">Log in</a>
        </div>
      </nav>
    </footer>
  `,
  styles: [
    `
      .site-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3) var(--space-6);
        border-bottom: 1px solid var(--color-border);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        text-decoration: none;
        color: var(--color-text);
      }
      .brand-name {
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .site-nav {
        display: flex;
        gap: var(--space-4);
      }
      .site-nav a {
        color: var(--color-text-muted);
        text-decoration: none;
      }
      .header-actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .link-login {
        color: var(--color-text);
        text-decoration: none;
      }
      .btn-signup {
        background: var(--color-action);
        color: var(--color-on-action);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        font-weight: 600;
        text-decoration: none;
      }
      .site-footer {
        padding: var(--space-6);
        border-top: 1px solid var(--color-border);
        color: var(--color-text-muted);
        font-size: 0.85rem;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-6);
        align-items: flex-start;
      }
      .footer-brand {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .footer-links {
        display: flex;
        gap: var(--space-6);
        margin-left: auto;
      }
      .footer-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }
      .footer-heading {
        color: var(--color-text);
        font-weight: 600;
      }
      .footer-links a {
        color: var(--color-text-muted);
        text-decoration: none;
      }
    `,
  ],
})
export class AppComponent {
  readonly year = new Date().getFullYear();
}
