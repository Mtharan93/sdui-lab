export const SCHEMA_VERSION_V1 = 1 as const;
export const SCHEMA_VERSION_V2 = 2 as const;
export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION_V2;

export const SUPPORTED_SCHEMA_VERSIONS = [SCHEMA_VERSION_V1, SCHEMA_VERSION_V2] as const;

export const NODE_TYPES = [
  'Stack',
  'Text',
  'Button',
  'Image',
  'Card',
  'List',
  'Input',
  'Conditional',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];
