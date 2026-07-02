import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../environments/environment';
import { Account } from './api.models';

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

  it('POSTs to /accounts and returns the created account', () => {
    const request = { email: 'aldric@realm.com', username: 'aldric' };
    const account: Account = {
      user: { id: 'u1', email: 'aldric@realm.com', username: 'aldric' },
      personalOrganization: { id: 'o1', name: "Aldric's Hoard", type: 'PERSONAL' },
    };

    let result: Account | undefined;
    service.createAccount(request).subscribe((a) => (result = a));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/accounts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(account);

    expect(result).toEqual(account);
  });

  it('propagates an error when account creation fails', () => {
    let errored = false;
    service.createAccount({ email: 'dupe@realm.com', username: 'taken' }).subscribe({
      error: () => (errored = true),
    });
    httpMock
      .expectOne(`${environment.apiBaseUrl}/accounts`)
      .flush(null, { status: 409, statusText: 'Conflict' });
    expect(errored).toBe(true);
  });
});
