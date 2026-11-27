import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { SduiRenderer } from '@/runtime';
import { createDefaultRegistry } from './defaultRegistry';

describe('SDUI core components and accessibility', () => {
  it('renders all 8 node types, handles bindings/actions, and passes jest-axe', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const registry = createDefaultRegistry();

    const doc = {
      version: 2,
      screenId: 'all-components-test',
      title: 'All Components Test',
      initialState: {
        name: 'Ada',
        showDetails: false,
      },
      root: {
        id: 'root',
        type: 'Stack',
        props: { direction: 'column', gap: 'md' },
        children: [
          {
            id: 'title',
            type: 'Text',
            props: { content: 'Welcome, {{state.name}}', variant: 'h1' },
          },
          {
            id: 'logo',
            type: 'Image',
            props: {
              src: '/favicon.svg',
              alt: 'SDUI Lab icon',
              width: 32,
              height: 32,
              caption: 'Brand mark',
            },
          },
          {
            id: 'profile-card',
            type: 'Card',
            props: {
              title: 'Profile',
              subtitle: 'Update your display name',
              elevated: true,
              headingLevel: 'h2',
            },
            children: [
              {
                id: 'name-input',
                type: 'Input',
                props: {
                  name: 'name',
                  label: 'Display name',
                  helperText: 'Visible across the screen',
                  required: true,
                },
              },
              {
                id: 'actions-row',
                type: 'Stack',
                props: { direction: 'row', gap: 'sm', wrap: true },
                children: [
                  {
                    id: 'toggle-btn',
                    type: 'Button',
                    props: {
                      label: 'Show details',
                      variant: 'primary',
                      action: { type: 'setState', key: 'showDetails', value: true },
                    },
                  },
                  {
                    id: 'dialog-btn',
                    type: 'Button',
                    props: {
                      label: 'Inspect summary',
                      variant: 'secondary',
                      action: {
                        type: 'openDialog',
                        title: 'Summary for {{state.name}}',
                        body: 'Everything is validated by Zod.',
                      },
                    },
                  },
                  {
                    id: 'nav-btn',
                    type: 'Button',
                    props: {
                      label: 'Go next',
                      variant: 'ghost',
                      action: { type: 'navigate', target: 'settings' },
                    },
                  },
                ],
              },
            ],
          },
          {
            id: 'conditional-panel',
            type: 'Conditional',
            props: { stateKey: 'showDetails', equals: true },
            children: [
              {
                id: 'details-list',
                type: 'List',
                props: {
                  ordered: true,
                  items: [
                    'Step one',
                    {
                      id: 's2',
                      label: 'Step two for {{state.name}}',
                      description: 'Dynamic binding',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    };

    const { container } = render(
      <main>
        <SduiRenderer document={doc} registry={registry} onNavigate={onNavigate} />
      </main>,
    );

    // Heading and image caption
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome, Ada' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'SDUI Lab icon' })).toBeInTheDocument();
    expect(screen.getByText('Brand mark')).toBeInTheDocument();

    // Conditional starts hidden
    expect(screen.queryByText('Step one')).not.toBeInTheDocument();

    // Input updates state live
    const input = screen.getByLabelText(/Display name/i);
    await user.clear(input);
    await user.type(input, 'Grace');
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome, Grace' })).toBeInTheDocument();

    // Toggle conditional via setState button
    await user.click(screen.getByRole('button', { name: 'Show details' }));
    expect(screen.getByText('Step one')).toBeInTheDocument();
    expect(screen.getByText('Step two for Grace')).toBeInTheDocument();

    // Navigate button fires callback
    await user.click(screen.getByRole('button', { name: 'Go next' }));
    expect(onNavigate).toHaveBeenCalledWith('settings');

    // Run axe audit on full rendered tree
    const axeBeforeDialog = await axe(container);
    expect(axeBeforeDialog.violations).toEqual([]);

    // Open built-in accessible dialog and check axe again
    await user.click(screen.getByRole('button', { name: 'Inspect summary' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Summary for Grace');
    const axeWithDialog = await axe(container);
    expect(axeWithDialog.violations).toEqual([]);

    // Close dialog
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('migrates and renders a v1 document seamlessly through defaultRegistry', () => {
    const registry = createDefaultRegistry();
    const v1Doc = {
      version: 1,
      screenId: 'legacy-screen',
      title: 'Legacy Screen',
      root: {
        id: 'root',
        type: 'Stack',
        props: { orientation: 'vertical', gap: 'sm' },
        children: [
          { id: 'h', type: 'Text', props: { value: 'From v1', size: 'lg' } },
          { id: 'b', type: 'Button', props: { label: 'Continue', navigateTo: 'home' } },
        ],
      },
    };

    render(<SduiRenderer document={v1Doc} registry={registry} />);
    expect(screen.getByRole('heading', { level: 2, name: 'From v1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });
});
