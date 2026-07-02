import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SignupComponent } from './signup.component';
import { ApiService } from '../../../api.service';
import { Account } from '../../../api.models';

const account: Account = {
  user: { id: 'u1', email: 'aldric@realm.com', username: 'aldric' },
  personalOrganization: { id: 'o1', name: "Aldric's Hoard", type: 'PERSONAL' },
};

function setup(api: Partial<ApiService>) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiService, useValue: api }],
  });
  const fixture = TestBed.createComponent(SignupComponent);
  const router = TestBed.inject(Router);
  const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture.detectChanges();
  return { fixture, navSpy };
}

function type(fixture: ComponentFixture<SignupComponent>, name: string, value: string): void {
  const input = fixture.nativeElement.querySelector(
    `input[formControlName="${name}"]`,
  ) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<SignupComponent>): void {
  (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
    new Event('submit'),
  );
  fixture.detectChanges();
}

describe('SignupComponent', () => {
  it('disables submit until the form is valid', () => {
    const { fixture } = setup({ createAccount: jest.fn() });
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    type(fixture, 'email', 'aldric@realm.com');
    type(fixture, 'username', 'aldric');
    expect(button.disabled).toBe(false);
  });

  it('creates the account and navigates to /home with the account in state', () => {
    const createAccount = jest.fn().mockReturnValue(of(account));
    const { fixture, navSpy } = setup({ createAccount });
    type(fixture, 'email', 'aldric@realm.com');
    type(fixture, 'username', 'aldric');
    submit(fixture);
    expect(createAccount).toHaveBeenCalledWith({
      email: 'aldric@realm.com',
      username: 'aldric',
    });
    expect(navSpy).toHaveBeenCalledWith(['/home'], { state: { account } });
  });

  it('shows a taken message on 409 and does not navigate', () => {
    const createAccount = jest
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const { fixture, navSpy } = setup({ createAccount });
    type(fixture, 'email', 'dupe@realm.com');
    type(fixture, 'username', 'taken');
    submit(fixture);
    expect(fixture.nativeElement.textContent).toContain('already taken');
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('shows a generic error on other failures', () => {
    const createAccount = jest
      .fn()
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const { fixture } = setup({ createAccount });
    type(fixture, 'email', 'a@realm.com');
    type(fixture, 'username', 'aldric');
    submit(fixture);
    expect(fixture.nativeElement.textContent).toContain('went wrong');
  });
});
