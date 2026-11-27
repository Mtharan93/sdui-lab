import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { PlaygroundView } from './PlaygroundView';

describe('PlaygroundView', () => {
  it('renders the split JSON editor and live rendered preview', () => {
    render(<PlaygroundView />);

    expect(screen.getByLabelText('Example Screen')).toBeInTheDocument();
    expect(screen.getByLabelText('Screen JSON Document')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Live Rendered Screen' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hello, Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByText(/Valid v2 screen document/i)).toBeInTheDocument();
  });

  it('switches to the v1 example and displays the migration notice', async () => {
    const user = userEvent.setup();
    render(<PlaygroundView />);

    const select = screen.getByLabelText('Example Screen');
    await user.selectOptions(select, 'legacy-v1');

    expect(screen.getByText(/automatically migrated to v2/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Hello from Schema v1, Legacy Client/i }),
    ).toBeInTheDocument();
  });

  it('switches to "Break It On Purpose" and isolates bad nodes while keeping siblings interactive', async () => {
    const user = userEvent.setup();
    render(<PlaygroundView />);

    await user.selectOptions(screen.getByLabelText('Example Screen'), 'break-on-purpose');

    expect(screen.getByText(/Top section: Healthy siblings still work/i)).toBeInTheDocument();
    const fallbacks = screen
      .getAllByRole('status')
      .filter((el) => el.hasAttribute('data-sdui-fallback'));
    expect(fallbacks).toHaveLength(2);

    // Surviving sibling button still opens the dialog
    await user.click(screen.getByRole('button', { name: 'Test surviving button' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Isolation works');
  });

  it('shows debounced inline validation errors when editing JSON and clears them when fixed', async () => {
    render(<PlaygroundView />);

    const textarea = screen.getByLabelText('Screen JSON Document');
    fireEvent.change(textarea, { target: { value: '{ bad json' } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/JSON syntax error/i);
    });

    const invalidSchemaJson = JSON.stringify({
      version: 2,
      screenId: 'edited',
      title: 'Edited',
      root: {
        id: 'root',
        type: 'Stack',
        props: { direction: 'column' },
        children: [{ id: 'b', type: 'Button', props: { label: '' } }],
      },
    });
    fireEvent.change(textarea, { target: { value: invalidSchemaJson } });

    await waitFor(() => {
      expect(screen.getByText('root.children[0].props.label')).toBeInTheDocument();
    });

    const fixedSchemaJson = JSON.stringify({
      version: 2,
      screenId: 'edited',
      title: 'Edited',
      root: {
        id: 'root',
        type: 'Stack',
        props: { direction: 'column' },
        children: [{ id: 'b', type: 'Button', props: { label: 'Fixed Label' } }],
      },
    });
    fireEvent.change(textarea, { target: { value: fixedSchemaJson } });

    await waitFor(() => {
      expect(screen.getByText(/Valid v2 screen document/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Fixed Label' })).toBeInTheDocument();
  });

  it('has zero axe accessibility violations', async () => {
    const { container } = render(
      <main>
        <h1>SDUI Lab</h1>
        <PlaygroundView />
      </main>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
