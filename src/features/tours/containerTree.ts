import type { EquipmentItem, TourContainer } from '../../types/models';

export function findContainerNode(containers: TourContainer[], id: string): TourContainer | undefined {
  for (const c of containers) {
    if (c.id === id) return c;
    const found = findContainerNode(c.containers, id);
    if (found) return found;
  }
  return undefined;
}

export function updateContainerNode(
  containers: TourContainer[],
  id: string,
  updater: (node: TourContainer) => TourContainer,
): TourContainer[] {
  return containers.map((c) =>
    c.id === id ? updater(c) : { ...c, containers: updateContainerNode(c.containers, id, updater) },
  );
}

export function removeContainerNode(
  containers: TourContainer[],
  id: string,
): { tree: TourContainer[]; removed?: TourContainer } {
  let removed: TourContainer | undefined;
  const tree: TourContainer[] = [];
  for (const c of containers) {
    if (c.id === id) {
      removed = c;
      continue;
    }
    const result = removeContainerNode(c.containers, id);
    if (result.removed) removed = result.removed;
    tree.push({ ...c, containers: result.tree });
  }
  return { tree, removed };
}

export function insertContainerNode(
  containers: TourContainer[],
  parentId: string | null,
  node: TourContainer,
): TourContainer[] {
  if (parentId === null) {
    return [...containers, node];
  }
  return containers.map((c) =>
    c.id === parentId
      ? { ...c, containers: [...c.containers, node] }
      : { ...c, containers: insertContainerNode(c.containers, parentId, node) },
  );
}

/** True if `targetId` is `node` itself or one of its (nested) descendants. */
export function isSameOrDescendant(node: TourContainer, targetId: string): boolean {
  if (node.id === targetId) return true;
  return node.containers.some((child) => isSameOrDescendant(child, targetId));
}

/** How many units of each equipment item are currently used anywhere in the tour (containers + packed contents). */
export function usageCounts(containers: TourContainer[]): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (id: string, amount: number) => counts.set(id, (counts.get(id) ?? 0) + amount);

  function visit(nodes: TourContainer[]) {
    for (const node of nodes) {
      bump(node.equipmentItemId, 1);
      for (const entry of node.contents) bump(entry.equipmentItemId, entry.quantity);
      visit(node.containers);
    }
  }
  visit(containers);
  return counts;
}

/** How many more units of `equipmentItemId` can still be used in the tour, given what's already used. */
export function remainingQuantity(
  equipmentItemId: string,
  itemsById: Map<string, EquipmentItem>,
  counts: Map<string, number>,
  excludeAmount = 0,
): number {
  const owned = itemsById.get(equipmentItemId)?.quantity ?? 0;
  const used = (counts.get(equipmentItemId) ?? 0) - excludeAmount;
  return Math.max(0, owned - used);
}
