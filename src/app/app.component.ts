import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <main style="font-family: sans-serif; text-align: center; padding: 4rem;">
      @if (loading()) {
        <p>Loading…</p>
      } @else if (error()) {
        <p>Could not reach the API.</p>
      } @else {
        <h1>{{ message() }}</h1>
      }
    </main>
  `,
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  error = signal(false);
  message = signal('');

  ngOnInit(): void {
    this.api.getMessage().subscribe({
      next: (msg) => {
        this.message.set(msg);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
