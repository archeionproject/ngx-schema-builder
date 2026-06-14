import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SchemaPropertyEditorComponent } from '../src/lib/components/schema-editor-internal/schema-property-editor.component';
import { SchemaFieldsEditorComponent } from '../src/lib/components/schema-fields-editor/schema-fields-editor.component';
import { CombinatorEditorComponent } from '../src/lib/components/type-editors/combinator-editor.component';
import { asObjectSchema } from '../src/lib/types/json-schema';
import type { JsonSchema, NewField } from '../src/lib/types/json-schema';
import { provideSchemaBuilder } from '../src/provide';

function mount<T>(component: Type<T>, inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(inputs))
    fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const evt = (value: string) => ({ target: { value } }) as unknown as Event;
const focusEvt = () =>
  ({ target: document.createElement('input') }) as unknown as FocusEvent;
const field = (over: Partial<NewField> = {}): NewField => ({
  name: 'f',
  type: 'string',
  required: false,
  description: '',
  ...over,
});

describe('SchemaFieldsEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  function setup() {
    const fixture = mount(SchemaFieldsEditorComponent, {
      value: {
        type: 'object',
        properties: { a: { type: 'string' } },
        patternProperties: { '^x': { type: 'number' } },
        required: ['a'],
        $defs: { Foo: { type: 'object' } },
      } satisfies JsonSchema,
      readOnly: false,
    });
    return { fixture, ci: fixture.componentInstance as any };
  }

  it('adds, edits and deletes properties', () => {
    const { fixture, ci } = setup();
    ci.handleAddField(field({ name: 'b', type: 'number' }));
    expect(
      asObjectSchema(fixture.componentInstance.value()).properties?.['b'],
    ).toBeDefined();

    ci.handleEditField({
      name: 'a',
      field: field({ name: 'renamed', type: 'string' }),
    });
    expect(
      asObjectSchema(fixture.componentInstance.value()).properties?.['a'],
    ).toBeUndefined();

    ci.handleDeleteField('renamed');
    ci.handleDeleteField('b');
    expect(
      asObjectSchema(fixture.componentInstance.value()).properties ?? {},
    ).toEqual({});
  });

  it('adds, edits and deletes pattern properties', () => {
    const { fixture, ci } = setup();
    ci.handleAddPatternField(field({ name: '^y', type: 'string' }));
    ci.handleEditPatternField({
      name: '^x',
      field: field({ name: '^z', type: 'number' }),
    });
    ci.handleDeletePatternField('^z');
    ci.handleDeletePatternField('^y');
    expect(fixture.componentInstance.value()).toBeDefined();
  });

  it('reports definitions and switches tabs', () => {
    const { ci } = setup();
    expect(ci.hasDefinitions()).toBe(true);
    expect(ci.definitionsCount()).toBeGreaterThanOrEqual(1);

    ci.activeTab.set('definitions');
    expect(ci.tabClasses('definitions')).toBeDefined();
    ci.activeTab.set('properties');
    expect(ci.tabClasses('properties')).toBeDefined();
  });

  it('changes the root type', () => {
    const { fixture, ci } = setup();
    ci.onRootTypeChange(evt('array'));
    expect(asObjectSchema(fixture.componentInstance.value()).type).toBe(
      'array',
    );
    ci.onRootTypeChange(evt('string'));
    ci.onRootTypeChange(evt('object'));
    expect(asObjectSchema(fixture.componentInstance.value()).type).toBe(
      'object',
    );
  });
});

describe('CombinatorEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('adds, edits and removes options', () => {
    const fixture = mount(CombinatorEditorComponent, {
      schema: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      readOnly: false,
      combinator: 'anyOf',
    });
    const ci = fixture.componentInstance as any;
    const changes: JsonSchema[] = [];
    fixture.componentInstance.schemaChange.subscribe((s) => changes.push(s));

    ci.onAddOption();
    ci.onOptionTypeChange(0, 'boolean');
    ci.onOptionSchemaChange(1, { type: 'integer' });
    ci.onDescriptionInput(0, evt('desc'));
    ci.onDescriptionBlur(0, focusEvt());
    ci.onDescriptionEnter({
      preventDefault() {},
      target: { blur() {} },
    } as unknown as Event);
    ci.toggleExpanded(ci.childKey(0));
    ci.selectAll(focusEvt());
    expect(ci.optionSchemaKey(0)).toBeDefined();
    ci.onRemoveOption(0);

    expect(changes.length).toBeGreaterThan(0);
  });
});

describe('SchemaPropertyEditor handlers', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] }),
  );

  it('drives name/description/title/default editing, type and required toggles', () => {
    const fixture = mount(SchemaPropertyEditorComponent, {
      name: 'prop',
      schema: { type: 'object', properties: { c: { type: 'string' } } },
      readOnly: false,
      required: false,
      mode: 'property',
    });
    const ci = fixture.componentInstance as any;
    const names: string[] = [];
    const reqs: boolean[] = [];
    const schemas: JsonSchema[] = [];
    fixture.componentInstance.nameChange.subscribe((n) => names.push(n));
    fixture.componentInstance.requiredChange.subscribe((r) => reqs.push(r));
    fixture.componentInstance.schemaChange.subscribe((s) => schemas.push(s));

    ci.toggleExpanded();
    ci.beginEditName();
    ci.onTempNameInput(evt('renamed'));
    ci.submitName();
    expect(names).toContain('renamed');

    ci.beginEditDesc();
    ci.onTempDescInput(evt('a description'));
    ci.submitDesc();

    ci.onTempTitleInput(evt('Title'));
    ci.submitTitle();
    ci.onTempDefaultInput(evt('{"x":1}'));
    ci.submitDefault();

    ci.onTypeChange('number');
    ci.onChildSchemaChange({ type: 'object', properties: {} });
    ci.toggleRequired();
    ci.selectAll(focusEvt());

    expect(reqs.length).toBeGreaterThan(0);
    expect(schemas.length).toBeGreaterThan(0);
  });
});
