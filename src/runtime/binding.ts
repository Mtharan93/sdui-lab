import type { StateMap, StateValue } from '@/schema';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;

export type BindingToken = { kind: 'literal'; text: string } | { kind: 'binding'; rawExpr: string };

/**
 * Hand-written scanner for `{{...}}` template tokens.
 * Intentionally avoids eval, Function, or nested expression evaluation.
 */
export function tokenizeTemplate(template: string): BindingToken[] {
  const tokens: BindingToken[] = [];
  let cursor = 0;

  while (cursor < template.length) {
    const openIdx = template.indexOf('{{', cursor);
    if (openIdx === -1) {
      tokens.push({ kind: 'literal', text: template.slice(cursor) });
      break;
    }

    if (openIdx > cursor) {
      tokens.push({ kind: 'literal', text: template.slice(cursor, openIdx) });
    }

    const closeIdx = template.indexOf('}}', openIdx + 2);
    if (closeIdx === -1) {
      // Unclosed delimiter: preserve literal text rather than throwing.
      tokens.push({ kind: 'literal', text: template.slice(openIdx) });
      break;
    }

    const rawExpr = template.slice(openIdx + 2, closeIdx).trim();
    tokens.push({ kind: 'binding', rawExpr });
    cursor = closeIdx + 2;
  }

  return tokens;
}

export type BindingLookupResult = { ok: true; value: StateValue } | { ok: false; fallback: string };

/**
 * Resolves a single binding expression (without braces) strictly against local `state`.
 * Only `state.<identifier>` (or dot-separated safe identifiers) is permitted.
 */
export function resolveBindingExpression(rawExpr: string, state: StateMap): BindingLookupResult {
  if (rawExpr.length === 0) {
    return { ok: false, fallback: '[invalid binding: empty]' };
  }

  const segments = rawExpr.split('.');
  const root = segments[0];
  if (root !== 'state' || segments.length < 2) {
    return { ok: false, fallback: `[blocked: ${rawExpr}]` };
  }

  const keySegments = segments.slice(1);
  for (const seg of keySegments) {
    if (FORBIDDEN_KEYS.has(seg) || !IDENTIFIER_RE.test(seg)) {
      return { ok: false, fallback: `[blocked: ${rawExpr}]` };
    }
  }

  const stateKey = keySegments.join('.');
  if (!Object.hasOwn(state, stateKey)) {
    return { ok: false, fallback: `[unknown: ${rawExpr}]` };
  }

  const value = state[stateKey];
  if (value === undefined) {
    return { ok: false, fallback: `[unknown: ${rawExpr}]` };
  }

  return { ok: true, value };
}

function formatStateValue(value: StateValue): string {
  if (value === null) {
    return '[null]';
  }
  return String(value);
}

/**
 * Resolves all `{{state.path}}` placeholders in a string against local screen state.
 * Unknown or disallowed expressions render a visible fallback string, never `undefined`.
 */
export function resolveBindings(template: string, state: StateMap): string {
  if (!template.includes('{{')) {
    return template;
  }

  return tokenizeTemplate(template)
    .map((token) => {
      if (token.kind === 'literal') {
        return token.text;
      }
      const result = resolveBindingExpression(token.rawExpr, state);
      return result.ok ? formatStateValue(result.value) : result.fallback;
    })
    .join('');
}

export function isSafeStateKey(key: string): boolean {
  return key.length > 0 && !FORBIDDEN_KEYS.has(key);
}
