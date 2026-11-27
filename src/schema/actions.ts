import { z } from 'zod';

/**
 * Primitive values allowed in local SDUI screen state.
 * Keeping state flat-or-JSON-primitive avoids arbitrary class instances or functions.
 */
export const StateValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type StateValue = z.infer<typeof StateValueSchema>;

export const StateMapSchema = z.record(z.string(), StateValueSchema);
export type StateMap = z.infer<typeof StateMapSchema>;

/**
 * Declarative action union. Every interactive side effect must be one of these
 * closed variants — no arbitrary callbacks, scripts, or eval expressions.
 */
export const NavigateActionSchema = z.object({
  type: z.literal('navigate'),
  target: z.string().min(1, 'Navigation target must be a non-empty screen ID'),
});

export const SetStateActionSchema = z.object({
  type: z.literal('setState'),
  key: z.string().min(1, 'State key must be non-empty'),
  value: StateValueSchema,
});

export const OpenDialogActionSchema = z.object({
  type: z.literal('openDialog'),
  title: z.string().min(1, 'Dialog title must be non-empty'),
  body: z.string(),
});

export const ActionSchema = z.discriminatedUnion('type', [
  NavigateActionSchema,
  SetStateActionSchema,
  OpenDialogActionSchema,
]);

export type NavigateAction = z.infer<typeof NavigateActionSchema>;
export type SetStateAction = z.infer<typeof SetStateActionSchema>;
export type OpenDialogAction = z.infer<typeof OpenDialogActionSchema>;
export type Action = z.infer<typeof ActionSchema>;
