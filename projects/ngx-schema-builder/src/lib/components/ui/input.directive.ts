import { Directive } from '@angular/core';

const INPUT_CLASSES =
  'flex h-10 w-full rounded-md border border-input bg-[var(--color-input-bg)] px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

/**
 * Applies the jsonjoy text-input styling to a native `<input>`. Mirrors
 * React's `ui/input.tsx` (which is a styled native input). Value binding
 * uses Angular's standard form mechanisms: `[ngModel]`, `[formControl]`,
 * `[value]` + `(input)` — this directive only contributes classes.
 */
@Directive({
  selector: 'input[libJsonjoyInput]',
  standalone: true,
  host: {
    class: INPUT_CLASSES,
  },
})
export class InputDirective {}
