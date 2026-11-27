import type { ValidationIssue } from '@/schema';

export interface ValidationPanelProps {
  syntaxError: string | null;
  issues: ValidationIssue[];
  migratedFrom: number | null;
}

export function ValidationPanel({ syntaxError, issues, migratedFrom }: ValidationPanelProps) {
  if (syntaxError !== null) {
    return (
      <div role="alert" className="playground__status playground__status--error">
        <strong>JSON syntax error:</strong> {syntaxError}
      </div>
    );
  }

  if (issues.length > 0) {
    return (
      <div role="status" className="playground__status playground__status--error">
        <strong>
          Schema validation found {issues.length} {issues.length === 1 ? 'issue' : 'issues'}:
        </strong>
        <ul className="playground__error-list">
          {issues.map((issue, idx) => (
            <li key={`${issue.path}-${String(idx)}`}>
              <code className="playground__error-path">{issue.path}</code>: {issue.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (migratedFrom !== null) {
    return (
      <div role="status" className="playground__status playground__status--migrated">
        Valid v{migratedFrom} document — automatically migrated to v2 for rendering.
      </div>
    );
  }

  return (
    <div role="status" className="playground__status playground__status--ok">
      Valid v2 screen document.
    </div>
  );
}
