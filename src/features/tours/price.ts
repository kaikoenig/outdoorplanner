import type { EquipmentItem, TourContainer, Tour } from '../../types/models';

export function containerPrice(
  container: TourContainer,
  itemsById: Map<string, EquipmentItem>,
): number {
  const own = itemsById.get(container.equipmentItemId)?.price ?? 0;
  const contentsPrice = container.contents.reduce((sum, entry) => {
    const item = itemsById.get(entry.equipmentItemId);
    return sum + (item?.price ?? 0) * entry.quantity;
  }, 0);
  const nestedPrice = container.containers.reduce(
    (sum, child) => sum + containerPrice(child, itemsById),
    0,
  );
  return own + contentsPrice + nestedPrice;
}

export function tourPrice(tour: Tour, itemsById: Map<string, EquipmentItem>): number {
  return tour.containers.reduce((sum, container) => sum + containerPrice(container, itemsById), 0);
}
