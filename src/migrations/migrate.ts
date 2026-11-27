import {
  SCHEMA_VERSION_V1,
  SCHEMA_VERSION_V2,
  ScreenDocumentV2Schema,
  validateRawDocument,
  type ScreenDocumentV2,
  type ValidationIssue,
} from '@/schema';
import { migrateV1ToV2 } from './v1ToV2';

export type MigrationResult =
  | {
      ok: true;
      document: ScreenDocumentV2;
      migratedFrom: typeof SCHEMA_VERSION_V1 | null;
      notes: string[];
    }
  | {
      ok: false;
      issues: ValidationIssue[];
    };

/**
 * Validates an arbitrary JSON document (v1 or v2) and migrates v1 documents
 * to the current v2 schema.
 */
export function migrateDocument(input: unknown): MigrationResult {
  const validation = validateRawDocument(input);
  if (!validation.valid) {
    return { ok: false, issues: validation.issues };
  }

  if (
    validation.version === SCHEMA_VERSION_V2 &&
    validation.document.version === SCHEMA_VERSION_V2
  ) {
    return {
      ok: true,
      document: validation.document,
      migratedFrom: null,
      notes: [],
    };
  }

  if (
    validation.version === SCHEMA_VERSION_V1 &&
    validation.document.version === SCHEMA_VERSION_V1
  ) {
    const migrated = migrateV1ToV2(validation.document);
    const verified = ScreenDocumentV2Schema.safeParse(migrated);
    if (!verified.success) {
      return {
        ok: false,
        issues: verified.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: `Post-migration validation error: ${issue.message}`,
          code: issue.code,
        })),
      };
    }

    return {
      ok: true,
      document: verified.data,
      migratedFrom: SCHEMA_VERSION_V1,
      notes: [
        'Migrated schema v1 -> v2: Stack.orientation -> direction, Text.value/size -> content/variant, Button.navigateTo -> action.',
      ],
    };
  }

  return {
    ok: false,
    issues: [{ path: 'version', message: 'Unsupported schema version', code: 'custom' }],
  };
}
