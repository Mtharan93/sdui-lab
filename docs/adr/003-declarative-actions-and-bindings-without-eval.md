# ADR 003: Declarative Actions and Hand-Written Bindings Without `eval`

## Status

Accepted

## Context

SDUI documents often need dynamic text (such as greeting the user by name) and user interactions (navigating, updating local screen state, opening a confirmation dialog). Evaluating arbitrary JavaScript expressions or callbacks embedded in JSON (`eval`, `new Function`, or `dangerouslySetInnerHTML`) turns any compromised payload, CDN cache, or CMS edit into an XSS / arbitrary code execution vulnerability.

## Decision

1. **Bindings (`src/runtime/binding.ts`):** Implement a small hand-written tokenizer for `{{...}}` placeholders that only resolves `state.<identifier>` paths against local screen state using `Object.hasOwn`. Disallowed roots (`window`, `alert(1)`, expressions) render `[blocked: ...]`, prototype keys (`__proto__`, `constructor`, `prototype`) are rejected, and missing state keys render `[unknown: state.<key>]`.
2. **Actions (`src/schema/actions.ts`, `src/runtime/actions.ts`):** Restrict button actions to a closed Zod discriminated union (`navigate`, `setState`, `openDialog`) validated at runtime before execution.
3. **URLs (`src/schema/v2.ts`):** Image `src` values are validated via `isSafeImageUrl` to allow only `http:`, `https:`, or root-relative `/` paths, blocking `javascript:` and `data:text/html` payloads.

## Consequences

- **Pros:** Strong XSS resistance even if JSON comes from untrusted or third-party sources; predictable, testable behavior; no `CSP` `unsafe-eval` requirement.
- **Cons:** Expressiveness is deliberately limited—no inline arithmetic, formatting helpers, or arbitrary event handlers without extending the schema and client runtime.
- **Alternatives considered:** Sandboxed expression interpreter (e.g., Jexl/filtrex)—more expressive, but larger surface area and harder to audit for a minimal runtime.
