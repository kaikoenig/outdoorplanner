import type { EquipmentItem, TourContainer, Tour } from '../../types/models';

export function containerWeight(
  container: TourContainer,
  itemsById: Map<string, EquipmentItem>,
): number {
  const own = itemsById.get(container.equipmentItemId)?.weight ?? 0;
  const contentsWeight = container.contents.reduce((sum, entry) => {
    const item = itemsById.get(entry.equipmentItemId);
    return sum + (item?.weight ?? 0) * entry.quantity;
  }, 0);
  const nestedWeight = container.containers.reduce(
    (sum, child) => sum + containerWeight(child, itemsById),
    0,
  );
  return own + contentsWeight + nestedWeight;
}

export function tourWeight(tour: Tour, itemsById: Map<string, EquipmentItem>): number {
  return tour.containers.reduce((sum, container) => sum + containerWeight(container, itemsById), 0);
}
