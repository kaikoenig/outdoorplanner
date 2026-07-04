import { useDroppable } from '@dnd-kit/core';
import type { EquipmentItem, TourContainer } from '../../types/models';
import { formatWeight } from '../../utils/format';
import { containerWeight } from './weight';

interface Props {
  container: TourContainer;
  itemsById: Map<string, EquipmentItem>;
  onRename: (name: string) => void;
  onRemoveContainer: () => void;
  onQuantityChange: (contentId: string, quantity: number) => void;
  onRemoveContent: (contentId: string) => void;
}

export function ContainerCard({
  container,
  itemsById,
  onRename,
  onRemoveContainer,
  onQuantityChange,
  onRemoveContent,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `container-${container.id}` });
  const containerItem = itemsById.get(container.equipmentItemId);
  const weight = containerWeight(container, itemsById);

  return (
    <div ref={setNodeRef} className={`container-card ${isOver ? 'container-card--over' : ''}`}>
      <div className="container-card__header">
        <input
          className="container-card__name"
          value={container.name}
          onChange={(e) => onRename(e.target.value)}
        />
        <button className="button-link" onClick={onRemoveContainer}>
          Entfernen
        </button>
      </div>
      <p className="container-card__meta">
        {containerItem?.name ?? 'Unbekannter Container'} &middot; {formatWeight(weight)}
      </p>

      <div className="container-card__contents">
        {container.contents.length === 0 && (
          <p className="empty-state empty-state--small">Ziehe Ausrüstung hierher.</p>
        )}
        {container.contents.map((entry) => {
          const item = itemsById.get(entry.equipmentItemId);
          if (!item) return null;
          return (
            <div key={entry.id} className="content-row">
              <span className="content-row__name">{item.name}</span>
              <input
                type="number"
                min={1}
                value={entry.quantity}
                onChange={(e) => onQuantityChange(entry.id, Number(e.target.value))}
              />
              <span className="content-row__weight">{formatWeight(item.weight * entry.quantity)}</span>
              <button className="button-link" onClick={() => onRemoveContent(entry.id)}>
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
