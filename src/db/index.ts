import Dexie, { type EntityTable } from 'dexie';
import type { EquipmentItem, Tour, TourContainer } from '../types/models';

export const db = new Dexie('outdoor-planner') as Dexie & {
  equipmentItems: EntityTable<EquipmentItem, 'id'>;
  tours: EntityTable<Tour, 'id'>;
};

function normalizeContainers(containers: TourContainer[] | undefined): TourContainer[] {
  return (containers ?? []).map((c) => ({
    ...c,
    contents: c.contents ?? [],
    containers: normalizeContainers(c.containers),
  }));
}

db.version(1).stores({
  equipmentItems: 'id, name, type, category, brand',
  tours: 'id, name',
});

db.version(2)
  .stores({
    equipmentItems: 'id, name, type, category, brand',
    tours: 'id, name',
  })
  .upgrade(async (tx) => {
    await tx
      .table('tours')
      .toCollection()
      .modify((tour: Tour) => {
        tour.containers = normalizeContainers(tour.containers);
      });
  });
