import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { JsonjoyEditorDirective, type JsonjoyEditorHandle } from '../src/lib/internal/editor.directive';

@Component({
  standalone: true,
  imports: [JsonjoyEditorDirective],
  template: `<div
    libJsonjoyEditor
    [(value)]="value"
    [readOnly]="readOnly()"
    [schema]="schema()"
    (mounted)="onMounted($event)"
  ></div>`,
})
class HostComponent {
  readonly value = signal('{}');
  readonly readOnly = signal(false);
  readonly schema = signal<object | undefined>(undefined);
  handle: JsonjoyEditorHandle | null = null;
  onMounted(h: JsonjoyEditorHandle): void {
    this.handle = h;
  }
}

describe('JsonjoyEditorDirective', () => {
  it('mounts a CodeMirror editor and emits a handle', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.componentInstance;
    expect(host.handle).not.toBeNull();
    expect(host.handle?.getValue()).toBe('{}');
  });

  it('reflects external value writes and reads back edits', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;

    host.value.set('{ "a": 1 }');
    fixture.detectChanges();
    expect(host.handle?.getValue()).toBe('{ "a": 1 }');

    host.handle?.setValue('{ "b": 2 }');
    expect(host.handle?.getValue()).toBe('{ "b": 2 }');
  });

  it('exposes focus/layout/revealError without throwing', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const handle = fixture.componentInstance.handle!;
    expect(() => {
      handle.focus();
      handle.layout();
      handle.revealError(1, 1);
    }).not.toThrow();
  });
});
