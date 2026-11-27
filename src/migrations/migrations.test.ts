import { describe, it, expect } from 'vitest';
import { ScreenDocumentV2Schema, type ScreenDocumentV1 } from '@/schema';
import { migrateDocument, migrateRawV1BestEffort, migrateV1ToV2 } from './index';

describe('migrateV1ToV2', () => {
  it('migrates Stack.orientation, Text.value/size, and Button.navigateTo across nested nodes', () => {
    const v1Doc: ScreenDocumentV1 = {
      version: 1,
      screenId: 'legacy-onboarding',
      title: 'Legacy Onboarding',
      initialState: { user: 'Grace' },
      root: {
        id: 'root',
        type: 'Stack',
        props: { orientation: 'vertical', gap: 'lg' },
        children: [
          {
            id: 'headline',
            type: 'Text',
            props: { value: 'Welcome, {{state.user}}', size: 'lg' },
          },
          {
            id: 'row',
            type: 'Stack',
            props: { orientation: 'horizontal', gap: 'sm' },
            children: [
              {
                id: 'subtitle',
                type: 'Text',
                props: { value: 'Pick an option', size: 'md' },
              },
              {
                id: 'footnote',
                type: 'Text',
                props: { value: 'v1 footer', size: 'sm' },
              },
            ],
          },
          {
            id: 'card',
            type: 'Card',
            props: { title: 'Continue' },
            children: [
              {
                id: 'next-btn',
                type: 'Button',
                props: { label: 'Go to Settings', navigateTo: 'settings', disabled: false },
              },
              {
                id: 'noop-btn',
                type: 'Button',
                props: { label: 'Static Button' },
              },
            ],
          },
        ],
      },
    };

    const v2Doc = migrateV1ToV2(v1Doc);
    expect(ScreenDocumentV2Schema.safeParse(v2Doc).success).toBe(true);
    expect(v2Doc.version).toBe(2);
    expect(v2Doc.initialState).toEqual({ user: 'Grace' });

    expect(v2Doc.root.type).toBe('Stack');
    if (v2Doc.root.type === 'Stack') {
      expect(v2Doc.root.props.direction).toBe('column');
      expect(v2Doc.root.props.gap).toBe('lg');
    }

    const headline = v2Doc.root.children?.[0];
    expect(headline?.type).toBe('Text');
    if (headline?.type === 'Text') {
      expect(headline.props.content).toBe('Welcome, {{state.user}}');
      expect(headline.props.variant).toBe('h2');
    }

    const row = v2Doc.root.children?.[1];
    if (row?.type === 'Stack') {
      expect(row.props.direction).toBe('row');
      const sub = row.children?.[0];
      const foot = row.children?.[1];
      if (sub?.type === 'Text') {
        expect(sub.props.variant).toBe('body');
      }
      if (foot?.type === 'Text') {
        expect(foot.props.variant).toBe('caption');
      }
    }

    const card = v2Doc.root.children?.[2];
    const nextBtn = card?.children?.[0];
    const noopBtn = card?.children?.[1];
    if (nextBtn?.type === 'Button') {
      expect(nextBtn.props.action).toEqual({ type: 'navigate', target: 'settings' });
      expect(nextBtn.props.disabled).toBe(false);
    }
    if (noopBtn?.type === 'Button') {
      expect(noopBtn.props.action).toBeUndefined();
    }
  });
});

describe('migrateDocument', () => {
  it('migrates valid v1 documents and records migratedFrom: 1', () => {
    const result = migrateDocument({
      version: 1,
      screenId: 'old',
      title: 'Old Screen',
      root: {
        id: 'root',
        type: 'Text',
        props: { value: 'Hello', size: 'lg' },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.migratedFrom).toBe(1);
      expect(result.document.version).toBe(2);
      expect(result.notes).toHaveLength(1);
    }
  });

  it('passes v2 documents through untouched with migratedFrom: null', () => {
    const result = migrateDocument({
      version: 2,
      screenId: 'current',
      title: 'Current Screen',
      root: {
        id: 'root',
        type: 'Text',
        props: { content: 'Up to date', variant: 'body' },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.migratedFrom).toBeNull();
      expect(result.notes).toEqual([]);
    }
  });

  it('returns structured path issues when given invalid v1 or v2 input', () => {
    const result = migrateDocument({
      version: 1,
      screenId: 'bad-v1',
      title: 'Bad',
      root: {
        id: 'root',
        type: 'Stack',
        props: { orientation: 'diagonal' },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'root.props.orientation')).toBe(true);
    }
  });
});

describe('migrateRawV1BestEffort', () => {
  it('migrates valid v1 siblings while leaving malformed nodes untouched for runtime isolation', () => {
    const partialBrokenV1 = {
      version: 1,
      screenId: 'partial-v1',
      title: 'Partial V1',
      root: {
        id: 'root',
        type: 'Stack',
        props: { orientation: 'horizontal' },
        children: [
          { id: 'ok', type: 'Text', props: { value: 'Hello', size: 'lg' } },
          { id: 'bad', type: 'FutureWidget', props: { foo: 1 } },
        ],
      },
    };

    const migrated = migrateRawV1BestEffort(partialBrokenV1);
    expect(migrated).toMatchObject({
      version: 2,
      root: {
        props: { direction: 'row' },
        children: [
          { id: 'ok', type: 'Text', props: { content: 'Hello', variant: 'h2' } },
          { id: 'bad', type: 'FutureWidget', props: { foo: 1 } },
        ],
      },
    });
  });
});
