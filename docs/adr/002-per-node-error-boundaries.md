# ADR 002: Per-Node Error Boundaries and Validation Isolation

## Status

Accepted

## Context

In a traditional React app, a broken component prop fails at compile time. In SDUI, a backend deploy, A/B experiment, or stale cached document can deliver one malformed node (for example, an unknown `type` introduced in a newer app version, invalid props, or a runtime throw inside a component) alongside ten valid sibling nodes.

## Decision

Validate and render each node independently in `SduiRenderer` (`src/runtime/renderer.tsx`) and wrap every rendered node in `NodeErrorBoundary` (`src/runtime/ErrorBoundary.tsx`). Invalid or unknown nodes render an accessible `NodeFallback` (`role="status"`) displaying the JSON path and error details, while valid siblings continue rendering and remain interactive. Error boundaries automatically reset when the node's `resetKey` (serialized type and props) changes.

## Consequences

- **Pros:** Partial screen degradation instead of white-screen crashes; clear diagnostic feedback in the Playground; recoverable editing when JSON is repaired.
- **Cons:** Adds an extra React component boundary (`NodeErrorBoundary`) per SDUI node, increasing element tree depth and slightly increasing mount/update overhead compared to hand-written JSX.
- **Alternatives considered:** Screen-level validation gate that rejects the entire document on a single node error (safer against partial UI, worse resilience for backwards-compatible client rollouts).
