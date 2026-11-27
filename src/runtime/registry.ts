import { createElement, type ComponentType, type ReactNode } from 'react';
import type { z } from 'zod';
import { formatZodIssues, type ValidationIssue } from '@/schema';
import type { SduiComponentProps, SduiRuntimeContext } from './types';

export interface RegistryDefinition<TProps> {
  type: string;
  schema: z.ZodType<TProps>;
  component: ComponentType<SduiComponentProps<TProps>>;
}

export type RegistryRenderResult =
  | { status: 'ok'; element: ReactNode }
  | { status: 'unknown_type'; type: string }
  | { status: 'invalid_props'; type: string; issues: ValidationIssue[] };

interface StoredEntry {
  type: string;
  validateProps: (rawProps: unknown) => ValidationIssue[] | null;
  validateAndRender: (input: {
    nodeKey: string;
    nodeId: string;
    rawProps: unknown;
    children: ReactNode;
    context: SduiRuntimeContext;
  }) => RegistryRenderResult;
}

/**
 * Maps SDUI node type strings to React components paired with Zod prop schemas.
 * Capturing the generic <TProps> inside register() keeps external lookup type-safe
 * without resorting to `any` or unsafe casts.
 */
export class ComponentRegistry {
  private readonly entries = new Map<string, StoredEntry>();

  register<TProps>(definition: RegistryDefinition<TProps>): this {
    const { type, schema, component } = definition;

    this.entries.set(type, {
      type,
      validateProps(rawProps: unknown): ValidationIssue[] | null {
        const parsed = schema.safeParse(rawProps);
        return parsed.success ? null : formatZodIssues(parsed.error);
      },
      validateAndRender({ nodeKey, nodeId, rawProps, children, context }): RegistryRenderResult {
        const parsed = schema.safeParse(rawProps);
        if (!parsed.success) {
          return {
            status: 'invalid_props',
            type,
            issues: formatZodIssues(parsed.error),
          };
        }
        return {
          status: 'ok',
          element: createElement(
            component,
            {
              key: nodeKey,
              nodeId,
              props: parsed.data,
              context,
            },
            children,
          ),
        };
      },
    });

    return this;
  }

  has(type: string): boolean {
    return this.entries.has(type);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.entries.keys());
  }

  validateProps(
    type: string,
    rawProps: unknown,
  ):
    | { ok: true }
    | { ok: false; reason: 'unknown_type' | 'invalid_props'; issues: ValidationIssue[] } {
    const entry = this.entries.get(type);
    if (!entry) {
      return {
        ok: false,
        reason: 'unknown_type',
        issues: [
          {
            path: 'type',
            message: `Unknown node type "${type}"`,
            code: 'unknown_node_type',
          },
        ],
      };
    }
    const issues = entry.validateProps(rawProps);
    if (issues !== null) {
      return { ok: false, reason: 'invalid_props', issues };
    }
    return { ok: true };
  }

  renderNode(input: {
    nodeKey: string;
    type: string;
    nodeId: string;
    rawProps: unknown;
    children: ReactNode;
    context: SduiRuntimeContext;
  }): RegistryRenderResult {
    const entry = this.entries.get(input.type);
    if (!entry) {
      return { status: 'unknown_type', type: input.type };
    }
    return entry.validateAndRender(input);
  }

  clone(): ComponentRegistry {
    const next = new ComponentRegistry();
    for (const [key, entry] of this.entries.entries()) {
      next.entries.set(key, entry);
    }
    return next;
  }
}
