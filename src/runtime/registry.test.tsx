import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { z } from 'zod';
import { ComponentRegistry } from './registry';
import { SduiRenderer } from './renderer';

const BoxPropsSchema = z.object({
  title: z.string().min(1),
});

const GreetingPropsSchema = z.object({
  text: z.string().min(1),
});

function createTestRegistry(): ComponentRegistry {
  return new ComponentRegistry()
    .register({
      type: 'Box',
      schema: BoxPropsSchema,
      component: ({ props, children }) => (
        <section aria-label={props.title}>
          <h2>{props.title}</h2>
          {children}
        </section>
      ),
    })
    .register({
      type: 'Greeting',
      schema: GreetingPropsSchema,
      component: ({ props }) => <p>{props.text}</p>,
    });
}

describe('ComponentRegistry', () => {
  it('registers components with Zod schemas and rejects invalid props at runtime', () => {
    const registry = createTestRegistry();

    expect(registry.has('Box')).toBe(true);
    expect(registry.has('Unknown')).toBe(false);
    expect(registry.getRegisteredTypes()).toEqual(['Box', 'Greeting']);

    expect(registry.validateProps('Greeting', { text: 'Hello' })).toEqual({ ok: true });

    const invalid = registry.validateProps('Greeting', { text: '' });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.reason).toBe('invalid_props');
      expect(invalid.issues[0]?.path).toBe('text');
    }

    const unknown = registry.validateProps('Nope', {});
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.reason).toBe('unknown_type');
    }
  });
});

describe('SduiRenderer', () => {
  it('renders valid nested nodes from the registry', () => {
    const registry = createTestRegistry();
    const doc = {
      version: 2,
      screenId: 'test-screen',
      title: 'Test Screen',
      root: {
        id: 'root',
        type: 'Box',
        props: { title: 'Container' },
        children: [{ id: 'g1', type: 'Greeting', props: { text: 'Hello SDUI' } }],
      },
    };

    render(<SduiRenderer document={doc} registry={registry} />);

    expect(screen.getByRole('heading', { name: 'Container' })).toBeInTheDocument();
    expect(screen.getByText('Hello SDUI')).toBeInTheDocument();
  });

  it('renders an inline fallback for a bad sibling while keeping valid siblings alive', () => {
    const registry = createTestRegistry();
    const doc = {
      version: 2,
      screenId: 'partial-failure',
      title: 'Partial Failure',
      root: {
        id: 'root',
        type: 'Box',
        props: { title: 'Main Box' },
        children: [
          { id: 'ok-1', type: 'Greeting', props: { text: 'First works' } },
          { id: 'bad-props', type: 'Greeting', props: { text: 123 } },
          { id: 'bad-type', type: 'Carousel', props: {} },
          { id: 'ok-2', type: 'Greeting', props: { text: 'Last works' } },
        ],
      },
    };

    render(<SduiRenderer document={doc} registry={registry} />);

    expect(screen.getByText('First works')).toBeInTheDocument();
    expect(screen.getByText('Last works')).toBeInTheDocument();

    const fallbacks = screen.getAllByRole('status');
    expect(fallbacks).toHaveLength(2);
    expect(fallbacks[0]).toHaveTextContent('root.children[1]');
    expect(fallbacks[1]).toHaveTextContent('Unknown node type "Carousel"');
  });
});
