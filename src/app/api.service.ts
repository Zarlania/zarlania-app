import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface HealthResponse {
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  getHealth(): Observable<string> {
    return this.http
      .get<HealthResponse>(`${this.baseUrl}/actuator/health`)
      .pipe(map((res) => res.status));
  }
}
