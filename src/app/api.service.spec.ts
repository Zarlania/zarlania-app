import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs the actuator health endpoint and returns the status field', () => {
    let result: string | undefined;
    service.getHealth().subscribe((status) => (result = status));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/actuator/health`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'UP' });

    expect(result).toBe('UP');
  });
});
