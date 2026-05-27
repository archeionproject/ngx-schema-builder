import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import { JsonjoyTranslationService } from '../../services/translation.service';
import type { JsonSchema } from '../../types/json-schema';

/**
 * Angular equivalent of React `<InferSchemaDialog>`. Opens a CDK Dialog
 * containing a Monaco editor; on submit, infers a JSON Schema from the
 * pasted document and emits via `inferred`.
 */
@Component({
  selector: 'lib-jsonjoy-infer-schema-dialog',
  standalone: true,
  imports: [
    // TODO (deliverable 4): DialogComponent, JsonjoyMonacoEditorDirective, ButtonComponent.
  ],
  templateUrl: './infer-schema-dialog.component.html',
  styleUrls: ['./infer-schema-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
})
export class InferSchemaDialogComponent {
  /** Open state. Two-way bindable via `[(open)]`. */
  readonly open = model<boolean>(false);
  readonly autoFocus = input<boolean>(true);
  readonly locale = input<Translation | undefined>(undefined);
  readonly messages = input<Partial<Translation> | undefined>(undefined);

  /** Emits the inferred schema when the user confirms generation. */
  readonly inferred = output<JsonSchema>();

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.withOverrides(this.locale, this.messages);

  protected readonly jsonInput = signal('');
  protected readonly error = signal<string | null>(null);

  // TODO (deliverable 4):
  //   - inferSchemaFromJson() with try/catch + createSchemaFromJson()
  //   - close() resets jsonInput + error and sets open=false
}
