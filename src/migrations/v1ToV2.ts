import {
  SCHEMA_VERSION_V2,
  type ButtonProps,
  type ScreenDocumentV1,
  type ScreenDocumentV2,
  type SduiNode,
  type SduiNodeV1,
  type StackProps,
  type TextProps,
} from '@/schema';

function mapStackOrientation(
  orientation: 'vertical' | 'horizontal' | undefined,
): StackProps['direction'] {
  if (orientation === 'horizontal') {
    return 'row';
  }
  if (orientation === 'vertical') {
    return 'column';
  }
  return undefined;
}

function mapTextSizeToVariant(size: 'sm' | 'md' | 'lg' | undefined): TextProps['variant'] {
  switch (size) {
    case 'lg':
      return 'h2';
    case 'md':
      return 'body';
    case 'sm':
      return 'caption';
    case undefined:
      return undefined;
  }
}

function migrateNodeV1ToV2(node: SduiNodeV1): SduiNode {
  const migratedChildren = node.children?.map(migrateNodeV1ToV2);

  switch (node.type) {
    case 'Stack': {
      const props: StackProps = {
        direction: mapStackOrientation(node.props.orientation),
        gap: node.props.gap,
      };
      return {
        id: node.id,
        type: 'Stack',
        props,
        children: migratedChildren,
      };
    }

    case 'Text': {
      const props: TextProps = {
        content: node.props.value,
        variant: mapTextSizeToVariant(node.props.size),
      };
      return {
        id: node.id,
        type: 'Text',
        props,
        children: migratedChildren,
      };
    }

    case 'Button': {
      const props: ButtonProps = {
        label: node.props.label,
        disabled: node.props.disabled,
        action: node.props.navigateTo
          ? { type: 'navigate', target: node.props.navigateTo }
          : undefined,
      };
      return {
        id: node.id,
        type: 'Button',
        props,
        children: migratedChildren,
      };
    }

    case 'Image':
      return {
        id: node.id,
        type: 'Image',
        props: { ...node.props },
        children: migratedChildren,
      };

    case 'Card':
      return {
        id: node.id,
        type: 'Card',
        props: { ...node.props },
        children: migratedChildren,
      };

    case 'List':
      return {
        id: node.id,
        type: 'List',
        props: { ...node.props },
        children: migratedChildren,
      };

    case 'Input':
      return {
        id: node.id,
        type: 'Input',
        props: { ...node.props },
        children: migratedChildren,
      };

    case 'Conditional':
      return {
        id: node.id,
        type: 'Conditional',
        props: { ...node.props },
        children: migratedChildren,
      };
  }
}

/**
 * Explicitly migrates a validated v1 screen document to v2.
 * Breaking changes handled:
 * 1. Stack.props.orientation ('vertical' | 'horizontal') -> Stack.props.direction ('column' | 'row')
 * 2. Text.props.value + Text.props.size ('sm' | 'md' | 'lg') -> Text.props.content + Text.props.variant
 * 3. Button.props.navigateTo -> Button.props.action ({ type: 'navigate', target })
 */
export function migrateV1ToV2(doc: ScreenDocumentV1): ScreenDocumentV2 {
  return {
    version: SCHEMA_VERSION_V2,
    screenId: doc.screenId,
    title: doc.title,
    initialState: doc.initialState ? { ...doc.initialState } : undefined,
    root: migrateNodeV1ToV2(doc.root),
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrateRawNodeBestEffort(rawNode: unknown): unknown {
  if (!isPlainRecord(rawNode)) {
    return rawNode;
  }

  const rawType = rawNode['type'];
  const rawProps = isPlainRecord(rawNode['props']) ? { ...rawNode['props'] } : rawNode['props'];
  const rawChildren = Array.isArray(rawNode['children'])
    ? rawNode['children'].map(migrateRawNodeBestEffort)
    : rawNode['children'];

  if (!isPlainRecord(rawProps)) {
    return {
      ...rawNode,
      ...(rawChildren !== undefined ? { children: rawChildren } : {}),
    };
  }

  let nextProps: Record<string, unknown> = rawProps;

  if (rawType === 'Stack') {
    const orientation = rawProps['orientation'];
    const { orientation: _removed, ...rest } = rawProps;
    nextProps = {
      ...rest,
      ...(orientation === 'vertical' || orientation === 'horizontal'
        ? { direction: mapStackOrientation(orientation) }
        : {}),
    };
  } else if (rawType === 'Text') {
    const value = rawProps['value'];
    const size = rawProps['size'];
    const { value: _v, size: _s, ...rest } = rawProps;
    nextProps = {
      ...rest,
      ...(typeof value === 'string' ? { content: value } : {}),
      ...(size === 'sm' || size === 'md' || size === 'lg'
        ? { variant: mapTextSizeToVariant(size) }
        : {}),
    };
  } else if (rawType === 'Button') {
    const navigateTo = rawProps['navigateTo'];
    const { navigateTo: _nav, ...rest } = rawProps;
    nextProps = {
      ...rest,
      ...(typeof navigateTo === 'string' && navigateTo.length > 0
        ? { action: { type: 'navigate', target: navigateTo } }
        : {}),
    };
  }

  return {
    ...rawNode,
    props: nextProps,
    ...(rawChildren !== undefined ? { children: rawChildren } : {}),
  };
}

/**
 * Best-effort structural migration for unvalidated v1 JSON documents.
 * Converts known v1 node fields to v2 while leaving malformed nodes intact
 * so the runtime can isolate and report them individually.
 */
export function migrateRawV1BestEffort(input: unknown): unknown {
  if (!isPlainRecord(input) || input['version'] !== 1) {
    return input;
  }
  return {
    ...input,
    version: SCHEMA_VERSION_V2,
    root: migrateRawNodeBestEffort(input['root']),
  };
}
