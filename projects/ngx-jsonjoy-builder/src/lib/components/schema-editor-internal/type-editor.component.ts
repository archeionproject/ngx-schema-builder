import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import {
  getEditorType,
  type JsonSchema,
  type ObjectJsonSchema,
} from '../../types/json-schema';
import type { ValidationTreeNode } from '../../types/validation';
import { ArrayEditorComponent } from '../type-editors/array-editor.component';
import { BooleanEditorComponent } from '../type-editors/boolean-editor.component';
import {
  CombinatorEditorComponent,
  type CombinatorKind,
} from '../type-editors/combinator-editor.component';
import { NumberEditorComponent } from '../type-editors/number-editor.component';
import { ObjectEditorComponent } from '../type-editors/object-editor.component';
import { StringEditorComponent } from '../type-editors/string-editor.component';

export interface EnumChangeContext {
  readonly value: string | number | boolean;
  readonly index: number;
  readonly schemaKey?: string;
}

@Component({
  selector: 'lib-jsonjoy-type-editor',
  standalone: true,
  imports: [
    ArrayEditorComponent,
    BooleanEditorComponent,
    CombinatorEditorComponent,
    NumberEditorComponent,
    ObjectEditorComponent,
    StringEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
  template: `
    @switch (editorType()) {
      @case ('string') {
        <lib-jsonjoy-string-editor
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @case ('number') {
        <lib-jsonjoy-number-editor
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @case ('integer') {
        <lib-jsonjoy-number-editor
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          [integer]="true"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @case ('boolean') {
        <lib-jsonjoy-boolean-editor
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @case ('object') {
        <lib-jsonjoy-object-editor
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @case ('array') {
        <lib-jsonjoy-array-editor
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @case ('anyOf') {
        <lib-jsonjoy-combinator-editor
          combinator="anyOf"
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @case ('oneOf') {
        <lib-jsonjoy-combinator-editor
          combinator="oneOf"
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @case ('allOf') {
        <lib-jsonjoy-combinator-editor
          combinator="allOf"
          [schema]="schema()"
          [readOnly]="readOnly()"
          [validationNode]="validationNode()"
          [schemaKey]="schemaKey()"
          [depth]="depth()"
          (schemaChange)="schemaChange.emit($event)"
          (addEnum)="addEnum.emit($event)"
          (deleteEnum)="deleteEnum.emit($event)"
        />
      }
      @default {
        <p class="text-sm text-muted-foreground italic">
          Unsupported editor type: {{ editorType() }}
        </p>
      }
    }
  `,
})
export class TypeEditorComponent {
  readonly schema = input.required<JsonSchema>();
  readonly readOnly = input.required<boolean>();
  readonly validationNode = input<ValidationTreeNode | undefined>(undefined);
  readonly schemaKey = input<string | undefined>(undefined);
  readonly depth = input<number>(0);

  readonly schemaChange = output<ObjectJsonSchema>();
  readonly addEnum = output<EnumChangeContext>();
  readonly deleteEnum = output<EnumChangeContext>();

  protected readonly editorType = computed(() => getEditorType(this.schema()));
}

export type { CombinatorKind };
