import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login.component';

function setup() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(LoginComponent);
  const router = TestBed.inject(Router);
  const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture.detectChanges();
  return { fixture, navSpy };
}

function type(fixture: ComponentFixture<LoginComponent>, name: string, value: string): void {
  const input = fixture.nativeElement.querySelector(
    `input[formControlName="${name}"]`,
  ) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<LoginComponent>): void {
  (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
    new Event('submit'),
  );
  fixture.detectChanges();
}

describe('LoginComponent (mock)', () => {
  it('navigates to /home on a valid submit', () => {
    const { fixture, navSpy } = setup();
    type(fixture, 'email', 'aldric@realm.com');
    type(fixture, 'password', 'anything');
    submit(fixture);
    expect(navSpy).toHaveBeenCalledWith(['/home']);
  });

  it('does not navigate when the form is invalid', () => {
    const { fixture, navSpy } = setup();
    submit(fixture);
    expect(navSpy).not.toHaveBeenCalled();
  });
});
