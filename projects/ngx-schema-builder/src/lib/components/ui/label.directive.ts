import { Directive } from '@angular/core';

const LABEL_CLASSES =
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

/**
 * Applies the jsonjoy label styling to a native `<label>`. Mirrors
 * React's `ui/label.tsx`. Use the standard `for` attribute (Angular
 * template syntax handles it natively) or `for="elementId"` to link
 * to the labelled control.
 */
@Directive({
  selector: 'label[libJsonjoyLabel]',
  standalone: true,
  host: {
    class: LABEL_CLASSES,
  },
})
export class LabelDirective {}
