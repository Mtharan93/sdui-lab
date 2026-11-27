import { describe, it, expect } from 'vitest';
import { resolveBindingExpression, resolveBindings, tokenizeTemplate } from './binding';

describe('tokenizeTemplate', () => {
  it('splits literals and binding tokens accurately', () => {
    expect(tokenizeTemplate('Hello {{state.name}}, count={{ state.count }}!')).toEqual([
      { kind: 'literal', text: 'Hello ' },
      { kind: 'binding', rawExpr: 'state.name' },
      { kind: 'literal', text: ', count=' },
      { kind: 'binding', rawExpr: 'state.count' },
      { kind: 'literal', text: '!' },
    ]);
  });

  it('preserves unclosed braces literally without crashing', () => {
    expect(tokenizeTemplate('Hello {{state.name')).toEqual([
      { kind: 'literal', text: 'Hello ' },
      { kind: 'literal', text: '{{state.name' },
    ]);
  });
});

describe('resolveBindings', () => {
  it('resolves valid local state paths for strings, numbers, booleans, and null', () => {
    const state = {
      name: 'Ada',
      retries: 3,
      enabled: true,
      note: null,
      'user.role': 'admin',
    };

    expect(resolveBindings('Hi {{state.name}} ({{state.retries}})', state)).toBe('Hi Ada (3)');
    expect(resolveBindings('Active: {{state.enabled}}', state)).toBe('Active: true');
    expect(resolveBindings('Note: {{state.note}}', state)).toBe('Note: [null]');
    expect(resolveBindings('Role: {{state.user.role}}', state)).toBe('Role: admin');
  });

  it('renders visible fallback for unknown paths instead of undefined', () => {
    const result = resolveBindings('Hello {{state.missingName}}!', { name: 'Ada' });
    expect(result).toBe('Hello [unknown: state.missingName]!');
    expect(result).not.toContain('undefined');
  });

  it('blocks malicious inputs, global access, expressions, and prototype keys', () => {
    const state = { name: 'Ada' };

    expect(resolveBindings('{{window.location}}', state)).toBe('[blocked: window.location]');
    expect(resolveBindings('{{alert(1)}}', state)).toBe('[blocked: alert(1)]');
    expect(resolveBindings('{{1 + 1}}', state)).toBe('[blocked: 1 + 1]');
    expect(resolveBindings('{{state.__proto__}}', state)).toBe('[blocked: state.__proto__]');
    expect(resolveBindings('{{state.constructor}}', state)).toBe('[blocked: state.constructor]');
    expect(resolveBindings('{{state.prototype}}', state)).toBe('[blocked: state.prototype]');
    expect(resolveBindings('{{state.toString}}', state)).toBe('[unknown: state.toString]');
    expect(resolveBindings('{{}}', state)).toBe('[invalid binding: empty]');

    expect(resolveBindingExpression('state.name;alert(1)', state)).toEqual({
      ok: false,
      fallback: '[blocked: state.name;alert(1)]',
    });
  });
});
