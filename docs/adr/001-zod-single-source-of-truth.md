# ADR 001: Zod as Single Source of Truth for Schemas and Types

## Status

Accepted

## Context

A server-driven UI runtime receives untrusted or version-skewed JSON over the wire. If TypeScript interfaces are maintained separately from runtime validation checks, the two inevitably drift: TypeScript claims a prop is required while the runtime forgets to validate it, or vice versa.

## Decision

Define every node props schema, action union, state map, and document envelope in Zod (`src/schema/`), and derive all compile-time TypeScript types via `z.infer<typeof Schema>`. For the recursive `SduiNode` tree, `SduiNodeSchema` is annotated with `z.ZodType<SduiNode>` against the `NodePropsMap` derived from the individual Zod prop schemas so any schema change fails `tsc` immediately until aligned.

## Consequences

- **Pros:** Zero drift between compile-time types and runtime validation; detailed JSON-path issues via `ZodError`; component registry enforces that every registered component provides a matching Zod schema.
- **Cons:** Zod adds ~55.75 kB minified (~12.80 kB gzipped in the standalone chunk) to the client bundle and adds per-node validation cost during rendering.
- **Alternatives considered:** JSON Schema + Ajv (lighter runtime after codegen, weaker ergonomic TS inference without extra build steps) or hand-written type guards (prone to drift).
