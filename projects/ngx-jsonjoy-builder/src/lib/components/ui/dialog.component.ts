import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';

/**
 * Dialog primitive. Mirrors `ui/dialog.tsx` (the React file composes
 * Radix Dialog primitives). The Angular implementation in deliverable
 * 4 will instead delegate to `@angular/cdk/dialog`'s imperative
 * `Dialog.open()` so consumers can opt into either:
 *
 *   - the component-driven `[(open)]` API (this component), or
 *   - direct `Dialog.open(MyContentCmp, {...})` calls (CDK pattern).
 *
 * The skeleton declares the `open` model + `dismiss` output that map
 * 1:1 to `Dialog.Root`'s `open` / `onOpenChange`.
 */
@Component({
  selector: 'lib-jsonjoy-dialog',
  standalone: true,
  template: '<!-- TODO (deliverable 4): port ui/dialog.tsx (CDK Dialog) -->',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
})
export class DialogComponent {
  readonly open = model<boolean>(false);
  readonly title = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly disableClose = input<boolean>(false);

  readonly dismiss = output<void>();
}
