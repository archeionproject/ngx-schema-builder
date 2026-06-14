import { ComponentFixture } from '@angular/core/testing';

/**
 * jsdom does not implement a handful of browser APIs the components touch
 * (native <dialog> modality, blob downloads). Importing this module installs
 * no-op/standin implementations so interaction tests don't trip over them.
 * These are environment shims only — they don't change component behaviour.
 */
const dialogProto = HTMLDialogElement.prototype as unknown as {
  showModal: () => void;
  close: () => void;
};
dialogProto.showModal = function (this: HTMLDialogElement) {
  this.open = true;
};
dialogProto.close = function (this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};

(URL as unknown as { createObjectURL: () => string }).createObjectURL = () =>
  'blob:test';
(URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {};
// Anchor.click() triggers a jsdom "navigation not implemented" error; the
// download helper only needs the click not to throw.
HTMLAnchorElement.prototype.click = function () {};

/**
 * Fires input/change/blur/click over every interactive element in a rendered
 * component to drive its event handlers. Used to exercise template branches
 * and output paths without hand-wiring every control.
 */
export function fuzz(fixture: ComponentFixture<unknown>): void {
  const root = fixture.nativeElement as HTMLElement;

  root.querySelectorAll('input').forEach((el) => {
    const input = el as HTMLInputElement;
    if (input.type === 'checkbox') input.checked = !input.checked;
    else input.value = input.type === 'number' ? '4' : 'changed';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  fixture.detectChanges();

  root.querySelectorAll('select').forEach((el) => {
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  fixture.detectChanges();

  root.querySelectorAll('button').forEach((btn) => {
    (btn as HTMLButtonElement).click();
    fixture.detectChanges();
  });
  fixture.detectChanges();
}
