import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Zarlania</h1>
    <p>Command every collection you own.</p>`,
})
export class LandingComponent {}
