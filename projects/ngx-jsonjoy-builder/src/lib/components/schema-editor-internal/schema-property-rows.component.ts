import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import type { JsonSchema, ObjectJsonSchema } from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { SchemaPropertyEditorComponent } from './schema-property-editor.component';
import type { EnumChangeContext } from './type-editor.component';

interface PropertyRow {
  readonly name: string;
  readonly schema: JsonSchema;
  readonly required: boolean;
}

function joinSchemaKey(prefix: string | undefined, name: string): string {
  return prefix ? `${prefix}.${name}` : name;
}

@Component({
  selector: 'lib-jsonjoy-schema-property-rows',
  standalone: true,
  imports: [SchemaPropertyEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy contents' },
  template: `
    @for (property of properties(); track property.name) {
      <lib-jsonjoy-schema-property-editor
        mode="property"
        [name]="property.name"
        [schema]="property.schema"
        [schemaKey]="schemaKeyFor(property.name)"
        [required]="property.required"
        [readOnly]="readOnly()"
        [autoFocus]="autoFocus()"
        [depth]="depth()"
        [validationNode]="validationChildren()?.[property.name]"
        (delete)="deleteProperty.emit(property.name)"
        (nameChange)="nameChange.emit({ oldName: property.name, newName: $event })"
        (requiredChange)="requiredChange.emit({ name: property.name, required: $event })"
        (schemaChange)="schemaChange.emit({ name: property.name, schema: $event })"
        (addEnum)="addEnum.emit($event)"
        (deleteEnum)="deleteEnum.emit($event)"
      />
    }
    @for (property of patternProperties(); track 'pattern:' + property.name) {
      <lib-jsonjoy-schema-property-editor
        mode="pattern"
        [name]="property.name"
        [schema]="property.schema"
        [schemaKey]="schemaKeyFor(property.name)"
        [readOnly]="readOnly()"
        [autoFocus]="autoFocus()"
        [depth]="depth()"
        [validationNode]="validationChildren()?.['pattern:' + property.name]"
        (delete)="deletePatternProperty.emit(property.name)"
        (nameChange)="patternNameChange.emit({ oldName: property.name, newName: $event })"
        (schemaChange)="patternSchemaChange.emit({ name: property.name, schema: $event })"
        (addEnum)="addEnum.emit($event)"
        (deleteEnum)="deleteEnum.emit($event)"
      />
    }
  `,
})
export class SchemaPropertyRowsComponent {
  readonly properties = input.required<readonly PropertyRow[]>();
  readonly patternProperties = input.required<readonly PropertyRow[]>();
  readonly readOnly = input.required<boolean>();
  readonly autoFocus = input<boolean>(true);
  readonly depth = input<number>(0);
  readonly schemaKeyPrefix = input<string | undefined>(undefined);
  readonly validationChildren = input<Record<string, ValidationTreeNode> | undefined>(undefined);

  readonly deleteProperty = output<string>();
  readonly deletePatternProperty = output<string>();
  readonly nameChange = output<{ oldName: string; newName: string }>();
  readonly patternNameChange = output<{ oldName: string; newName: string }>();
  readonly requiredChange = output<{ name: string; required: boolean }>();
  readonly schemaChange = output<{ name: string; schema: ObjectJsonSchema }>();
  readonly patternSchemaChange = output<{ name: string; schema: ObjectJsonSchema }>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  protected schemaKeyFor(name: string): string {
    return joinSchemaKey(this.schemaKeyPrefix(), name);
  }
}
