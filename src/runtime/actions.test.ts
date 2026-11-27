import { describe, it, expect, vi } from 'vitest';
import { dispatchAction } from './actions';

describe('dispatchAction', () => {
  it('dispatches navigate actions to onNavigate handler', () => {
    const onNavigate = vi.fn();
    const result = dispatchAction(
      { type: 'navigate', target: 'settings' },
      { state: {}, setStateValue: vi.fn(), onNavigate },
    );

    expect(result.ok).toBe(true);
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('dispatches setState actions and blocks prototype keys', () => {
    const setStateValue = vi.fn();

    const okResult = dispatchAction(
      { type: 'setState', key: 'accepted', value: true },
      { state: {}, setStateValue },
    );
    expect(okResult.ok).toBe(true);
    expect(setStateValue).toHaveBeenCalledWith('accepted', true);

    const blocked = dispatchAction(
      { type: 'setState', key: '__proto__', value: 'evil' },
      { state: {}, setStateValue },
    );
    expect(blocked.ok).toBe(false);
    expect(setStateValue).toHaveBeenCalledTimes(1);
  });

  it('dispatches openDialog actions and resolves state bindings in title and body', () => {
    const onOpenDialog = vi.fn();
    const result = dispatchAction(
      {
        type: 'openDialog',
        title: 'Hello {{state.name}}',
        body: 'Remaining: {{state.count}}',
      },
      {
        state: { name: 'Grace', count: 5 },
        setStateValue: vi.fn(),
        onOpenDialog,
      },
    );

    expect(result.ok).toBe(true);
    expect(onOpenDialog).toHaveBeenCalledWith({
      title: 'Hello Grace',
      body: 'Remaining: 5',
    });
  });

  it('rejects unknown or malformed actions at runtime', () => {
    const result = dispatchAction(
      { type: 'evalScript', code: 'alert(1)' },
      { state: {}, setStateValue: vi.fn() },
    );
    expect(result.ok).toBe(false);
  });
});
