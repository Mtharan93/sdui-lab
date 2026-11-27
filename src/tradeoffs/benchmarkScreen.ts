import type { ScreenDocumentV2 } from '@/schema';

/**
 * Shared screen specification used by the Trade-offs comparison:
 * rendered both as Hand-Written React and via SduiRenderer.
 */
export const BENCHMARK_INITIAL_STATE = {
  displayName: 'Ada Lovelace',
  role: 'Staff Engineer',
  showChecklist: true,
} as const;

export const BENCHMARK_CHECKLIST_ITEMS = [
  {
    id: 'b1',
    label: 'Strict schema validation',
    description: 'Every node prop is checked against Zod at runtime.',
  },
  {
    id: 'b2',
    label: 'Per-node error boundaries',
    description: 'Isolates render errors to a single component.',
  },
  {
    id: 'b3',
    label: 'Declarative actions & bindings',
    description: 'Zero eval, zero dynamic code execution.',
  },
] as const;

export const BENCHMARK_SCREEN_DOC: ScreenDocumentV2 = {
  version: 2,
  screenId: 'tradeoff-benchmark',
  title: 'Workspace Profile',
  initialState: {
    displayName: BENCHMARK_INITIAL_STATE.displayName,
    role: BENCHMARK_INITIAL_STATE.role,
    showChecklist: BENCHMARK_INITIAL_STATE.showChecklist,
  },
  root: {
    id: 'bench-root',
    type: 'Stack',
    props: { direction: 'column', gap: 'md' },
    children: [
      {
        id: 'bench-heading',
        type: 'Text',
        props: { content: 'Profile: {{state.displayName}}', variant: 'h3' },
      },
      {
        id: 'bench-role',
        type: 'Text',
        props: { content: 'Role: {{state.role}}', variant: 'caption', tone: 'muted' },
      },
      {
        id: 'bench-card',
        type: 'Card',
        props: { title: 'Edit Details', headingLevel: 'h3', elevated: true },
        children: [
          {
            id: 'bench-name-input',
            type: 'Input',
            props: {
              name: 'displayName',
              label: 'Display name',
              placeholder: 'Enter name',
            },
          },
          {
            id: 'bench-role-input',
            type: 'Input',
            props: {
              name: 'role',
              label: 'Role',
              placeholder: 'Enter role',
            },
          },
          {
            id: 'bench-actions',
            type: 'Stack',
            props: { direction: 'row', gap: 'sm', wrap: true },
            children: [
              {
                id: 'bench-toggle-btn',
                type: 'Button',
                props: {
                  label: 'Hide checklist',
                  variant: 'secondary',
                  action: { type: 'setState', key: 'showChecklist', value: false },
                },
              },
              {
                id: 'bench-show-btn',
                type: 'Button',
                props: {
                  label: 'Show checklist',
                  variant: 'primary',
                  action: { type: 'setState', key: 'showChecklist', value: true },
                },
              },
            ],
          },
        ],
      },
      {
        id: 'bench-conditional',
        type: 'Conditional',
        props: { stateKey: 'showChecklist', equals: true },
        children: [
          {
            id: 'bench-list',
            type: 'List',
            props: {
              ordered: true,
              items: BENCHMARK_CHECKLIST_ITEMS.map((item) => ({
                id: item.id,
                label: item.label,
                description: item.description,
              })),
            },
          },
        ],
      },
    ],
  },
};
