import type { ValidationIssue } from '@/schema';
import './runtime.css';

export interface NodeFallbackProps {
  nodeId: string;
  path: string;
  reason: string;
  issues?: ValidationIssue[] | undefined;
}

/**
 * Accessible inline fallback rendered when a single node fails schema validation,
 * references an unregistered node type, or throws during React rendering.
 */
export function NodeFallback({ nodeId, path, reason, issues }: NodeFallbackProps) {
  return (
    <div
      role="status"
      aria-label={`Fallback for node at ${path}`}
      data-sdui-fallback={nodeId}
      className="sdui-fallback"
    >
      <div className="sdui-fallback__header">
        <span>Component unavailable</span>
        <code className="sdui-fallback__path">{path}</code>
      </div>
      <p className="sdui-fallback__message">{reason}</p>
      {issues && issues.length > 0 && (
        <details className="sdui-fallback__details">
          <summary>Validation details ({issues.length})</summary>
          <ul className="sdui-fallback__list">
            {issues.map((issue, idx) => (
              <li key={`${issue.path}-${String(idx)}`}>
                {issue.path}: {issue.message}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
