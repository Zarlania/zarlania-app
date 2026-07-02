import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Account } from '../../api.models';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="home">
      @if (account(); as acc) {
        <h1>Welcome, {{ acc.user.username }}.</h1>
        <p class="sub">Your vault is ready.</p>
        <dl class="account-card">
          <dt>Account</dt>
          <dd>{{ acc.user.email }}</dd>
          <dt>Personal organization</dt>
          <dd>{{ acc.personalOrganization.name }}</dd>
        </dl>
      } @else {
        <h1>Welcome to your vault</h1>
        <p class="sub">Your vault is ready.</p>
      }

      <div class="teaser">
        <span class="teaser-icon" aria-hidden="true">✦</span>
        <div>
          <p class="teaser-title">Magic: The Gathering</p>
          <p class="teaser-sub">Your first collection space — coming soon.</p>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .home {
        max-width: 34rem;
        margin: 0 auto;
        padding: var(--space-8) var(--space-6);
      }
      .sub {
        color: var(--color-text-muted);
        margin: 0 0 var(--space-6);
      }
      .account-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin: 0 0 var(--space-4);
      }
      .account-card dt {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-muted);
      }
      .account-card dd {
        margin: 0 0 var(--space-3);
        font-weight: 600;
      }
      .account-card dd:last-child {
        margin-bottom: 0;
      }
      .teaser {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
      }
      .teaser-icon {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        background: var(--color-surface);
        color: var(--color-brand);
        font-size: 1.2rem;
      }
      .teaser-title {
        margin: 0;
        font-weight: 700;
      }
      .teaser-sub {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class HomeComponent {
  readonly account = signal<Account | null>(HomeComponent.readAccount());

  private static readAccount(): Account | null {
    if (typeof history === 'undefined') {
      return null;
    }
    const state = history.state as { account?: Account } | null;
    return state?.account ?? null;
  }
}
