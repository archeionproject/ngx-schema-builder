import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
} from '@angular/core';

import type { Translation } from '../../i18n/translation-keys';
import { JsonjoyTranslationService } from '../../services/translation.service';
import type { JsonSchema } from '../../types/json-schema';

/**
 * Angular equivalent of React `<SchemaJsonEditor>`. Renders only the
 * Monaco-backed JSON source editor with the JSON Schema draft-07
 * meta-schema enabled.
 */
@Component({
  selector: 'lib-jsonjoy-schema-json-editor',
  standalone: true,
  imports: [
    // TODO (deliverable 4): JsonjoyMonacoEditorDirective, LucideAngularModule.
  ],
  templateUrl: './schema-json-editor.component.html',
  styleUrls: ['./schema-json-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jsonjoy' },
})
export class SchemaJsonEditorComponent {
  readonly value = model<JsonSchema>({ type: 'object' });
  readonly defaultValue = input<JsonSchema | undefined>(undefined);
  readonly readOnly = input<boolean>(false);
  readonly autoFocus = input<boolean>(true);
  readonly locale = input<Translation | undefined>(undefined);
  readonly messages = input<Partial<Translation> | undefined>(undefined);

  private readonly translations = inject(JsonjoyTranslationService);
  protected readonly t = this.translations.withOverrides(this.locale, this.messages);

  // TODO (deliverable 4):
  //   - JSON.stringify(value(), null, 2) <-> string text bridge
  //   - try/catch parse on text change; ignore parse errors (Monaco surfaces them)
  //   - handleDownload via Blob + anchor click
}
