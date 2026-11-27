import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { TradeoffsView } from './TradeoffsView';

describe('TradeoffsView', () => {
  it('renders both hand-written and SDUI screens plus measured CLI baseline table', () => {
    render(<TradeoffsView />);

    expect(
      screen.getByRole('heading', { name: /What does the abstraction cost\?/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hand-Written React' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SDUI Runtime' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Profile: Ada Lovelace' })).toHaveLength(2);
  });

  it('runs the 50-update browser benchmark and displays real timings', async () => {
    const user = userEvent.setup();
    render(<TradeoffsView />);

    await user.click(screen.getByRole('button', { name: /Run 50-update browser benchmark/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Browser flushSync \(50 updates\):/i);
  });

  it('has zero axe accessibility violations', async () => {
    const { container } = render(
      <main>
        <h1>sdui-lab</h1>
        <TradeoffsView />
      </main>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
