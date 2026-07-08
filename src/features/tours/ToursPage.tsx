import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { db } from '../../db';
import type { Tour } from '../../types/models';
import { formatWeight } from '../../utils/format';
import { cloneContainerTree } from './containerTree';
import { tourWeight } from './weight';

export function ToursPage() {
  const navigate = useNavigate();
  const tours = useLiveQuery(() => db.tours.orderBy('name').toArray(), []);
  const equipmentItems = useLiveQuery(() => db.equipmentItems.toArray(), []);
  const itemsById = new Map((equipmentItems ?? []).map((item) => [item.id, item]));

  async function handleCreate() {
    const now = Date.now();
    const id = uuid();
    await db.tours.add({ id, name: 'Neue Tour', containers: [], createdAt: now, updatedAt: now });
    navigate(`/tours/${id}`);
  }

  async function handleDelete(id: string, name: string) {
    if (confirm(`Tour "${name}" wirklich löschen?`)) {
      await db.tours.delete(id);
    }
  }

  async function handleDuplicate(tour: Tour) {
    const now = Date.now();
    await db.tours.add({
      ...tour,
      id: uuid(),
      name: `${tour.name}-Kopie`,
      containers: cloneContainerTree(tour.containers),
      createdAt: now,
      updatedAt: now,
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Touren</h1>
        <button className="button button--primary" onClick={handleCreate}>
          + Neue Tour
        </button>
      </div>

      {tours === undefined && <p>Lade...</p>}
      {tours?.length === 0 && <p className="empty-state">Noch keine Touren angelegt.</p>}

      <div className="tour-grid">
        {tours?.map((tour) => (
          <div key={tour.id} className="tour-card">
            <Link to={`/tours/${tour.id}`}>
              <h2>{tour.name}</h2>
            </Link>
            <p>{tour.containers.length} Container</p>
            <p className="tour-card__weight">{formatWeight(tourWeight(tour, itemsById))}</p>
            <div className="tour-card__actions">
              <button className="button-link" onClick={() => handleDuplicate(tour)}>
                Duplizieren
              </button>
              <button className="button-link" onClick={() => handleDelete(tour.id, tour.name)}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
