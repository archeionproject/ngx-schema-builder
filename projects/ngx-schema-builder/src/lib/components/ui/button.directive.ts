import { Directive, computed, input } from '@angular/core';

import { cn } from '../../internal/cn';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

/**
 * Pure helper to compose the button class string. Equivalent of React's
 * `buttonVariants` from `ui/button.tsx`. Exported so non-DOM contexts
 * (e.g. dynamic class assignment) can compute the same string.
 */
export function buttonVariants(
  options: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
  } = {},
): string {
  const { variant = 'default', size = 'default', className } = options;
  return cn(
    BUTTON_BASE,
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );
}

/**
 * Applies the jsonjoy button styling to a native `<button>` or `<a>`.
 *
 * Idiomatic usage:
 * ```html
 * <button libJsonjoyButton variant="destructive" size="sm">Delete</button>
 * ```
 *
 * Native attributes (`type`, `disabled`, `form`, `aria-*`) are kept on the
 * host element — this directive only contributes Tailwind classes.
 */
@Directive({
  selector: 'button[libJsonjoyButton], a[libJsonjoyButton]',
  standalone: true,
  host: {
    '[class]': 'classes()',
  },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('default');

  protected readonly classes = computed(() =>
    buttonVariants({ variant: this.variant(), size: this.size() }),
  );
}
