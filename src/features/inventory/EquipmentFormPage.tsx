import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { db } from '../../db';
import type { EquipmentItem, EquipmentType } from '../../types/models';
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

  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(!isEdit);

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
    setForm((f) => ({ ...f, image: file ?? undefined }));
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
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="z.B. Zelt, Kochgeschirr, Bekleidung"
          />
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
          <input
            required
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
          />
        </label>

        <label>
          Bild
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        {form.image && <EquipmentImage image={form.image} alt={form.name} size={96} />}

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
