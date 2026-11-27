import type { ReactNode } from 'react';
import type { Action, StateMap, StateValue } from '@/schema';

export interface DialogPayload {
  title: string;
  body: string;
}

export interface SduiRuntimeContext {
  state: StateMap;
  getStateValue: (key: string) => StateValue | undefined;
  setStateValue: (key: string, value: StateValue) => void;
  resolveText: (template: string) => string;
  dispatch: (action: Action) => void;
}

export interface SduiComponentProps<TProps> {
  nodeId: string;
  props: TProps;
  children?: ReactNode;
  context: SduiRuntimeContext;
}
