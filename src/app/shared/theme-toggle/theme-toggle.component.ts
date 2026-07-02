import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="theme-toggle" [attr.aria-label]="label()" (click)="onToggle()">
      {{ icon() }}
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        background: var(--color-surface);
        color: var(--color-brand);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        width: 36px;
        height: 36px;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly icon = computed(() => (this.themeService.theme() === 'dark' ? '☾' : '☀'));
  readonly label = computed(() =>
    this.themeService.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
  );

  onToggle(): void {
    this.themeService.toggle();
  }
}
