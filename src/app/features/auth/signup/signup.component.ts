import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth">
      <h1>Create your vault</h1>
      <p class="sub">Start cataloging in minutes.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" autocomplete="email" />
          @if (showError('email')) {
            <span class="field-error">Enter a valid email (max 320 characters).</span>
          }
        </label>

        <label class="field">
          <span>Username</span>
          <input type="text" formControlName="username" autocomplete="username" />
          @if (showError('username')) {
            <span class="field-error">A username is required (max 100 characters).</span>
          }
        </label>

        @if (errorMessage()) {
          <p class="form-error" role="alert">{{ errorMessage() }}</p>
        }

        <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()">
          {{ submitting() ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p class="alt">Already have one? <a routerLink="/login">Log in</a></p>
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
      .field-error,
      .form-error {
        color: var(--color-action);
        font-size: 0.78rem;
      }
      .form-error {
        margin: 0 0 var(--space-3);
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
    `,
  ],
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    username: ['', [Validators.required, Validators.maxLength(100)]],
  });

  showError(control: 'email' | 'username'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set('');
    this.api.createAccount(this.form.getRawValue()).subscribe({
      next: (account) => {
        void this.router.navigate(['/home'], { state: { account } });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(
          err.status === 409
            ? 'That email or username is already taken.'
            : 'Something went wrong creating your vault. Please try again.',
        );
      },
    });
  }
}
