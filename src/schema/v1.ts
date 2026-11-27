import { z } from 'zod';
import { StateMapSchema } from './actions';
import { SCHEMA_VERSION_V1 } from './constants';
import {
  CardPropsSchema,
  ConditionalPropsSchema,
  ImagePropsSchema,
  InputPropsSchema,
  ListPropsSchema,
} from './v2';

/**
 * V1 schema captures the legacy wire contract before v2 standardization:
 * - Stack used `orientation` ('vertical' | 'horizontal') instead of `direction` ('column' | 'row').
 * - Text used `value` + `size` ('sm' | 'md' | 'lg') instead of `content` + semantic `variant`.
 * - Button used a flat `navigateTo` string instead of a typed `action` union.
 */
export const StackPropsV1Schema = z.object({
  orientation: z.enum(['vertical', 'horizontal']).optional(),
  gap: z.enum(['none', 'sm', 'md', 'lg']).optional(),
});
export type StackPropsV1 = z.infer<typeof StackPropsV1Schema>;

export const TextPropsV1Schema = z.object({
  value: z.string(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
});
export type TextPropsV1 = z.infer<typeof TextPropsV1Schema>;

export const ButtonPropsV1Schema = z.object({
  label: z.string().min(1, 'Button label must not be empty'),
  navigateTo: z.string().min(1).optional(),
  disabled: z.boolean().optional(),
});
export type ButtonPropsV1 = z.infer<typeof ButtonPropsV1Schema>;

export interface NodePropsMapV1 {
  Stack: StackPropsV1;
  Text: TextPropsV1;
  Button: ButtonPropsV1;
  Image: z.infer<typeof ImagePropsSchema>;
  Card: z.infer<typeof CardPropsSchema>;
  List: z.infer<typeof ListPropsSchema>;
  Input: z.infer<typeof InputPropsSchema>;
  Conditional: z.infer<typeof ConditionalPropsSchema>;
}

export type SduiNodeV1 = {
  [K in keyof NodePropsMapV1]: {
    id: string;
    type: K;
    props: NodePropsMapV1[K];
    children?: SduiNodeV1[] | undefined;
  };
}[keyof NodePropsMapV1];

const baseIdSchema = z.string().min(1, 'Node id must not be empty');

export const SduiNodeV1Schema: z.ZodType<SduiNodeV1> = z.lazy(() => {
  const childrenField = z.array(SduiNodeV1Schema).optional();
  return z.discriminatedUnion('type', [
    z.object({
      id: baseIdSchema,
      type: z.literal('Stack'),
      props: StackPropsV1Schema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('Text'),
      props: TextPropsV1Schema,
      children: childrenField,
    }),
    z.object({
      id: baseIdSchema,
      type: z.literal('Button'),
      props: ButtonPropsV1Schema,
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

export const ScreenDocumentV1Schema = z.object({
  version: z.literal(SCHEMA_VERSION_V1),
  screenId: z.string().min(1, 'screenId must not be empty'),
  title: z.string().min(1, 'title must not be empty'),
  initialState: StateMapSchema.optional(),
  root: SduiNodeV1Schema,
});

export type ScreenDocumentV1 = z.infer<typeof ScreenDocumentV1Schema>;
