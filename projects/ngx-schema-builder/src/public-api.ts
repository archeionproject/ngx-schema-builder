/*
 * Public API surface of ngx-schema-builder.
 *
 * The React-side equivalents from `jsonjoy-builder` map to these exports
 * as follows:
 *
 *   <SchemaBuilder>          → <lib-jsonjoy-schema-builder>          (SchemaBuilderComponent)
 *   <SchemaFieldsEditor>     → <lib-jsonjoy-schema-fields-editor>    (SchemaFieldsEditorComponent)
 *   <SchemaJsonEditor>       → <lib-jsonjoy-schema-json-editor>      (SchemaJsonEditorComponent)
 *   <InferSchemaDialog>      → <lib-jsonjoy-infer-schema-dialog>     (InferSchemaDialogComponent)
 *   <ValidateJsonDialog>     → <lib-jsonjoy-validate-json-dialog>    (ValidateJsonDialogComponent)
 *   <SchemaBuilderProvider>  → provideSchemaBuilder({ locale, messages }) + SCHEMA_BUILDER_CONFIG
 *   useSchemaBuilderConfig() → inject(SCHEMA_BUILDER_CONFIG, { optional: true })
 */

// --- Schema types & helpers --------------------------------------------------
export type {
  JsonSchema,
  ObjectJsonSchema,
  SchemaType,
  SchemaEditorType,
  RefJsonSchema,
  NewField,
  SchemaEditorState,
} from './lib/types/json-schema';
export {
  isBooleanSchema,
  isObjectSchema,
  asObjectSchema,
  getSchemaDescription,
  withObjectSchema,
  isAnyOfSchema,
  isOneOfSchema,
  isAllOfSchema,
  isRefSchema,
  asRefSchema,
  getEditorType,
} from './lib/types/json-schema';

// --- Schema inference (pure functions) --------------------------------------
export { inferSchema, createSchemaFromJson } from './lib/internal/schema-inference';

// --- JSON validation (AJV; lazy-loaded) -------------------------------------
export type { ValidationError, ValidationResult } from './lib/internal/json-validator';
export { validateJson, findLineNumberForPath } from './lib/internal/json-validator';

// --- Type-level constraint validation (zod-backed) ---------------------------
export type {
  TypeValidationResult,
  ValidationTreeNode,
} from './lib/types/validation';
export {
  getTypeValidation,
  validateSchemaByType,
  buildValidationTree,
} from './lib/types/validation';

// --- Localization ------------------------------------------------------------
export type { Translation } from './lib/i18n/translation-keys';
export { en } from './lib/i18n/locales/en';
export { it } from './lib/i18n/locales/it';
// Further locales may be added in future releases. Until then, supply your
// own via `provideSchemaBuilder({ locale })` or the per-component `locale`
// input using the exported `Translation` contract.

// --- Library configuration & DI ---------------------------------------------
export type { SchemaBuilderConfig, RefSuggestion, RefSuggestionsFactory } from './lib/interfaces';
export { SCHEMA_BUILDER_CONFIG, SCHEMA_BUILDER_REF_SUGGESTIONS } from './lib/tokens';
export { provideSchemaBuilder, provideSchemaBuilderRefSuggestions } from './provide';

// --- Public components -------------------------------------------------------
export {
  SchemaBuilderComponent,
  type SchemaBuilderMode,
} from './lib/components/schema-builder/schema-builder.component';
export { SchemaFieldsEditorComponent } from './lib/components/schema-fields-editor/schema-fields-editor.component';
export { SchemaJsonEditorComponent } from './lib/components/schema-json-editor/schema-json-editor.component';
export { InferSchemaDialogComponent } from './lib/components/infer-schema-dialog/infer-schema-dialog.component';
export { ValidateJsonDialogComponent } from './lib/components/validate-json-dialog/validate-json-dialog.component';

// --- Public callback context types ------------------------------------------
// Surfaces through the enum add/delete outputs of the internal type editors.
// Re-exported so downstream consumers who handle those outputs can name the
// payload type. The component class itself stays internal.
export type { EnumChangeContext } from './lib/components/schema-editor-internal/type-editor.component';
