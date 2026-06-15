import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  getMessage(): Observable<string> {
    return this.http
      .get<MessageResponse>(this.baseUrl)
      .pipe(map((res) => res.message));
  }
}
