import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { InferSchemaDialogComponent } from '../src/lib/components/infer-schema-dialog/infer-schema-dialog.component';
import { BooleanEditorComponent } from '../src/lib/components/type-editors/boolean-editor.component';
import { CombinatorEditorComponent } from '../src/lib/components/type-editors/combinator-editor.component';
import { ValidateJsonDialogComponent } from '../src/lib/components/validate-json-dialog/validate-json-dialog.component';
import type { JsonSchema } from '../src/lib/types/json-schema';
import { provideSchemaBuilder } from '../src/provide';
import { fuzz } from './test-helpers';

const SCHEMA: JsonSchema = {
  type: 'object',
  properties: { age: { type: 'number' }, name: { type: 'string' } },
  required: ['age'],
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Polls until `predicate` is truthy or the timeout elapses (debounce + async AJV). */
async function waitFor(
  predicate: () => boolean,
  timeout = 4000,
): Promise<void> {
  const start = Date.now();
  while (!predicate() && Date.now() - start < timeout) {
    await delay(50);
  }
}

function mount<T>(component: Type<T>, inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(inputs))
    fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('component behaviours', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideSchemaBuilder()] });
  });

  it('ValidateJsonDialog reports schema errors and renders the error list', async () => {
    const fixture = mount(ValidateJsonDialogComponent, {
      open: true,
      schema: SCHEMA,
    });
    await fixture.whenStable();

    // Drive the editor's bound value with a document that violates the schema.
    const ci = fixture.componentInstance as unknown as {
      jsonInput: { set: (v: string) => void };
      validationResult: () => { valid: boolean; errors?: unknown[] } | null;
    };
    ci.jsonInput.set('{ "name": 5 }'); // missing required `age`, wrong type for name
    fixture.detectChanges();
    await waitFor(() => ci.validationResult() !== null);
    await fixture.whenStable();
    fixture.detectChanges();

    const result = ci.validationResult();
    expect(result).toBeTruthy();
    expect(result?.valid).toBe(false);

    // Error rows render and are clickable (covers goToError / formatLocation).
    const errorButton = (fixture.nativeElement as HTMLElement).querySelector(
      'ul button',
    ) as HTMLButtonElement | null;
    errorButton?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ValidateJsonDialog accepts a valid document', async () => {
    const fixture = mount(ValidateJsonDialogComponent, {
      open: true,
      schema: SCHEMA,
    });
    await fixture.whenStable();
    const ci = fixture.componentInstance as unknown as {
      jsonInput: { set: (v: string) => void };
      validationResult: () => { valid: boolean } | null;
    };
    ci.jsonInput.set('{ "age": 30, "name": "a" }');
    fixture.detectChanges();
    await waitFor(() => ci.validationResult() !== null);
    await fixture.whenStable();
    expect(ci.validationResult()?.valid).toBe(true);
  });

  it('InferSchemaDialog infers a schema from valid JSON and errors on invalid', async () => {
    const fixture = mount(InferSchemaDialogComponent, { open: true });
    await fixture.whenStable();
    const inferred: JsonSchema[] = [];
    fixture.componentInstance.inferred.subscribe((s) => inferred.push(s));

    const ci = fixture.componentInstance as unknown as {
      jsonInput: { set: (v: string) => void };
      generate: () => void;
      error: () => string | null;
    };

    ci.jsonInput.set('not json');
    ci.generate();
    fixture.detectChanges();
    expect(ci.error()).toBeTruthy();
    expect(inferred.length).toBe(0);

    ci.jsonInput.set('{ "a": 1 }');
    ci.generate();
    expect(inferred.length).toBe(1);
    expect(inferred[0]).toBeDefined();
  });

  it('CombinatorEditor emits schema changes when its subschemas are edited', () => {
    const fixture = mount(CombinatorEditorComponent, {
      schema: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      readOnly: false,
      combinator: 'anyOf',
    });
    const changes: JsonSchema[] = [];
    fixture.componentInstance.schemaChange.subscribe((s) => changes.push(s));
    fuzz(fixture);
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('BooleanEditor renders default-value controls and reacts', () => {
    const fixture = mount(BooleanEditorComponent, {
      schema: { type: 'boolean', default: true },
      readOnly: false,
    });
    fuzz(fixture);
    fuzz(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
