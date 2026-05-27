import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';

@Component({
  selector: 'lib-jsonjoy-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'jsonjoy peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
    role: 'switch',
    tabindex: '0',
    '[attr.aria-checked]': 'checked()',
    '[attr.data-state]': 'dataState()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(click)': 'onClick()',
    '(keydown.space)': 'onKeydownActivate($event)',
    '(keydown.enter)': 'onKeydownActivate($event)',
  },
  template: `
    <span
      class="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      [attr.data-state]="dataState()"
    ></span>
  `,
})
export class SwitchComponent {
  readonly checked = model<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly dataState = computed(() =>
    this.checked() ? 'checked' : 'unchecked',
  );

  protected onClick(): void {
    if (this.disabled()) return;
    this.checked.update((v) => !v);
  }

  protected onKeydownActivate(event: Event): void {
    event.preventDefault();
    this.onClick();
  }
}
