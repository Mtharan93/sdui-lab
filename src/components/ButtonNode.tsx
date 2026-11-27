import type { SduiComponentProps } from '@/runtime';
import type { ButtonProps } from '@/schema';

export function ButtonNode({ props, context }: SduiComponentProps<ButtonProps>) {
  const variant = props.variant ?? 'primary';
  const label = context.resolveText(props.label);

  return (
    <button
      type="button"
      className={`sdui-button sdui-button--${variant}`}
      disabled={props.disabled}
      onClick={() => {
        if (props.action) {
          context.dispatch(props.action);
        }
      }}
    >
      {label}
    </button>
  );
}
