import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ChevronIcon, TrashIcon } from '../../components/icons';
import { NumberStepper } from '../../components/NumberStepper';
import type { EquipmentItem, TourContainer } from '../../types/models';
import { formatWeight } from '../../utils/format';
import { EquipmentImage } from '../inventory/EquipmentImage';
import { containerWeight } from './weight';

interface Props {
  container: TourContainer;
  itemsById: Map<string, EquipmentItem>;
  counts: Map<string, number>;
  collapsedIds: Set<string>;
  onToggleCollapse: (containerId: string) => void;
  onRename: (containerId: string, name: string) => void;
  onRemoveContainer: (containerId: string) => void;
  onQuantityChange: (containerId: string, contentId: string, quantity: number) => void;
  onRemoveContent: (containerId: string, contentId: string) => void;
}

export function ContainerCard(props: Props) {
  const { container, itemsById, counts, collapsedIds, onToggleCollapse, onRename, onRemoveContainer, onQuantityChange, onRemoveContent } = props;
  const isCollapsed = collapsedIds.has(container.id);

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `container-${container.id}` });
  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({
    id: `node-${container.id}`,
    data: { kind: 'node', containerId: container.id },
  });

  const containerItem = itemsById.get(container.equipmentItemId);
  const weight = containerWeight(container, itemsById);
  const isEmpty = container.contents.length === 0 && container.containers.length === 0;

  function handleRemoveContainer() {
    if (isEmpty || confirm(`"${container.name}" ist nicht leer. Trotzdem entfernen (inkl. Inhalt)?`)) {
      onRemoveContainer(container.id);
    }
  }

  return (
    <div
      ref={setDropRef}
      className={`container-card ${isOver ? 'container-card--over' : ''} ${isDragging ? 'container-card--dragging' : ''}`}
    >
      <div className="container-card__header">
        <button
          ref={setDragRef}
          className="drag-handle"
          title="Container verschieben"
          {...listeners}
          {...attributes}
        >
          ⠿
        </button>
        <button
          className="button-link container-card__collapse-toggle"
          onClick={() => onToggleCollapse(container.id)}
          aria-label={isCollapsed ? 'Ausklappen' : 'Einklappen'}
          title={isCollapsed ? 'Ausklappen' : 'Einklappen'}
        >
          <ChevronIcon size={14} className={`pool-box__chevron ${isCollapsed ? 'pool-box__chevron--collapsed' : ''}`} />
        </button>
        <EquipmentImage image={containerItem?.image} alt={containerItem?.name ?? container.name} size={32} />
        <input
          className="container-card__name"
          value={container.name}
          onChange={(e) => onRename(container.id, e.target.value)}
        />
        <button className="button-link" onClick={handleRemoveContainer}>
          Entfernen
        </button>
      </div>
      <p className="container-card__meta">
        {containerItem?.name ?? 'Unbekannter Container'} &middot; {formatWeight(weight)}
      </p>

      {!isCollapsed && (
        <>
          <div className="container-card__contents">
            {isEmpty && (
              <p className="empty-state empty-state--small">Ziehe Ausrüstung oder einen anderen Container hierher.</p>
            )}
            {container.contents.map((entry) => {
              const item = itemsById.get(entry.equipmentItemId);
              if (!item) return null;
              const usedElsewhere = (counts.get(item.id) ?? 0) - entry.quantity;
              const max = Math.max(1, item.quantity - usedElsewhere);
              return (
                <div key={entry.id} className="content-row">
                  <EquipmentImage image={item.image} alt={item.name} size={28} />
                  <span className="content-row__name">{item.name}</span>
                  <NumberStepper
                    min={1}
                    max={max}
                    value={entry.quantity}
                    onChange={(quantity) => onQuantityChange(container.id, entry.id, quantity)}
                  />
                  <span className="content-row__weight">{formatWeight(item.weight * entry.quantity)}</span>
                  <button
                    className="button-link"
                    onClick={() => onRemoveContent(container.id, entry.id)}
                    aria-label="Entfernen"
                    title="Entfernen"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {container.containers.length > 0 && (
            <div className="container-card__nested">
              {container.containers.map((child) => (
                <ContainerCard key={child.id} {...props} container={child} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
