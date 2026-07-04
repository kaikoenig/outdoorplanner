import Dexie, { type EntityTable } from 'dexie';
import type { EquipmentItem, Tour } from '../types/models';

export const db = new Dexie('outdoor-planner') as Dexie & {
  equipmentItems: EntityTable<EquipmentItem, 'id'>;
  tours: EntityTable<Tour, 'id'>;
};

db.version(1).stores({
  equipmentItems: 'id, name, type, category, brand',
  tours: 'id, name',
});
