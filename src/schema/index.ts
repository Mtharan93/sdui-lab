import { z } from 'zod';
import { ScreenDocumentV1Schema } from './v1';
import { ScreenDocumentV2Schema } from './v2';

export * from './constants';
export * from './actions';
export * from './v1';
export * from './v2';
export * from './errors';

export const AnyScreenDocumentSchema = z.discriminatedUnion('version', [
  ScreenDocumentV1Schema,
  ScreenDocumentV2Schema,
]);

export type AnyScreenDocument = z.infer<typeof AnyScreenDocumentSchema>;
