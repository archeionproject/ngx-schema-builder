import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { BadgeDirective } from '../src/lib/components/ui/badge.directive';
import { ButtonDirective } from '../src/lib/components/ui/button.directive';
import { InputDirective } from '../src/lib/components/ui/input.directive';
import { LabelDirective } from '../src/lib/components/ui/label.directive';
import { SwitchComponent } from '../src/lib/components/ui/switch.component';

@Component({
  standalone: true,
  imports: [
    ButtonDirective,
    BadgeDirective,
    InputDirective,
    LabelDirective,
    SwitchComponent,
  ],
  template: `
    <button libJsonjoyButton [variant]="variant()" [size]="size()">x</button>
    <span libJsonjoyBadge variant="destructive">b</span>
    <input libJsonjoyInput />
    <label libJsonjoyLabel>l</label>
    <lib-jsonjoy-switch [(checked)]="on" [disabled]="disabled()" ariaLabel="t" />
  `,
})
class HostComponent {
  readonly variant = signal<'default' | 'outline' | 'ghost'>('default');
  readonly size = signal<'default' | 'sm'>('default');
  readonly on = signal(false);
  readonly disabled = signal(false);
}

describe('ui primitives', () => {
  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('button applies variant + size classes', () => {
    const fixture = render();
    const btn = fixture.debugElement.query(By.directive(ButtonDirective));
    expect(btn.nativeElement.className.length).toBeGreaterThan(0);

    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();
    expect(btn.nativeElement.className.length).toBeGreaterThan(0);
  });

  it('badge, input and label render with host classes', () => {
    const fixture = render();
    for (const dir of [BadgeDirective, InputDirective, LabelDirective]) {
      const el = fixture.debugElement.query(By.directive(dir)).nativeElement;
      expect(el.className.length).toBeGreaterThan(0);
    }
  });

  it('switch toggles on click and keyboard, respects disabled', () => {
    const fixture = render();
    const sw = fixture.debugElement.query(By.directive(SwitchComponent));

    sw.nativeElement.click();
    expect(fixture.componentInstance.on()).toBe(true);

    sw.triggerEventHandler('keydown.space', new KeyboardEvent('keydown'));
    expect(fixture.componentInstance.on()).toBe(false);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    sw.nativeElement.click();
    expect(fixture.componentInstance.on()).toBe(false);
  });
});
