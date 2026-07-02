import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { Account } from '../../api.models';

const account: Account = {
  user: { id: 'u1', email: 'aldric@realm.com', username: 'aldric' },
  personalOrganization: { id: 'o1', name: "Aldric's Hoard", type: 'PERSONAL' },
};

function render(): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(HomeComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('HomeComponent', () => {
  afterEach(() => window.history.replaceState({}, ''));

  it('greets the user and shows account + organization from navigation state', () => {
    window.history.replaceState({ account }, '');
    const el = render();
    expect(el.textContent).toContain('Welcome, aldric');
    expect(el.textContent).toContain('aldric@realm.com');
    expect(el.textContent).toContain("Aldric's Hoard");
  });

  it('shows a generic welcome when there is no account in state', () => {
    window.history.replaceState({}, '');
    const el = render();
    expect(el.textContent).toContain('Welcome to your vault');
    expect(el.textContent).not.toContain('aldric@realm.com');
  });

  it('always shows the Magic: The Gathering teaser', () => {
    window.history.replaceState({}, '');
    const el = render();
    expect(el.textContent).toContain('Magic: The Gathering');
  });
});
