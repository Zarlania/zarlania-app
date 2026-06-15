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
    const fixture = setup({ getMessage: () => NEVER });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading');
  });

  it('shows the message on success', () => {
    const fixture = setup({
      getMessage: () => of('Hello from Zarlania API v2'),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Hello from Zarlania API v2',
    );
  });

  it('shows an error message on failure', () => {
    const fixture = setup({
      getMessage: () => throwError(() => new Error('fail')),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Could not reach the API',
    );
  });
});
