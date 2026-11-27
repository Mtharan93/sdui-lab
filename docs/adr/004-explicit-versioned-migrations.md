# ADR 004: Explicit Versioned Schema Migrations

## Status

Accepted

## Context

Once clients ship with a baked-in SDUI schema, servers still serve older documents (cached payloads, older feature flags, or multi-version client fleets). Implicitly accepting every legacy prop alias inside React components scatters compatibility branches across the UI layer and hides technical debt.

## Decision

Maintain explicit versioned schemas (`ScreenDocumentV1Schema` in `src/schema/v1.ts` and `ScreenDocumentV2Schema` in `src/schema/v2.ts`) and pure, unit-tested migration functions (`migrateV1ToV2` and `migrateRawV1BestEffort` in `src/migrations/v1ToV2.ts`). Legacy documents are transformed at the boundary before reaching components, so React node components only ever see v2 props.

The v1-to-v2 breaking changes modeled here:

- `Stack.props.orientation` (`vertical` / `horizontal`) -> `Stack.props.direction` (`column` / `row`)
- `Text.props.value` + `Text.props.size` (`sm` / `md` / `lg`) -> `Text.props.content` + semantic `Text.props.variant` (`caption` / `body` / `h2`)
- `Button.props.navigateTo` string -> `Button.props.action` (`{ type: 'navigate', target }`)

## Consequences

- **Pros:** UI components stay simple and single-version; migrations are pure functions that are trivial to unit-test; breaking changes are documented in one place.
- **Cons:** Every breaking schema change adds another hop to the migration chain (`v1 -> v2 -> v3`) that must be maintained until old payloads age out.
- **Alternatives considered:** Supporting all legacy prop shapes inside each component with `props.content ?? props.value`—quicker short term, brittle over multiple versions.
