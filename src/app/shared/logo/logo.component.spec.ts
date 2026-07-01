import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LogoComponent } from './logo.component';

@Component({
  standalone: true,
  imports: [LogoComponent],
  template: `<app-logo [label]="'Zarlania home'" />`,
})
class HostComponent {}

describe('LogoComponent', () => {
  it('renders an accessible SVG mark with the provided label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement.querySelector('.logo');
    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Zarlania home');
    expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
  });
});
