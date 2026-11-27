import { z } from 'zod';
import { ActionSchema, StateMapSchema } from './actions';
import { SCHEMA_VERSION_V2 } from './constants';

/**
 * Checks that an image URL uses a safe protocol (http, https, or relative path).
 * Blocks javascript:, vbscript:, and arbitrary data: payloads.
 */
export function isSafeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const StackPropsSchema = z.object({
  direction: z.enum(['row', 'column']).optional(),
  gap: z.enum(['none', 'sm', 'md', 'lg']).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justify: z.enum(['start', 'center', 'end', 'between']).optional(),
  wrap: z.boolean().optional(),
});
export type StackProps = z.infer<typeof StackPropsSchema>;

export const TextPropsSchema = z.object({
  content: z.string(),
  variant: z.enum(['h1', 'h2', 'h3', 'body', 'caption', 'code']).optional(),
  tone: z.enum(['default', 'muted', 'accent', 'danger', 'success']).optional(),
});
export type TextProps = z.infer<typeof TextPropsSchema>;

export const ButtonPropsSchema = z.object({
  label: z.string().min(1, 'Button label must not be empty'),
  variant: z.enum(['primary', 'secondary', 'ghost', 'danger']).optional(),
  disabled: z.boolean().optional(),
  action: ActionSchema.optional(),
});
export type ButtonProps = z.infer<typeof ButtonPropsSchema>;

export const ImagePropsSchema = z.object({
  src: z.string().refine(isSafeImageUrl, 'Image src must be an http(s) URL or root-relative path'),
  alt: z.string(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  caption: z.string().optional(),
});
export type ImageProps = z.infer<typeof ImagePropsSchema>;

export const CardPropsSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  elevated: z.boolean().optional(),
  headingLevel: z.enum(['h2', 'h3', 'h4']).optional(),
});
export type CardProps = z.infer<typeof CardPropsSchema>;

export const ListItemObjectSchema = z.object({
  id: z.string().min(1, 'List item id must not be empty'),
  label: z.string(),
  description: z.string().optional(),
});

export const ListPropsSchema = z.object({
  items: z.array(z.union([z.string(), ListItemObjectSchema])),
  ordered: z.boolean().optional(),
  emptyText: z.string().optional(),
});
export type ListItemObject = z.infer<typeof ListItemObjectSchema>;
export type ListProps = z.infer<typeof ListPropsSchema>;

export const InputPropsSchema = z.object({
  name: z.string().min(1, 'Input name must not be empty'),
  label: z.string().min(1, 'Input label is required for accessibility'),
  inputType: z.enum(['text', 'email', 'number', 'search']).optional(),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  required: z.boolean().optional(),
});
export type InputProps = z.infer<typeof InputPropsSchema>;

export const ConditionalPropsSchema = z.object({
  stateKey: z.string().min(1, 'Conditional stateKey must not be empty'),
  equals: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  negate: z.boolean().optional(),
});
export type ConditionalProps = z.infer<typeof ConditionalPropsSchema>;

/**
 * Map of each v2 node type to its props type — keeps node union and registry aligned.
 */
export interface NodePropsMap {
  Stack: StackProps;
  Text: TextProps;
  Button: ButtonProps;
  Image: ImageProps;
  Card: CardProps;
  List: ListProps;
  Input: InputProps;
  Conditional: ConditionalProps;
}

export type SduiNode = {
  [K in keyof NodePropsMap]: {
    id: string;
    type: K;
    props: NodePropsMap[K];
    children?: SduiNode[] | undefined;
  };
}[keyof NodePropsMap];

const baseIdSchema = z.string().min(1, 'Node id must not be empty');

export const SduiNodeSchema: z.ZodType<SduiNode> = z.lazy(() => {
  const childrenField = z.array(SduiNodeSchema).optional();
  return z.discriminatedUnion('type', [
    z.object({
      id: baseIdSchema,
      type: z.literal('Stack'),
      props: StackPropsSchema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('Text'),
      props: TextPropsSchema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('Button'),
      props: ButtonPropsSchema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('Image'),
      props: ImagePropsSchema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('Card'),
      props: CardPropsSchema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('List'),
      props: ListPropsSchema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('Input'),
      props: InputPropsSchema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('Conditional'),
      props: ConditionalPropsSchema,
      children: childrenField,
    }),
  ]);
});

export const ScreenDocumentV2Schema = z.object({
  version: z.literal(SCHEMA_VERSION_V2),
  screenId: z.string().min(1, 'screenId must not be empty'),
  title: z.string().min(1, 'title must not be empty'),
  initialState: StateMapSchema.optional(),
  root: SduiNodeSchema,
});

export type ScreenDocumentV2 = z.infer<typeof ScreenDocumentV2Schema>;

/**
 * Shallow envelope schema for structural rendering when individual child nodes
 * might be invalid and should render isolated fallbacks instead of failing the screen.
 */
export const RawNodeEnvelopeSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
  children: z.array(z.unknown()).optional(),
});

export type RawNodeEnvelope = z.infer<typeof RawNodeEnvelopeSchema>;
