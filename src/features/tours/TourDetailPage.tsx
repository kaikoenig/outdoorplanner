import {
  DndContext,
  pointerWithin,
  rectIntersection,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { ChevronIcon } from '../../components/icons';
import { db } from '../../db';
import type { EquipmentItem, Tour, TourContainer } from '../../types/models';
import { categoryKey, compareCategories, formatWeight } from '../../utils/format';
import {
  allContainerIds,
  findContainerNode,
  insertContainerNode,
  isSameOrDescendant,
  remainingQuantity,
  removeContainerNode,
  updateContainerNode,
  usageCounts,
} from './containerTree';
import { ContainerCard } from './ContainerCard';
import { PoolItem } from './PoolItem';
import { tourWeight } from './weight';

interface DragData {
  kind: 'pool-item' | 'pool-container' | 'node';
  equipmentItemId?: string;
  containerId?: string;
}

/**
 * Containers can be nested inside containers, so their drop zones overlap in the DOM.
 * Prefer the smallest (innermost) intersecting drop zone under the pointer, so dropping
 * onto a nested container targets that container rather than one of its ancestors.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return [...pointerCollisions].sort((a, b) => {
      const rectA = args.droppableRects.get(a.id);
      const rectB = args.droppableRects.get(b.id);
      const areaA = rectA ? rectA.width * rectA.height : Infinity;
      const areaB = rectB ? rectB.width * rectB.height : Infinity;
      return areaA - areaB;
    });
  }
  return rectIntersection(args);
};

function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'root' });
  return (
    <div ref={setNodeRef} className={`root-dropzone ${isOver ? 'root-dropzone--over' : ''}`}>
      Container hierher ziehen, um sie der Tour auf oberster Ebene hinzuzufügen bzw. zu verschieben.
    </div>
  );
}

function groupByCategory(items: EquipmentItem[]): Array<[string, EquipmentItem[]]> {
  const groups = new Map<string, EquipmentItem[]>();
  for (const item of items) {
    const key = categoryKey(item.category);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => compareCategories(a, b));
}

function CategoryGroup({
  category,
  items,
  itemsById,
  counts,
}: {
  category: string;
  items: EquipmentItem[];
  itemsById: Map<string, EquipmentItem>;
  counts: Map<string, number>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="pool-category">
      <button className="pool-category__header" onClick={() => setOpen((o) => !o)}>
        <span>{category}</span>
        <ChevronIcon size={14} className={`pool-box__chevron ${open ? '' : 'pool-box__chevron--collapsed'}`} />
      </button>
      {open && (
        <div className="pool-category__items">
          {items.map((item) => (
            <PoolItem key={item.id} item={item} remaining={remainingQuantity(item.id, itemsById, counts)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PoolBox({
  title,
  hint,
  items,
  itemsById,
  counts,
}: {
  title: string;
  hint: string;
  items: EquipmentItem[];
  itemsById: Map<string, EquipmentItem>;
  counts: Map<string, number>;
}) {
  const [open, setOpen] = useState(true);
  const availableItems = items.filter((item) => remainingQuantity(item.id, itemsById, counts) > 0);

  return (
    <div className="pool-box">
      <button className="pool-box__header" onClick={() => setOpen((o) => !o)}>
        <h2>{title}</h2>
        <ChevronIcon className={`pool-box__chevron ${open ? '' : 'pool-box__chevron--collapsed'}`} />
      </button>
      {open && (
        <>
          <p className="hint">{hint}</p>
          {availableItems.length === 0 && <p className="empty-state empty-state--small">Alles bereits verplant.</p>}
          {groupByCategory(availableItems).map(([category, categoryItems]) => (
            <CategoryGroup
              key={category}
              category={category}
              items={categoryItems}
              itemsById={itemsById}
              counts={counts}
            />
          ))}
        </>
      )}
    </div>
  );
}

export function TourDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const tour = useLiveQuery(() => (id ? db.tours.get(id) : undefined), [id]);
  const equipmentItems = useLiveQuery(() => db.equipmentItems.toArray(), []);

  if (!id || equipmentItems === undefined) {
    return <p>Lade...</p>;
  }
  if (tour === undefined) {
    return <p>Tour nicht gefunden.</p>;
  }
  const currentTour = tour;
  const tourId = id;

  const itemsById = new Map(equipmentItems.map((item) => [item.id, item]));
  const itemPool = equipmentItems.filter((item) => item.type === 'item');
  const containerPool = equipmentItems.filter((item) => item.type === 'container');
  const counts = usageCounts(currentTour.containers);

  async function persist(update: Partial<Tour>) {
    await db.tours.put({ ...currentTour, ...update, id: tourId, updatedAt: Date.now() });
  }

  async function handleRenameTour(name: string) {
    await persist({ name });
  }

  function handleToggleCollapse(containerId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(containerId)) next.delete(containerId);
      else next.add(containerId);
      return next;
    });
  }

  function handleToggleCollapseAll() {
    const ids = allContainerIds(currentTour.containers);
    const allCollapsed = ids.length > 0 && ids.every((id) => collapsedIds.has(id));
    setCollapsedIds(allCollapsed ? new Set() : new Set(ids));
  }

  async function handleRemoveContainer(containerId: string) {
    await persist({ containers: removeContainerNode(currentTour.containers, containerId).tree });
  }

  async function handleRenameContainer(containerId: string, name: string) {
    await persist({
      containers: updateContainerNode(currentTour.containers, containerId, (c) => ({ ...c, name })),
    });
  }

  async function handleQuantityChange(containerId: string, contentId: string, quantity: number) {
    await persist({
      containers: updateContainerNode(currentTour.containers, containerId, (c) => ({
        ...c,
        contents: c.contents.map((entry) =>
          entry.id === contentId ? { ...entry, quantity: Math.max(1, quantity) } : entry,
        ),
      })),
    });
  }

  async function handleRemoveContent(containerId: string, contentId: string) {
    await persist({
      containers: updateContainerNode(currentTour.containers, containerId, (c) => ({
        ...c,
        contents: c.contents.filter((e) => e.id !== contentId),
      })),
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current as DragData | undefined;
    if (!data) return;
    const overId = String(over.id);

    if (data.kind === 'pool-item') {
      if (!overId.startsWith('container-')) return;
      const targetContainerId = overId.replace('container-', '');
      const equipmentItemId = data.equipmentItemId;
      if (!equipmentItemId) return;
      if (remainingQuantity(equipmentItemId, itemsById, counts) <= 0) return;

      const containers = updateContainerNode(currentTour.containers, targetContainerId, (c) => {
        const existingEntry = c.contents.find((e) => e.equipmentItemId === equipmentItemId);
        if (existingEntry) {
          return {
            ...c,
            contents: c.contents.map((e) =>
              e.equipmentItemId === equipmentItemId ? { ...e, quantity: e.quantity + 1 } : e,
            ),
          };
        }
        return {
          ...c,
          contents: [...c.contents, { id: uuid(), equipmentItemId, quantity: 1 }],
        };
      });
      await persist({ containers });
      return;
    }

    if (data.kind === 'pool-container') {
      const equipmentItemId = data.equipmentItemId;
      if (!equipmentItemId) return;
      const containerItem = itemsById.get(equipmentItemId);
      if (!containerItem) return;
      if (remainingQuantity(equipmentItemId, itemsById, counts) <= 0) return;

      let parentId: string | null;
      if (overId === 'root') {
        parentId = null;
      } else if (overId.startsWith('container-')) {
        parentId = overId.replace('container-', '');
      } else {
        return;
      }

      const newContainer: TourContainer = {
        id: uuid(),
        equipmentItemId,
        name: containerItem.name,
        contents: [],
        containers: [],
      };
      await persist({ containers: insertContainerNode(currentTour.containers, parentId, newContainer) });
      return;
    }

    if (data.kind === 'node') {
      const nodeId = data.containerId;
      if (!nodeId) return;
      const node = findContainerNode(currentTour.containers, nodeId);
      if (!node) return;

      let destinationParentId: string | null;
      if (overId === 'root') {
        destinationParentId = null;
      } else if (overId.startsWith('container-')) {
        destinationParentId = overId.replace('container-', '');
      } else {
        return;
      }

      if (destinationParentId !== null && isSameOrDescendant(node, destinationParentId)) return;

      const { tree: withoutNode } = removeContainerNode(currentTour.containers, nodeId);
      const finalTree = insertContainerNode(withoutNode, destinationParentId, node);
      await persist({ containers: finalTree });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="button-link" onClick={() => navigate('/tours')}>
          ← Alle Touren
        </button>
      </div>

      <input
        className="tour-title"
        value={currentTour.name}
        onChange={(e) => handleRenameTour(e.target.value)}
      />
      <p className="tour-total-weight">Gesamtgewicht: {formatWeight(tourWeight(currentTour, itemsById))}</p>

      <DndContext collisionDetection={collisionDetection} onDragEnd={handleDragEnd}>
        <div className="tour-layout">
          <PoolBox
            title="Container"
            hint="Ziehe einen Container in die Tour oder in einen anderen Container."
            items={containerPool}
            itemsById={itemsById}
            counts={counts}
          />

          <div className="tour-layout__containers">
            {currentTour.containers.length === 0 && (
              <p className="empty-state">Noch kein Container zu dieser Tour hinzugefügt. Ziehe einen Container aus der Box links hierher.</p>
            )}

            {currentTour.containers.length > 0 && (
              <button className="button-link tour-layout__collapse-all" onClick={handleToggleCollapseAll}>
                {allContainerIds(currentTour.containers).every((id) => collapsedIds.has(id))
                  ? 'Alle ausklappen'
                  : 'Alle einklappen'}
              </button>
            )}

            {currentTour.containers.map((container) => (
              <ContainerCard
                key={container.id}
                container={container}
                itemsById={itemsById}
                counts={counts}
                collapsedIds={collapsedIds}
                onToggleCollapse={handleToggleCollapse}
                onRename={handleRenameContainer}
                onRemoveContainer={handleRemoveContainer}
                onQuantityChange={handleQuantityChange}
                onRemoveContent={handleRemoveContent}
              />
            ))}

            <RootDropZone />
          </div>

          <PoolBox
            title="Ausrüstung"
            hint="Ziehe Gegenstände in einen Container."
            items={itemPool}
            itemsById={itemsById}
            counts={counts}
          />
        </div>
      </DndContext>
    </div>
  );
}
