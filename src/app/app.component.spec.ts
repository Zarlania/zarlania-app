import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { AppComponent } from './app.component';
import { ApiService } from './api.service';

function setup(apiMock: Partial<ApiService>) {
  TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [{ provide: ApiService, useValue: apiMock }],
  });
  return TestBed.createComponent(AppComponent);
}

describe('AppComponent', () => {
  it('shows loading initially', () => {
    const fixture = setup({ getApiInfo: () => NEVER });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading');
  });

  it('shows the backend connection on success', () => {
    const fixture = setup({
      getApiInfo: () => of('3.1.0'),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Connected to backend (OpenAPI 3.1.0)',
    );
  });

  it('shows an error message on failure', () => {
    const fixture = setup({
      getApiInfo: () => throwError(() => new Error('fail')),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Could not reach the API',
    );
  });
});
