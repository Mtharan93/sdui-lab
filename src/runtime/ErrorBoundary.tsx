import { Component, type ErrorInfo, type ReactNode } from 'react';
import { NodeFallback } from './NodeFallback';

export interface NodeErrorBoundaryProps {
  nodeId: string;
  path: string;
  /** Changing resetKey clears a caught error when the underlying node JSON changes. */
  resetKey: string;
  onError?: ((info: { nodeId: string; path: string; error: Error }) => void) | undefined;
  children: ReactNode;
}

interface NodeErrorBoundaryState {
  error: Error | null;
}

/**
 * Isolates runtime render exceptions to a single SDUI node so sibling and parent
 * components keep functioning normally.
 */
export class NodeErrorBoundary extends Component<NodeErrorBoundaryProps, NodeErrorBoundaryState> {
  override state: NodeErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): NodeErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, _info: ErrorInfo): void {
    this.props.onError?.({
      nodeId: this.props.nodeId,
      path: this.props.path,
      error,
    });
  }

  override componentDidUpdate(prevProps: NodeErrorBoundaryProps): void {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <NodeFallback
          nodeId={this.props.nodeId}
          path={this.props.path}
          reason={`Render error: ${this.state.error.message}`}
        />
      );
    }
    return this.props.children;
  }
}
