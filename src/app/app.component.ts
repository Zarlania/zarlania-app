import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="font-family: sans-serif; text-align: center; padding: 4rem;">
      @if (loading()) {
        <p>Loading…</p>
      } @else if (error()) {
        <p>Could not reach the API.</p>
      } @else {
        <h1>Connected to backend (OpenAPI {{ apiVersion() }})</h1>
      }
    </main>
  `,
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  error = signal(false);
  apiVersion = signal('');

  ngOnInit(): void {
    this.api.getApiInfo().subscribe({
      next: (version) => {
        this.apiVersion.set(version);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
