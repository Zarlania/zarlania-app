import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: sans-serif; text-align: center; padding: 4rem;">
      @if (loading()) {
        <p>Loading…</p>
      } @else if (error()) {
        <p>Could not reach the API.</p>
      } @else {
        <h1>Backend status: {{ status() }}</h1>
      }
    </main>
  `,
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  error = signal(false);
  status = signal('');

  ngOnInit(): void {
    this.api.getHealth().subscribe({
      next: (status) => {
        this.status.set(status);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
