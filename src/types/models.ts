export type EquipmentType = 'container' | 'item';

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  category: string;
  weight: number; // grams
  brand: string;
  quantity: number;
  price: number; // purchase price in €, per unit
  image?: Blob;
  createdAt: number;
  updatedAt: number;
}

export interface TourContentEntry {
  id: string;
  equipmentItemId: string;
  quantity: number;
}

export interface TourContainer {
  id: string;
  equipmentItemId: string; // references an EquipmentItem of type 'container'
  name: string; // tour-specific name, e.g. "Rucksack Kai"
  contents: TourContentEntry[];
  containers: TourContainer[]; // nested containers, packed inside this one
}

export interface Tour {
  id: string;
  name: string;
  containers: TourContainer[];
  createdAt: number;
  updatedAt: number;
}
