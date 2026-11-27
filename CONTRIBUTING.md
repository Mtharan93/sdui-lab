# Contributing to sdui-lab

Thanks for taking a look at `sdui-lab`. Keep contributions small, well-typed, and tested.

## Development Workflow

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run local checks before opening a PR:
   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```
3. Run Playwright E2E smoke tests:
   ```bash
   pnpm exec playwright install chromium
   pnpm test:e2e
   ```

## Guidelines

- **Strict TypeScript:** No `any`, no unexplained type assertions, and keep `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` passing.
- **Schema first:** Define runtime schemas in `src/schema/` with Zod and infer TypeScript types from them.
- **No unsafe execution:** Never introduce `eval`, `new Function`, or `dangerouslySetInnerHTML`.
- **Accessibility:** New components must use semantic HTML and pass `jest-axe` checks in unit tests.
- **Honest benchmarks:** If you change runtime or component behavior, re-run `pnpm measure:tradeoffs --write` and commit updated numbers rather than editing metrics by hand.
