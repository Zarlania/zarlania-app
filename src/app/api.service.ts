import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface ApiDocs {
  openapi: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  // POC connectivity check: hit the public OpenAPI doc, an MVC endpoint already covered by the
  // backend's CORS allowlist, purely to confirm the frontend can reach the backend. The payload
  // is incidental — swap this for a real domain endpoint once one exists on the API.
  getApiInfo(): Observable<string> {
    return this.http.get<ApiDocs>(`${this.baseUrl}/v3/api-docs`).pipe(map((res) => res.openapi));
  }
}
