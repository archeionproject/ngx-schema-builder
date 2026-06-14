import { Directive, computed, input } from '@angular/core';

import { cn } from '../../internal/cn';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const BADGE_BASE =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2';

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default:
    'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary:
    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive:
    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground',
};

export function badgeVariants(
  options: { variant?: BadgeVariant; className?: string } = {},
): string {
  const { variant = 'default', className } = options;
  return cn(BADGE_BASE, BADGE_VARIANTS[variant], className);
}

@Directive({
  selector: 'div[libJsonjoyBadge], span[libJsonjoyBadge]',
  standalone: true,
  host: { '[class]': 'classes()' },
})
export class BadgeDirective {
  readonly variant = input<BadgeVariant>('default');
  protected readonly classes = computed(() =>
    badgeVariants({ variant: this.variant() }),
  );
}
