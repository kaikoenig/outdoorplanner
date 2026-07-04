import { useDraggable } from '@dnd-kit/core';
import type { EquipmentItem } from '../../types/models';
import { formatWeight } from '../../utils/format';
import { EquipmentImage } from '../inventory/EquipmentImage';

export function PoolItem({ item, remaining }: { item: EquipmentItem; remaining: number }) {
  const disabled = remaining <= 0;
  const kind = item.type === 'container' ? 'pool-container' : 'pool-item';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${item.id}`,
    data: { kind, equipmentItemId: item.id },
    disabled,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`pool-item ${isDragging ? 'pool-item--dragging' : ''} ${disabled ? 'pool-item--disabled' : ''}`}
    >
      <EquipmentImage image={item.image} alt={item.name} size={32} />
      <div className="pool-item__info">
        <span className="pool-item__name">{item.name}</span>
        <span className="pool-item__weight">
          {formatWeight(item.weight)} &middot; {remaining} von {item.quantity} verfügbar
        </span>
      </div>
    </div>
  );
}
