import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth">
      <h1>Welcome back</h1>
      <p class="sub">Log in to your vault.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        <label class="field">
          <span>Password</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>

        <button type="submit" class="btn-primary" [disabled]="form.invalid">Log in</button>
      </form>

      <p class="alt">New here? <a routerLink="/signup">Create a vault</a></p>
      <p class="mock-note">
        Mock only — authentication isn't wired up yet; any valid input continues to your vault.
      </p>
    </section>
  `,
  styles: [
    `
      .auth {
        max-width: 24rem;
        margin: 0 auto;
        padding: var(--space-8) var(--space-6);
      }
      .sub {
        color: var(--color-text-muted);
        margin: 0 0 var(--space-6);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        margin-bottom: var(--space-4);
      }
      .field span {
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
      .field input {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-2) var(--space-3);
        color: var(--color-text);
        font: inherit;
      }
      .btn-primary {
        width: 100%;
        background: var(--color-action);
        color: var(--color-on-action);
        border: none;
        border-radius: var(--radius-md);
        padding: var(--space-3);
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .alt {
        margin-top: var(--space-4);
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
      .mock-note {
        margin-top: var(--space-3);
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-style: italic;
        opacity: 0.7;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    void this.router.navigate(['/home']);
  }
}
