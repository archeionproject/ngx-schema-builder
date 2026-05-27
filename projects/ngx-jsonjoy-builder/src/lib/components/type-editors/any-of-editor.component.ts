import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import type {
  JsonSchema,
  ObjectJsonSchema,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import type { EnumChangeContext } from '../schema-editor-internal/type-editor.component';

/**
 * Thin wrapper around `CombinatorEditorComponent` pre-bound to
 * `combinator="anyOf"`. Mirrors `AnyOfEditor.tsx`, which exists in
 * the React project for the same legacy reason. Deliverable 4 will
 * render `<lib-jsonjoy-combinator-editor combinator="anyOf" ...>`.
 */
@Component({
  selector: 'lib-jsonjoy-any-of-editor',
  standalone: true,
  template: '<!-- TODO (deliverable 4): port AnyOfEditor.tsx -->',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
})
export class AnyOfEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly schemaKey = input<string | undefined>(undefined);
  readonly depth = input<number>(0);

  readonly schemaChange = output<ObjectJsonSchema>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();
}
