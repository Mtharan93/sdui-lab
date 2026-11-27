import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';
import {
  RawNodeEnvelopeSchema,
  StateMapSchema,
  type Action,
  type StateMap,
  type StateValue,
  type ValidationIssue,
} from '@/schema';
import { NodeErrorBoundary } from './ErrorBoundary';
import { NodeFallback } from './NodeFallback';
import type { ComponentRegistry } from './registry';
import type { DialogPayload, SduiRuntimeContext } from './types';

export interface SduiRendererProps {
  /** Raw JSON document (v2 or unknown shape — validated node-by-node for resilience). */
  document: unknown;
  registry: ComponentRegistry;
  onNavigate?: ((target: string) => void) | undefined;
  onOpenDialog?: ((dialog: DialogPayload) => void) | undefined;
  onStateChange?: ((state: StateMap) => void) | undefined;
  onNodeError?: ((info: { nodeId: string; path: string; error: Error }) => void) | undefined;
  renderFallback?:
    | ((info: {
        nodeId: string;
        path: string;
        reason: string;
        issues?: ValidationIssue[];
      }) => ReactNode)
    | undefined;
}

const DocumentRootEnvelopeSchema = z.object({
  screenId: z.string().optional(),
  title: z.string().optional(),
  initialState: StateMapSchema.optional(),
  root: z.unknown(),
});

function renderRawNode(
  rawNode: unknown,
  path: string,
  registry: ComponentRegistry,
  context: SduiRuntimeContext,
  options: {
    renderFallback?: SduiRendererProps['renderFallback'];
    onNodeError?: SduiRendererProps['onNodeError'];
  },
): ReactNode {
  const envelope = RawNodeEnvelopeSchema.safeParse(rawNode);
  if (!envelope.success) {
    const fallbackNodeId = `${path}-invalid`;
    const reason = 'Node must be an object with a non-empty string "type"';
    return options.renderFallback ? (
      options.renderFallback({ nodeId: fallbackNodeId, path, reason })
    ) : (
      <NodeFallback key={path} nodeId={fallbackNodeId} path={path} reason={reason} />
    );
  }

  const nodeId = envelope.data.id ?? path;
  const nodeKey = `${path}:${nodeId}`;
  const { type, props: rawProps = {}, children: rawChildren } = envelope.data;

  const childElements: ReactNode[] | undefined = rawChildren?.map((child, index) =>
    renderRawNode(child, `${path}.children[${String(index)}]`, registry, context, options),
  );

  const result = registry.renderNode({
    nodeKey,
    type,
    nodeId,
    rawProps,
    children: childElements,
    context,
  });

  if (result.status === 'unknown_type') {
    const reason = `Unknown node type "${result.type}"`;
    return options.renderFallback ? (
      options.renderFallback({ nodeId, path, reason })
    ) : (
      <NodeFallback key={nodeKey} nodeId={nodeId} path={path} reason={reason} />
    );
  }

  if (result.status === 'invalid_props') {
    const details = result.issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    const reason = `Invalid props for "${result.type}" (${details})`;
    return options.renderFallback ? (
      options.renderFallback({
        nodeId,
        path,
        reason,
        issues: result.issues,
      })
    ) : (
      <NodeFallback
        key={nodeKey}
        nodeId={nodeId}
        path={path}
        reason={reason}
        issues={result.issues}
      />
    );
  }

  const resetKey = JSON.stringify({ type, rawProps });
  return (
    <NodeErrorBoundary
      key={nodeKey}
      nodeId={nodeId}
      path={path}
      resetKey={resetKey}
      onError={options.onNodeError}
    >
      {result.element}
    </NodeErrorBoundary>
  );
}

/**
 * Renders a screen document using the supplied ComponentRegistry.
 * Validates each node independently and wraps each node in a NodeErrorBoundary
 * so one broken node never takes down the rest of the screen.
 */
export function SduiRenderer({
  document,
  registry,
  onNavigate,
  onOpenDialog,
  onStateChange,
  onNodeError,
  renderFallback,
}: SduiRendererProps) {
  const docEnvelope = DocumentRootEnvelopeSchema.safeParse(document);
  const initialState = useMemo(
    () =>
      docEnvelope.success && docEnvelope.data.initialState ? docEnvelope.data.initialState : {},
    [docEnvelope],
  );
  const screenId = docEnvelope.success ? (docEnvelope.data.screenId ?? 'screen') : 'invalid';

  const [state, setState] = useState<StateMap>(initialState);
  const [prevScreenKey, setPrevScreenKey] = useState<string>(
    `${screenId}:${JSON.stringify(initialState)}`,
  );

  const currentScreenKey = `${screenId}:${JSON.stringify(initialState)}`;
  if (currentScreenKey !== prevScreenKey) {
    setPrevScreenKey(currentScreenKey);
    setState(initialState);
  }

  const getStateValue = useCallback((key: string): StateValue | undefined => state[key], [state]);

  const setStateValue = useCallback(
    (key: string, value: StateValue) => {
      setState((prev) => {
        const next: StateMap = { ...prev, [key]: value };
        onStateChange?.(next);
        return next;
      });
    },
    [onStateChange],
  );

  const resolveText = useCallback((template: string): string => template, []);

  const dispatch = useCallback(
    (action: Action) => {
      switch (action.type) {
        case 'navigate':
          onNavigate?.(action.target);
          break;
        case 'setState':
          setStateValue(action.key, action.value);
          break;
        case 'openDialog':
          onOpenDialog?.({ title: action.title, body: action.body });
          break;
      }
    },
    [onNavigate, onOpenDialog, setStateValue],
  );

  const context: SduiRuntimeContext = useMemo(
    () => ({
      state,
      getStateValue,
      setStateValue,
      resolveText,
      dispatch,
    }),
    [state, getStateValue, setStateValue, resolveText, dispatch],
  );

  if (!docEnvelope.success) {
    return (
      <div role="alert" data-sdui-document-error="true" className="sdui-document-error">
        Unable to render document: expected an object with a <code>root</code> node.
      </div>
    );
  }

  return (
    <div data-sdui-screen={screenId}>
      {renderRawNode(docEnvelope.data.root, 'root', registry, context, {
        renderFallback,
        onNodeError,
      })}
    </div>
  );
}
