import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type DragEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { NumberStepper } from '../../components/NumberStepper';
import { db } from '../../db';
import type { EquipmentItem, EquipmentType } from '../../types/models';
import { extractDraggedImageUrl } from '../../utils/dragImage';
import { uniqueSorted } from '../../utils/format';
import { EquipmentImage } from './EquipmentImage';

const EMPTY: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  type: 'item',
  category: '',
  weight: 0,
  brand: '',
  quantity: 1,
  image: undefined,
};

export function EquipmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const existing = useLiveQuery(() => (id ? db.equipmentItems.get(id) : undefined), [id]);
  const allItems = useLiveQuery(() => db.equipmentItems.toArray(), []);
  const categories = uniqueSorted((allItems ?? []).map((i) => i.category));

  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(!isEdit);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (existing && !loaded) {
    setForm({
      name: existing.name,
      type: existing.type,
      category: existing.category,
      weight: existing.weight,
      brand: existing.brand,
      quantity: existing.quantity,
      image: existing.image,
    });
    setLoaded(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const now = Date.now();

    if (isEdit && id) {
      await db.equipmentItems.update(id, { ...form, updatedAt: now });
    } else {
      await db.equipmentItems.add({ ...form, id: uuid(), createdAt: now, updatedAt: now });
    }
    navigate('/inventory');
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImageError(null);
    setForm((f) => ({ ...f, image: file ?? undefined }));
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  async function handleImageDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    setImageError(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setForm((f) => ({ ...f, image: file }));
      return;
    }

    const url = extractDraggedImageUrl(e.dataTransfer);
    if (!url) {
      setImageError('Kein Bild in den abgelegten Daten erkannt.');
      return;
    }

    setImageLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Keine Bilddatei');
      setForm((f) => ({ ...f, image: blob }));
    } catch {
      setImageError(
        'Bild konnte nicht geladen werden – vermutlich blockiert die Webseite den Zugriff (CORS). ' +
          'Bitte das Bild stattdessen lokal speichern und über "Datei auswählen" hochladen.',
      );
    } finally {
      setImageLoading(false);
    }
  }

  if (isEdit && !loaded) {
    return <p>Lade...</p>;
  }

  return (
    <div className="page">
      <h1>{isEdit ? 'Ausrüstung bearbeiten' : 'Ausrüstung hinzufügen'}</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>

        <label>
          Typ
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EquipmentType }))}
          >
            <option value="item">Gegenstand</option>
            <option value="container">Container (z.B. Rucksack)</option>
          </select>
        </label>

        <label>
          Kategorie
          <input
            list="category-options"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="z.B. Zelt, Kochgeschirr, Bekleidung"
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label>
          Marke
          <input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
        </label>

        <label>
          Gewicht (g)
          <input
            required
            type="number"
            min={0}
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))}
          />
        </label>

        <label>
          Anzahl
          <NumberStepper
            min={1}
            value={form.quantity}
            onChange={(quantity) => setForm((f) => ({ ...f, quantity }))}
          />
        </label>

        <label>
          Bild
          <div
            className={`image-dropzone ${isDragOver ? 'image-dropzone--over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleImageDrop}
          >
            {form.image ? (
              <EquipmentImage image={form.image} alt={form.name} size={96} />
            ) : (
              <span className="image-dropzone__hint">
                Bild hierher ziehen (auch von einer anderen Webseite) oder Datei auswählen
              </span>
            )}
            {imageLoading && <span className="image-dropzone__status">Lade Bild...</span>}
          </div>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        {imageError && <p className="form-error">{imageError}</p>}

        <div className="form-actions">
          <button type="submit" className="button button--primary">
            Speichern
          </button>
          <button type="button" className="button" onClick={() => navigate('/inventory')}>
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
