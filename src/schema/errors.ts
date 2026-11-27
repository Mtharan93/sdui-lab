import { z } from 'zod';
import { ScreenDocumentV1Schema } from './v1';
import { ScreenDocumentV2Schema } from './v2';
import { SCHEMA_VERSION_V1, SCHEMA_VERSION_V2 } from './constants';

export interface ValidationIssue {
  path: string;
  message: string;
  code: string;
}

/**
 * Formats a Zod path array like ['root', 'children', 2, 'props', 'label']
 * into a human-readable JSON path like 'root.children[2].props.label'.
 */
export function formatZodPath(path: readonly (string | number)[]): string {
  if (path.length === 0) {
    return '(root)';
  }
  return path.reduce<string>((acc, segment, index) => {
    if (typeof segment === 'number') {
      return `${acc}[${String(segment)}]`;
    }
    if (index === 0) {
      return segment;
    }
    return `${acc}.${segment}`;
  }, '');
}

/**
 * Formats a ZodError into deduplicated, readable ValidationIssue objects.
 */
export function formatZodIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: formatZodPath(issue.path),
    message: issue.message,
    code: issue.code,
  }));
}

export interface DocumentValidationSuccess {
  valid: true;
  version: typeof SCHEMA_VERSION_V1 | typeof SCHEMA_VERSION_V2;
  document: z.infer<typeof ScreenDocumentV1Schema> | z.infer<typeof ScreenDocumentV2Schema>;
}

export interface DocumentValidationFailure {
  valid: false;
  issues: ValidationIssue[];
}

export type DocumentValidationResult = DocumentValidationSuccess | DocumentValidationFailure;

/**
 * Validates an unknown JSON payload against supported screen document schemas (v1 or v2).
 * Checks version first so errors point inside the matching schema instead of producing
 * generic union-branch noise.
 */
export function validateRawDocument(input: unknown): DocumentValidationResult {
  const versionEnvelope = z.object({ version: z.unknown() }).safeParse(input);
  if (!versionEnvelope.success || Array.isArray(input)) {
    return {
      valid: false,
      issues: [
        {
          path: '(root)',
          message: 'Screen document must be a JSON object',
          code: 'invalid_type',
        },
      ],
    };
  }

  const version = versionEnvelope.data.version;

  if (version === SCHEMA_VERSION_V1) {
    const result = ScreenDocumentV1Schema.safeParse(input);
    if (result.success) {
      return { valid: true, version: SCHEMA_VERSION_V1, document: result.data };
    }
    return { valid: false, issues: formatZodIssues(result.error) };
  }

  if (version === SCHEMA_VERSION_V2) {
    const result = ScreenDocumentV2Schema.safeParse(input);
    if (result.success) {
      return { valid: true, version: SCHEMA_VERSION_V2, document: result.data };
    }
    return { valid: false, issues: formatZodIssues(result.error) };
  }

  return {
    valid: false,
    issues: [
      {
        path: 'version',
        message:
          version === undefined
            ? 'Missing required version field (expected 1 or 2)'
            : `Unsupported schema version ${JSON.stringify(version)}. Expected 1 or 2`,
        code: 'invalid_literal',
      },
    ],
  };
}
