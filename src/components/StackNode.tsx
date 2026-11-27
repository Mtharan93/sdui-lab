import type { SduiComponentProps } from '@/runtime';
import type { StackProps } from '@/schema';

export function StackNode({ props, children }: SduiComponentProps<StackProps>) {
  const direction = props.direction ?? 'column';
  const gap = props.gap ?? 'md';
  const align = props.align ?? 'stretch';
  const justify = props.justify ?? 'start';

  const classes = [
    'sdui-stack',
    `sdui-stack--${direction}`,
    `sdui-stack--gap-${gap}`,
    `sdui-stack--align-${align}`,
    `sdui-stack--justify-${justify}`,
    props.wrap ? 'sdui-stack--wrap' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
