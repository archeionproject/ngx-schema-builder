import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * Compact toggle-style button used by the type selector chips.
 * Mirrors `ui/button-toggle.tsx`. Active/inactive styling is left
 * to the consumer via the `active` flag and standard host classes.
 */
@Component({
  selector: 'lib-jsonjoy-button-toggle',
  standalone: true,
  template: '<!-- TODO (deliverable 4): port ui/button-toggle.tsx -->',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
})
export class ButtonToggleComponent {
  readonly active = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly buttonClick = output<MouseEvent>();
}
