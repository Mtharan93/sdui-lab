import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { migrateRawV1BestEffort } from '@/migrations';
import {
  RawNodeEnvelopeSchema,
  StateMapSchema,
  type Action,
  type StateMap,
  type StateValue,
  type ValidationIssue,
} from '@/schema';
import { dispatchAction } from './actions';
import { isSafeStateKey, resolveBindings } from './binding';
import { NodeErrorBoundary } from './ErrorBoundary';
import { NodeFallback } from './NodeFallback';
import type { ComponentRegistry } from './registry';
import type { DialogPayload, SduiRuntimeContext } from './types';

export interface SduiRendererProps {
  /** Raw JSON document (v1 or v2 — v1 is migrated best-effort; validated node-by-node). */
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
 * Migrates v1 documents automatically, resolves {{state.*}} bindings safely,
 * dispatches declarative actions, and isolates node failures with ErrorBoundaries.
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
  const normalizedDoc = useMemo(() => migrateRawV1BestEffort(document), [document]);
  const docEnvelope = DocumentRootEnvelopeSchema.safeParse(normalizedDoc);

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
  const [activeDialog, setActiveDialog] = useState<DialogPayload | null>(null);

  const dialogTitleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const currentScreenKey = `${screenId}:${JSON.stringify(initialState)}`;
  if (currentScreenKey !== prevScreenKey) {
    setPrevScreenKey(currentScreenKey);
    setState(initialState);
    setActiveDialog(null);
  }

  useEffect(() => {
    if (activeDialog === null) {
      return;
    }
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDialog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDialog]);

  const getStateValue = useCallback(
    (key: string): StateValue | undefined => {
      if (!isSafeStateKey(key) || !Object.hasOwn(state, key)) {
        return undefined;
      }
      return state[key];
    },
    [state],
  );

  const setStateValue = useCallback(
    (key: string, value: StateValue) => {
      if (!isSafeStateKey(key)) {
        return;
      }
      setState((prev) => {
        const next: StateMap = { ...prev, [key]: value };
        onStateChange?.(next);
        return next;
      });
    },
    [onStateChange],
  );

  const resolveText = useCallback(
    (template: string): string => resolveBindings(template, state),
    [state],
  );

  const handleOpenDialog = useCallback(
    (dialog: DialogPayload) => {
      if (onOpenDialog) {
        onOpenDialog(dialog);
      } else {
        setActiveDialog(dialog);
      }
    },
    [onOpenDialog],
  );

  const dispatch = useCallback(
    (action: Action) => {
      dispatchAction(action, {
        state,
        setStateValue,
        onNavigate,
        onOpenDialog: handleOpenDialog,
      });
    },
    [state, setStateValue, onNavigate, handleOpenDialog],
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
    <div data-sdui-screen={screenId} className="sdui-screen">
      {renderRawNode(docEnvelope.data.root, 'root', registry, context, {
        renderFallback,
        onNodeError,
      })}

      {activeDialog !== null && (
        <div className="sdui-dialog-backdrop" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="sdui-dialog"
          >
            <h2 id={dialogTitleId} className="sdui-dialog__title">
              {activeDialog.title}
            </h2>
            <p className="sdui-dialog__body">{activeDialog.body}</p>
            <div className="sdui-dialog__actions">
              <button
                ref={closeButtonRef}
                type="button"
                className="sdui-dialog__close"
                onClick={() => {
                  setActiveDialog(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
