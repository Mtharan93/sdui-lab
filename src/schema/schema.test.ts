import { describe, it, expect } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  SCHEMA_VERSION_V1,
  SCHEMA_VERSION_V2,
  ScreenDocumentV1Schema,
  ScreenDocumentV2Schema,
  formatZodPath,
  isSafeImageUrl,
  validateRawDocument,
} from './index';

describe('schema constants', () => {
  it('uses v2 as current schema version', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(SCHEMA_VERSION_V2);
    expect(SCHEMA_VERSION_V1).toBe(1);
    expect(SCHEMA_VERSION_V2).toBe(2);
  });
});

describe('formatZodPath', () => {
  it('formats root and nested object/array paths cleanly', () => {
    expect(formatZodPath([])).toBe('(root)');
    expect(formatZodPath(['version'])).toBe('version');
    expect(formatZodPath(['root', 'children', 2, 'props', 'label'])).toBe(
      'root.children[2].props.label',
    );
    expect(formatZodPath(['children', 0, 'props', 'items', 1, 'label'])).toBe(
      'children[0].props.items[1].label',
    );
  });
});

describe('isSafeImageUrl', () => {
  it('allows https, http, and root-relative paths while rejecting unsafe schemes', () => {
    expect(isSafeImageUrl('https://example.com/photo.png')).toBe(true);
    expect(isSafeImageUrl('http://localhost:3000/img.jpg')).toBe(true);
    expect(isSafeImageUrl('/favicon.svg')).toBe(true);

    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeImageUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeImageUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeImageUrl('//evil.example.com/payload.png')).toBe(false);
    expect(isSafeImageUrl('')).toBe(false);
  });
});

describe('ScreenDocumentV2Schema', () => {
  it('validates a complete v2 document covering all 8 node types', () => {
    const doc = {
      version: 2,
      screenId: 'demo-all-nodes',
      title: 'All Nodes Demo',
      initialState: {
        name: 'Ada',
        showExtra: true,
        count: 3,
      },
      root: {
        id: 'root-stack',
        type: 'Stack',
        props: { direction: 'column', gap: 'md' },
        children: [
          {
            id: 'heading',
            type: 'Text',
            props: { content: 'Hello {{state.name}}', variant: 'h1' },
          },
          {
            id: 'hero-img',
            type: 'Image',
            props: { src: '/favicon.svg', alt: 'SDUI Lab logo', width: 48, height: 48 },
          },
          {
            id: 'profile-card',
            type: 'Card',
            props: { title: 'Profile', subtitle: 'Account details', elevated: true },
            children: [
              {
                id: 'name-input',
                type: 'Input',
                props: {
                  name: 'name',
                  label: 'Display name',
                  inputType: 'text',
                  placeholder: 'Enter your name',
                  required: true,
                },
              },
              {
                id: 'save-btn',
                type: 'Button',
                props: {
                  label: 'Save',
                  variant: 'primary',
                  action: { type: 'setState', key: 'saved', value: true },
                },
              },
            ],
          },
          {
            id: 'feature-list',
            type: 'List',
            props: {
              ordered: false,
              items: [
                'Plain string item',
                { id: 'item-2', label: 'Structured item', description: 'With details' },
              ],
            },
          },
          {
            id: 'conditional-note',
            type: 'Conditional',
            props: { stateKey: 'showExtra', equals: true },
            children: [
              {
                id: 'extra-text',
                type: 'Text',
                props: { content: 'Extra details visible', variant: 'caption' },
              },
            ],
          },
        ],
      },
    };

    const result = ScreenDocumentV2Schema.safeParse(doc);
    expect(result.success).toBe(true);
  });

  it('reports readable JSON paths for nested invalid props', () => {
    const invalidDoc = {
      version: 2,
      screenId: 'broken',
      title: 'Broken Screen',
      root: {
        id: 'root',
        type: 'Stack',
        props: { direction: 'column' },
        children: [
          { id: 't1', type: 'Text', props: { content: 'ok' } },
          { id: 't2', type: 'Text', props: { content: 'also ok' } },
          { id: 'b1', type: 'Button', props: { label: '' } },
        ],
      },
    };

    const result = validateRawDocument(invalidDoc);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some((i) => i.path === 'root.children[2].props.label')).toBe(true);
    }
  });

  it('rejects unknown node types with a path pointing to the offending node', () => {
    const unknownNodeDoc = {
      version: 2,
      screenId: 'unknown-node',
      title: 'Unknown Node',
      root: {
        id: 'root',
        type: 'Stack',
        props: {},
        children: [{ id: 'x', type: 'Marquee', props: {} }],
      },
    };

    const result = validateRawDocument(unknownNodeDoc);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues[0]?.path).toContain('root.children[0]');
    }
  });

  it('rejects javascript: URLs in Image props', () => {
    const unsafeDoc = {
      version: 2,
      screenId: 'unsafe-img',
      title: 'Unsafe Image',
      root: {
        id: 'img',
        type: 'Image',
        props: { src: 'javascript:alert(1)', alt: 'bad' },
      },
    };

    const result = validateRawDocument(unsafeDoc);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some((i) => i.path === 'root.props.src')).toBe(true);
    }
  });
});

describe('ScreenDocumentV1Schema', () => {
  it('validates a legacy v1 document', () => {
    const v1Doc = {
      version: 1,
      screenId: 'legacy-welcome',
      title: 'Legacy Welcome',
      root: {
        id: 'root',
        type: 'Stack',
        props: { orientation: 'vertical', gap: 'md' },
        children: [
          { id: 'title', type: 'Text', props: { value: 'Welcome', size: 'lg' } },
          { id: 'go', type: 'Button', props: { label: 'Next', navigateTo: 'settings' } },
        ],
      },
    };

    expect(ScreenDocumentV1Schema.safeParse(v1Doc).success).toBe(true);
    const validation = validateRawDocument(v1Doc);
    expect(validation.valid).toBe(true);
    if (validation.valid) {
      expect(validation.version).toBe(1);
    }
  });

  it('rejects unsupported or missing document versions', () => {
    expect(validateRawDocument({ screenId: 'a', title: 'b' })).toEqual({
      valid: false,
      issues: [
        {
          path: 'version',
          message: 'Missing required version field (expected 1 or 2)',
          code: 'invalid_literal',
        },
      ],
    });

    expect(validateRawDocument({ version: 99 })).toEqual({
      valid: false,
      issues: [
        {
          path: 'version',
          message: 'Unsupported schema version 99. Expected 1 or 2',
          code: 'invalid_literal',
        },
      ],
    });
  });
});
