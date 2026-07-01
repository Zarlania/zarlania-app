import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs the OpenAPI doc endpoint and returns the openapi version', () => {
    let result: string | undefined;
    service.getApiInfo().subscribe((version) => (result = version));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/v3/api-docs`);
    expect(req.request.method).toBe('GET');
    req.flush({ openapi: '3.1.0' });

    expect(result).toBe('3.1.0');
  });
});
