import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" role="img" [attr.aria-label]="label()">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <path d="M32 5 L38 12 L32 20 L26 12 Z" fill="var(--color-brand)" />
        <line
          x1="32"
          y1="21"
          x2="32"
          y2="57"
          stroke="var(--color-brand)"
          stroke-width="3.4"
          stroke-linecap="round"
        />
        <path
          d="M30 55 C 21 55 21 47 30 47 C 41 47 41 37 30 37 C 20 37 20 28 31 27"
          fill="none"
          stroke="var(--color-action)"
          stroke-width="3.6"
          stroke-linecap="round"
        />
        <path
          d="M31 27 C 30 22 33 18.5 38 19 L35 22 L40.5 22.5 C 39 26.5 34 28 31 27 Z"
          fill="var(--color-action)"
        />
      </svg>
    </span>
  `,
  styles: [
    `
      .logo {
        display: inline-flex;
        align-items: center;
      }
    `,
  ],
})
export class LogoComponent {
  readonly label = input('Zarlania');
}
