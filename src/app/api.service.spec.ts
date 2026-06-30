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

  it('GETs the configured base URL and returns the message field', () => {
    let result: string | undefined;
    service.getMessage().subscribe((msg) => (result = msg));

    const req = httpMock.expectOne(environment.apiBaseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'Hello from Zarlania API v2' });

    expect(result).toBe('Hello from Zarlania API v2');
  });
});
