import type { SduiComponentProps } from '@/runtime';
import type { ConditionalProps } from '@/schema';

export function ConditionalNode({
  props,
  children,
  context,
}: SduiComponentProps<ConditionalProps>) {
  const currentValue = context.getStateValue(props.stateKey);
  const rawMatch =
    props.equals !== undefined ? currentValue === props.equals : Boolean(currentValue);
  const shouldRender = props.negate ? !rawMatch : rawMatch;

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}
