import { ActionSchema, type Action, type StateMap, type StateValue } from '@/schema';
import { isSafeStateKey, resolveBindings } from './binding';
import type { DialogPayload } from './types';

export interface ActionDispatchHandlers {
  state: StateMap;
  setStateValue: (key: string, value: StateValue) => void;
  onNavigate?: ((target: string) => void) | undefined;
  onOpenDialog?: ((dialog: DialogPayload) => void) | undefined;
}

export type DispatchResult = { ok: true; action: Action } | { ok: false; reason: string };

/**
 * Validates and executes a declarative SDUI action without eval or dynamic code.
 * Every action is checked against ActionSchema before side effects run.
 */
export function dispatchAction(
  rawAction: unknown,
  handlers: ActionDispatchHandlers,
): DispatchResult {
  const parsed = ActionSchema.safeParse(rawAction);
  if (!parsed.success) {
    return {
      ok: false,
      reason: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const action = parsed.data;

  switch (action.type) {
    case 'navigate':
      handlers.onNavigate?.(action.target);
      return { ok: true, action };

    case 'setState':
      if (!isSafeStateKey(action.key)) {
        return { ok: false, reason: `Unsafe state key "${action.key}"` };
      }
      handlers.setStateValue(action.key, action.value);
      return { ok: true, action };

    case 'openDialog':
      handlers.onOpenDialog?.({
        title: resolveBindings(action.title, handlers.state),
        body: resolveBindings(action.body, handlers.state),
      });
      return { ok: true, action };
  }
}
