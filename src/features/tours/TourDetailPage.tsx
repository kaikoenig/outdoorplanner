import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { db } from '../../db';
import type { Tour, TourContainer } from '../../types/models';
import { formatWeight } from '../../utils/format';
import { ContainerCard } from './ContainerCard';
import { PoolItem } from './PoolItem';
import { tourWeight } from './weight';

export function TourDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addContainerId, setAddContainerId] = useState('');

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
  const pool = equipmentItems.filter((item) => item.type === 'item');
  const availableContainers = equipmentItems.filter((item) => item.type === 'container');

  async function persist(update: Partial<Tour>) {
    await db.tours.update(tourId, { ...update, updatedAt: Date.now() });
  }

  async function handleRenameTour(name: string) {
    await persist({ name });
  }

  async function handleAddContainer() {
    if (!addContainerId) return;
    const containerItem = itemsById.get(addContainerId);
    if (!containerItem) return;
    const newContainer: TourContainer = {
      id: uuid(),
      equipmentItemId: addContainerId,
      name: containerItem.name,
      contents: [],
    };
    await persist({ containers: [...currentTour.containers, newContainer] });
    setAddContainerId('');
  }

  async function handleRemoveContainer(containerId: string) {
    await persist({ containers: currentTour.containers.filter((c) => c.id !== containerId) });
  }

  async function handleRenameContainer(containerId: string, name: string) {
    await persist({
      containers: currentTour.containers.map((c) => (c.id === containerId ? { ...c, name } : c)),
    });
  }

  async function handleQuantityChange(containerId: string, contentId: string, quantity: number) {
    await persist({
      containers: currentTour.containers.map((c) =>
        c.id !== containerId
          ? c
          : {
              ...c,
              contents: c.contents.map((entry) =>
                entry.id === contentId ? { ...entry, quantity: Math.max(1, quantity) } : entry,
              ),
            },
      ),
    });
  }

  async function handleRemoveContent(containerId: string, contentId: string) {
    await persist({
      containers: currentTour.containers.map((c) =>
        c.id !== containerId ? c : { ...c, contents: c.contents.filter((e) => e.id !== contentId) },
      ),
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const containerId = String(over.id).replace('container-', '');
    const equipmentItemId = active.data.current?.equipmentItemId as string | undefined;
    if (!equipmentItemId) return;

    const containers = currentTour.containers.map((c) => {
      if (c.id !== containerId) return c;
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

      <DndContext onDragEnd={handleDragEnd}>
        <div className="tour-layout">
          <div className="tour-layout__containers">
            <div className="add-container">
              <select value={addContainerId} onChange={(e) => setAddContainerId(e.target.value)}>
                <option value="">Container auswählen...</option>
                {availableContainers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button className="button" onClick={handleAddContainer} disabled={!addContainerId}>
                + Zur Tour hinzufügen
              </button>
            </div>

            {currentTour.containers.length === 0 && (
              <p className="empty-state">Noch kein Container zu dieser Tour hinzugefügt.</p>
            )}

            {currentTour.containers.map((container) => (
              <ContainerCard
                key={container.id}
                container={container}
                itemsById={itemsById}
                onRename={(name) => handleRenameContainer(container.id, name)}
                onRemoveContainer={() => handleRemoveContainer(container.id)}
                onQuantityChange={(contentId, quantity) =>
                  handleQuantityChange(container.id, contentId, quantity)
                }
                onRemoveContent={(contentId) => handleRemoveContent(container.id, contentId)}
              />
            ))}
          </div>

          <div className="tour-layout__pool">
            <h2>Ausrüstung</h2>
            <p className="hint">Ziehe Gegenstände in einen Container.</p>
            {pool.map((item) => (
              <PoolItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
