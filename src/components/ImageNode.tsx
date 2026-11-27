import type { SduiComponentProps } from '@/runtime';
import type { ImageProps } from '@/schema';

export function ImageNode({ props, context }: SduiComponentProps<ImageProps>) {
  const alt = context.resolveText(props.alt);
  const img = (
    <img
      className="sdui-image"
      src={props.src}
      alt={alt}
      width={props.width}
      height={props.height}
      loading="lazy"
    />
  );

  if (props.caption !== undefined && props.caption.length > 0) {
    return (
      <figure className="sdui-figure">
        {img}
        <figcaption className="sdui-figure__caption">
          {context.resolveText(props.caption)}
        </figcaption>
      </figure>
    );
  }

  return img;
}
