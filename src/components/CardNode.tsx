import { useId } from 'react';
import type { SduiComponentProps } from '@/runtime';
import type { CardProps } from '@/schema';

function CardHeading({ level, id, text }: { level: 'h2' | 'h3' | 'h4'; id: string; text: string }) {
  switch (level) {
    case 'h2':
      return (
        <h2 id={id} className="sdui-card__title">
          {text}
        </h2>
      );
    case 'h3':
      return (
        <h3 id={id} className="sdui-card__title">
          {text}
        </h3>
      );
    case 'h4':
      return (
        <h4 id={id} className="sdui-card__title">
          {text}
        </h4>
      );
  }
}

export function CardNode({ props, children, context }: SduiComponentProps<CardProps>) {
  const headingId = useId();
  const hasTitle = props.title !== undefined && props.title.length > 0;
  const hasSubtitle = props.subtitle !== undefined && props.subtitle.length > 0;
  const level = props.headingLevel ?? 'h2';

  return (
    <article
      className={`sdui-card ${props.elevated ? 'sdui-card--elevated' : ''}`.trim()}
      aria-labelledby={hasTitle ? headingId : undefined}
    >
      {(hasTitle || hasSubtitle) && (
        <header className="sdui-card__header">
          {hasTitle && props.title !== undefined && (
            <CardHeading level={level} id={headingId} text={context.resolveText(props.title)} />
          )}
          {hasSubtitle && props.subtitle !== undefined && (
            <p className="sdui-card__subtitle">{context.resolveText(props.subtitle)}</p>
          )}
        </header>
      )}
      <div className="sdui-card__body">{children}</div>
    </article>
  );
}
