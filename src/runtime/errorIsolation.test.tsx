import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { z } from 'zod';
import { ComponentRegistry } from './registry';
import { SduiRenderer } from './renderer';

const ContainerPropsSchema = z.object({
  label: z.string(),
});

const ExplodingPropsSchema = z.object({
  shouldThrow: z.boolean(),
  text: z.string(),
});

function createIsolationRegistry(): ComponentRegistry {
  return new ComponentRegistry()
    .register({
      type: 'Container',
      schema: ContainerPropsSchema,
      component: ({ props, children }) => (
        <section aria-label={props.label}>
          <h1>{props.label}</h1>
          {children}
        </section>
      ),
    })
    .register({
      type: 'Exploder',
      schema: ExplodingPropsSchema,
      component: ({ props }) => {
        if (props.shouldThrow) {
          throw new Error('Boom during render');
        }
        return <p>{props.text}</p>;
      },
    });
}

describe('Per-node error isolation', () => {
  it('isolates render errors to the failing node and keeps siblings alive', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onNodeError = vi.fn();
    const registry = createIsolationRegistry();

    const doc = {
      version: 2,
      screenId: 'isolation-demo',
      title: 'Isolation Demo',
      root: {
        id: 'root',
        type: 'Container',
        props: { label: 'Resilient Screen' },
        children: [
          { id: 'safe-1', type: 'Exploder', props: { shouldThrow: false, text: 'Top survives' } },
          { id: 'boom', type: 'Exploder', props: { shouldThrow: true, text: 'Hidden' } },
          {
            id: 'safe-2',
            type: 'Exploder',
            props: { shouldThrow: false, text: 'Bottom survives' },
          },
        ],
      },
    };

    render(<SduiRenderer document={doc} registry={registry} onNodeError={onNodeError} />);

    expect(screen.getByText('Top survives')).toBeInTheDocument();
    expect(screen.getByText('Bottom survives')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Render error: Boom during render');
    expect(screen.getByRole('status')).toHaveTextContent('root.children[1]');
    expect(onNodeError).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it('recovers automatically when the node props change to fix the crash', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const registry = createIsolationRegistry();

    const makeDoc = (shouldThrow: boolean) => ({
      version: 2,
      screenId: 'recovery-demo',
      title: 'Recovery Demo',
      root: {
        id: 'root',
        type: 'Container',
        props: { label: 'Recovery Screen' },
        children: [
          {
            id: 'target',
            type: 'Exploder',
            props: { shouldThrow, text: 'Recovered cleanly' },
          },
        ],
      },
    });

    const { rerender } = render(<SduiRenderer document={makeDoc(true)} registry={registry} />);
    expect(screen.getByRole('status')).toHaveTextContent('Boom during render');

    rerender(<SduiRenderer document={makeDoc(false)} registry={registry} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Recovered cleanly')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('renders accessible fallback markup with zero axe violations', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const registry = createIsolationRegistry();

    const doc = {
      version: 2,
      screenId: 'a11y-fallback',
      title: 'Accessible Fallback',
      root: {
        id: 'root',
        type: 'Container',
        props: { label: 'Main' },
        children: [
          { id: 'bad-type', type: 'NonExistentWidget', props: {} },
          { id: 'bad-props', type: 'Exploder', props: { shouldThrow: 'nope' } },
          { id: 'crash', type: 'Exploder', props: { shouldThrow: true, text: 'x' } },
        ],
      },
    };

    const { container } = render(<SduiRenderer document={doc} registry={registry} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);

    consoleErrorSpy.mockRestore();
  });
});
