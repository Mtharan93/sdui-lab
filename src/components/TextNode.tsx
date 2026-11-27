import type { SduiComponentProps } from '@/runtime';
import type { TextProps } from '@/schema';

export function TextNode({ props, context }: SduiComponentProps<TextProps>) {
  const variant = props.variant ?? 'body';
  const tone = props.tone ?? 'default';
  const resolved = context.resolveText(props.content);
  const className = `sdui-text sdui-text--${variant} sdui-text--tone-${tone}`;

  switch (variant) {
    case 'h1':
      return <h1 className={className}>{resolved}</h1>;
    case 'h2':
      return <h2 className={className}>{resolved}</h2>;
    case 'h3':
      return <h3 className={className}>{resolved}</h3>;
    case 'code':
      return <code className={className}>{resolved}</code>;
    case 'caption':
    case 'body':
      return <p className={className}>{resolved}</p>;
  }
}
