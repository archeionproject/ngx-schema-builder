import { en } from '../src/lib/i18n/locales/en';
import { cn, getTypeColor, getTypeLabel } from '../src/lib/internal/cn';
import type { SchemaEditorType } from '../src/lib/types/json-schema';

describe('cn', () => {
  it('joins truthy class values', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values and resolves Tailwind conflicts', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

const allTypes: SchemaEditorType[] = [
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
  'anyOf',
  'oneOf',
  'allOf',
  '$ref',
];

describe('getTypeColor', () => {
  it('returns a class string for every editor type', () => {
    for (const type of allTypes) {
      expect(getTypeColor(type)).toMatch(/text-.+ bg-.+/);
    }
  });
});

describe('getTypeLabel', () => {
  it('returns a localized label for every editor type', () => {
    for (const type of allTypes) {
      expect(typeof getTypeLabel(en, type)).toBe('string');
      expect(getTypeLabel(en, type).length).toBeGreaterThan(0);
    }
  });

  it('maps integer to the number label', () => {
    expect(getTypeLabel(en, 'integer')).toBe(getTypeLabel(en, 'number'));
  });
});
