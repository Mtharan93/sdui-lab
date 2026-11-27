import { useId } from 'react';
import type { SduiComponentProps } from '@/runtime';
import type { InputProps } from '@/schema';

export function InputNode({ props, context }: SduiComponentProps<InputProps>) {
  const inputId = useId();
  const helperId = useId();

  const rawValue = context.getStateValue(props.name);
  const value = rawValue === undefined || rawValue === null ? '' : String(rawValue);
  const hasHelper = props.helperText !== undefined && props.helperText.length > 0;

  return (
    <div className="sdui-field">
      <label htmlFor={inputId} className="sdui-field__label">
        {context.resolveText(props.label)}
        {props.required && (
          <span className="sdui-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        name={props.name}
        type={props.inputType ?? 'text'}
        className="sdui-field__input"
        value={value}
        placeholder={
          props.placeholder !== undefined ? context.resolveText(props.placeholder) : undefined
        }
        required={props.required}
        aria-describedby={hasHelper ? helperId : undefined}
        onChange={(event) => {
          const nextRaw = event.target.value;
          if (props.inputType === 'number') {
            if (nextRaw === '') {
              context.setStateValue(props.name, '');
            } else {
              const parsed = Number(nextRaw);
              context.setStateValue(props.name, Number.isFinite(parsed) ? parsed : nextRaw);
            }
            return;
          }
          context.setStateValue(props.name, nextRaw);
        }}
      />
      {hasHelper && props.helperText !== undefined && (
        <span id={helperId} className="sdui-field__helper">
          {context.resolveText(props.helperText)}
        </span>
      )}
    </div>
  );
}
