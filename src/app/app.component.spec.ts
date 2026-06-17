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
    const fixture = setup({ getHealth: () => NEVER });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading');
  });

  it('shows the backend status on success', () => {
    const fixture = setup({
      getHealth: () => of('UP'),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Backend status: UP');
  });

  it('shows an error message on failure', () => {
    const fixture = setup({
      getHealth: () => throwError(() => new Error('fail')),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Could not reach the API',
    );
  });
});
