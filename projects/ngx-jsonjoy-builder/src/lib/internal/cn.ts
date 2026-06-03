import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Translation } from '../i18n/translation-keys';
import type { SchemaEditorType } from '../types/json-schema';

/**
 * Compose Tailwind class names with conflict resolution.
 * 1:1 port of jsonjoy-builder's `lib/utils.ts#cn`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const typeColorClasses: Record<SchemaEditorType, string> = {
  string: 'text-blue-500 bg-blue-50',
  number: 'text-purple-500 bg-purple-50',
  integer: 'text-purple-500 bg-purple-50',
  boolean: 'text-green-500 bg-green-50',
  object: 'text-orange-500 bg-orange-50',
  array: 'text-pink-500 bg-pink-50',
  null: 'text-gray-500 bg-gray-50',
  anyOf: 'text-teal-500 bg-teal-50',
  oneOf: 'text-cyan-500 bg-cyan-50',
  allOf: 'text-indigo-500 bg-indigo-50',
  $ref: 'text-amber-600 bg-amber-50',
};

export function getTypeColor(type: SchemaEditorType): string {
  return typeColorClasses[type];
}

export function getTypeLabel(t: Translation, type: SchemaEditorType): string {
  switch (type) {
    case 'string':
      return t.schemaTypeString;
    case 'number':
    case 'integer':
      return t.schemaTypeNumber;
    case 'boolean':
      return t.schemaTypeBoolean;
    case 'object':
      return t.schemaTypeObject;
    case 'array':
      return t.schemaTypeArray;
    case 'null':
      return t.schemaTypeNull;
    case 'anyOf':
      return t.schemaTypeAnyOf;
    case 'oneOf':
      return t.schemaTypeOneOf;
    case 'allOf':
      return t.schemaTypeAllOf;
    case '$ref':
      return t.schemaTypeRef;
  }
}
