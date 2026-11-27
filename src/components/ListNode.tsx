import type { SduiComponentProps } from '@/runtime';
import type { ListProps } from '@/schema';

export function ListNode({ props, context }: SduiComponentProps<ListProps>) {
  if (props.items.length === 0) {
    const emptyText = context.resolveText(props.emptyText ?? 'No items to display.');
    return <p className="sdui-list__empty">{emptyText}</p>;
  }

  const ListTag = props.ordered ? 'ol' : 'ul';

  return (
    <ListTag className="sdui-list">
      {props.items.map((item, idx) => {
        if (typeof item === 'string') {
          return (
            <li key={`${String(idx)}-${item}`} className="sdui-list__item">
              <span className="sdui-list__item-label">{context.resolveText(item)}</span>
            </li>
          );
        }
        return (
          <li key={item.id} className="sdui-list__item">
            <span className="sdui-list__item-label">{context.resolveText(item.label)}</span>
            {item.description !== undefined && item.description.length > 0 && (
              <span className="sdui-list__item-desc">{context.resolveText(item.description)}</span>
            )}
          </li>
        );
      })}
    </ListTag>
  );
}
