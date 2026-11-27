export interface PlaygroundExample {
  id: string;
  label: string;
  description: string;
  document: unknown;
}

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    id: 'welcome',
    label: '1. Interactive Onboarding (v2)',
    description: 'State binding ({{state.name}}), Input, Conditional, and declarative actions.',
    document: {
      version: 2,
      screenId: 'welcome',
      title: 'Welcome Onboarding',
      initialState: {
        name: 'Ada Lovelace',
        showChecklist: false,
      },
      root: {
        id: 'root-stack',
        type: 'Stack',
        props: { direction: 'column', gap: 'md' },
        children: [
          {
            id: 'hero-title',
            type: 'Text',
            props: { content: 'Hello, {{state.name}}', variant: 'h2' },
          },
          {
            id: 'hero-sub',
            type: 'Text',
            props: {
              content: 'Edit the JSON on the left or interact with the controls below.',
              variant: 'body',
              tone: 'muted',
            },
          },
          {
            id: 'profile-card',
            type: 'Card',
            props: {
              title: 'Profile Setup',
              subtitle: 'Local state updates bindings without eval.',
              elevated: true,
              headingLevel: 'h3',
            },
            children: [
              {
                id: 'name-input',
                type: 'Input',
                props: {
                  name: 'name',
                  label: 'Display name',
                  placeholder: 'Type your name',
                  helperText: 'Bound directly to state.name',
                  required: true,
                },
              },
              {
                id: 'btn-row',
                type: 'Stack',
                props: { direction: 'row', gap: 'sm', wrap: true },
                children: [
                  {
                    id: 'toggle-btn',
                    type: 'Button',
                    props: {
                      label: 'Show checklist',
                      variant: 'primary',
                      action: { type: 'setState', key: 'showChecklist', value: true },
                    },
                  },
                  {
                    id: 'dialog-btn',
                    type: 'Button',
                    props: {
                      label: 'Preview greeting',
                      variant: 'secondary',
                      action: {
                        type: 'openDialog',
                        title: 'Greeting for {{state.name}}',
                        body: 'Rendered from a validated declarative openDialog action.',
                      },
                    },
                  },
                  {
                    id: 'nav-btn',
                    type: 'Button',
                    props: {
                      label: 'Open Settings',
                      variant: 'ghost',
                      action: { type: 'navigate', target: 'settings' },
                    },
                  },
                ],
              },
            ],
          },
          {
            id: 'checklist-conditional',
            type: 'Conditional',
            props: { stateKey: 'showChecklist', equals: true },
            children: [
              {
                id: 'checklist-card',
                type: 'Card',
                props: { title: 'Onboarding Checklist', headingLevel: 'h3' },
                children: [
                  {
                    id: 'checklist-items',
                    type: 'List',
                    props: {
                      ordered: true,
                      items: [
                        { id: 'c1', label: 'Confirm name: {{state.name}}' },
                        {
                          id: 'c2',
                          label: 'Validate node schemas',
                          description: 'Every node is checked by Zod before render.',
                        },
                      ],
                    },
                  },
                  {
                    id: 'hide-btn',
                    type: 'Button',
                    props: {
                      label: 'Hide checklist',
                      variant: 'secondary',
                      action: { type: 'setState', key: 'showChecklist', value: false },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'settings',
    label: '2. Account Settings (v2)',
    description: 'Demonstrates multi-screen navigation target, Image, and state toggles.',
    document: {
      version: 2,
      screenId: 'settings',
      title: 'Account Settings',
      initialState: {
        email: 'ada@analyticalengine.org',
        alertsPaused: false,
      },
      root: {
        id: 'settings-root',
        type: 'Stack',
        props: { direction: 'column', gap: 'md' },
        children: [
          {
            id: 'settings-header',
            type: 'Stack',
            props: { direction: 'row', gap: 'md', align: 'center' },
            children: [
              {
                id: 'avatar',
                type: 'Image',
                props: {
                  src: '/favicon.svg',
                  alt: 'SDUI Lab emblem',
                  width: 40,
                  height: 40,
                },
              },
              {
                id: 'settings-title',
                type: 'Text',
                props: { content: 'Account Settings', variant: 'h2' },
              },
            ],
          },
          {
            id: 'email-card',
            type: 'Card',
            props: { title: 'Notifications', headingLevel: 'h3' },
            children: [
              {
                id: 'email-input',
                type: 'Input',
                props: {
                  name: 'email',
                  label: 'Notification email',
                  inputType: 'email',
                  helperText: 'Current address: {{state.email}}',
                },
              },
              {
                id: 'toggle-alerts',
                type: 'Stack',
                props: { direction: 'row', gap: 'sm', wrap: true },
                children: [
                  {
                    id: 'pause-btn',
                    type: 'Button',
                    props: {
                      label: 'Pause alerts',
                      variant: 'danger',
                      action: { type: 'setState', key: 'alertsPaused', value: true },
                    },
                  },
                  {
                    id: 'resume-btn',
                    type: 'Button',
                    props: {
                      label: 'Resume alerts',
                      variant: 'secondary',
                      action: { type: 'setState', key: 'alertsPaused', value: false },
                    },
                  },
                ],
              },
            ],
          },
          {
            id: 'paused-banner',
            type: 'Conditional',
            props: { stateKey: 'alertsPaused', equals: true },
            children: [
              {
                id: 'paused-text',
                type: 'Text',
                props: {
                  content: 'Notifications are currently paused for {{state.email}}.',
                  variant: 'body',
                  tone: 'danger',
                },
              },
            ],
          },
          {
            id: 'back-btn',
            type: 'Button',
            props: {
              label: 'Back to Onboarding',
              variant: 'ghost',
              action: { type: 'navigate', target: 'welcome' },
            },
          },
        ],
      },
    },
  },
  {
    id: 'catalog',
    label: '3. Architecture Overview (v2)',
    description: 'Uses Card, ordered/unordered List, and binding fallback behavior.',
    document: {
      version: 2,
      screenId: 'catalog',
      title: 'Architecture Overview',
      initialState: {
        runtimeVersion: '0.1.0',
      },
      root: {
        id: 'catalog-root',
        type: 'Stack',
        props: { direction: 'column', gap: 'md' },
        children: [
          {
            id: 'cat-title',
            type: 'Text',
            props: { content: 'SDUI Runtime v{{state.runtimeVersion}}', variant: 'h2' },
          },
          {
            id: 'missing-binding-demo',
            type: 'Text',
            props: {
              content: 'Missing state keys render safely as: {{state.unconfiguredKey}}',
              variant: 'caption',
              tone: 'muted',
            },
          },
          {
            id: 'guarantees-card',
            type: 'Card',
            props: { title: 'Runtime Guarantees', elevated: true, headingLevel: 'h3' },
            children: [
              {
                id: 'guarantees-list',
                type: 'List',
                props: {
                  ordered: false,
                  items: [
                    {
                      id: 'g1',
                      label: 'Schema-first types',
                      description: 'TypeScript types inferred directly from Zod schemas.',
                    },
                    {
                      id: 'g2',
                      label: 'No eval or innerHTML',
                      description: 'Bindings and actions are strictly whitelisted.',
                    },
                    {
                      id: 'g3',
                      label: 'Per-node isolation',
                      description: 'Each node has an ErrorBoundary and Zod props check.',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'legacy-v1',
    label: '4. Legacy v1 Document (Auto-Migrated)',
    description: 'Uses v1 Stack.orientation, Text.value/size, and Button.navigateTo.',
    document: {
      version: 1,
      screenId: 'legacy-v1',
      title: 'Legacy v1 Screen',
      initialState: {
        visitor: 'Legacy Client',
      },
      root: {
        id: 'v1-root',
        type: 'Stack',
        props: { orientation: 'vertical', gap: 'md' },
        children: [
          {
            id: 'v1-heading',
            type: 'Text',
            props: { value: 'Hello from Schema v1, {{state.visitor}}', size: 'lg' },
          },
          {
            id: 'v1-body',
            type: 'Text',
            props: {
              value:
                'This payload uses deprecated v1 fields (orientation, value, size, navigateTo) and is migrated automatically to v2 before rendering.',
              size: 'md',
            },
          },
          {
            id: 'v1-btn',
            type: 'Button',
            props: { label: 'Navigate to Onboarding (v1 prop)', navigateTo: 'welcome' },
          },
        ],
      },
    },
  },
  {
    id: 'break-on-purpose',
    label: '5. Break It On Purpose (Isolation)',
    description:
      'Contains an unknown node and invalid props while valid siblings stay interactive.',
    document: {
      version: 2,
      screenId: 'break-on-purpose',
      title: 'Resilience Demo',
      initialState: {
        status: 'Healthy siblings still work',
      },
      root: {
        id: 'broken-root',
        type: 'Stack',
        props: { direction: 'column', gap: 'md' },
        children: [
          {
            id: 'good-top',
            type: 'Text',
            props: { content: 'Top section: {{state.status}}', variant: 'h2', tone: 'success' },
          },
          {
            id: 'unknown-widget',
            type: 'Carousel3D',
            props: { autoplay: true },
          },
          {
            id: 'invalid-button',
            type: 'Button',
            props: { label: '' },
          },
          {
            id: 'good-bottom',
            type: 'Card',
            props: { title: 'Interactive sibling still works', elevated: true, headingLevel: 'h3' },
            children: [
              {
                id: 'still-works-btn',
                type: 'Button',
                props: {
                  label: 'Test surviving button',
                  variant: 'primary',
                  action: {
                    type: 'openDialog',
                    title: 'Isolation works',
                    body: 'Two sibling nodes failed above, yet this dialog still opens.',
                  },
                },
              },
            ],
          },
        ],
      },
    },
  },
];
