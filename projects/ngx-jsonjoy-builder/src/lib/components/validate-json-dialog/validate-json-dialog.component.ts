import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import { JsonjoyTranslationService } from '../../services/translation.service';
import type { JsonSchema } from '../../types/json-schema';
// import type { ValidationResult } from '../../core/json-validator'; (deliverable 4)

/**
 * Angular equivalent of React `<ValidateJsonDialog>`. Opens a CDK Dialog
 * with two Monaco editors: one writable (user JSON), one read-only
 * (current schema). Validation runs debounced as the user types.
 */
@Component({
  selector: 'lib-jsonjoy-validate-json-dialog',
  standalone: true,
  imports: [
    // TODO (deliverable 4): DialogComponent, JsonjoyMonacoEditorDirective, LucideAngularModule.
  ],
  templateUrl: './validate-json-dialog.component.html',
  styleUrls: ['./validate-json-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
})
export class ValidateJsonDialogComponent {
  readonly open = model<boolean>(false);
  readonly schema = input.required<JsonSchema>();
  readonly autoFocus = input<boolean>(true);
  readonly locale = input<Translation | undefined>(undefined);
  readonly messages = input<Partial<Translation> | undefined>(undefined);

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.withOverrides(this.locale, this.messages);

  protected readonly jsonInput = signal('');
  // protected readonly validationResult = signal<ValidationResult | null>(null);  // deliverable 4

  // TODO (deliverable 4):
  //   - debounced effect that calls validateJson(jsonInput(), schema())
  //   - goToError(line, column) → reveal in Monaco
}
