import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GridIcon, ListIcon, PencilIcon, TrashIcon } from '../../components/icons';
import { db } from '../../db';
import type { EquipmentItem } from '../../types/models';
import { categoryKey, compareCategories, formatPrice, formatWeight, uniqueSorted } from '../../utils/format';
import { EquipmentImage } from './EquipmentImage';

type SortKey = 'name' | 'category' | 'brand' | 'weight' | 'quantity';
type ViewMode = 'list' | 'grid';

function EquipmentTile({
  item,
  onDelete,
}: {
  item: EquipmentItem;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="equipment-tile">
      <div className="equipment-tile__actions">
        <Link
          to={`/inventory/${item.id}/edit`}
          className="button-link"
          aria-label="Bearbeiten"
          title="Bearbeiten"
        >
          <PencilIcon size={14} />
        </Link>
        <button
          className="button-link"
          onClick={() => onDelete(item.id, item.name)}
          aria-label="Löschen"
          title="Löschen"
        >
          <TrashIcon size={14} />
        </button>
      </div>
      <EquipmentImage image={item.image} alt={item.name} size={120} />
      <span className="equipment-tile__name">{item.name}</span>
      <span className="equipment-tile__meta">{[item.brand, item.category].filter(Boolean).join(' · ')}</span>
      <span className="equipment-tile__meta">
        {formatWeight(item.weight)} &middot; {item.quantity}× &middot; {formatPrice(item.price)}
      </span>
    </div>
  );
}

export function InventoryPage() {
  const items = useLiveQuery(() => db.equipmentItems.orderBy('name').toArray(), []);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showContainer, setShowContainer] = useState(true);
  const [showItem, setShowItem] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [brandFilter, setBrandFilter] = useState('');

  const categoryOptions = useMemo(
    () => Array.from(new Set((items ?? []).map((i) => categoryKey(i.category)))).sort(compareCategories),
    [items],
  );
  const brands = useMemo(() => uniqueSorted((items ?? []).map((i) => i.brand)), [items]);

  function matchesCategoryFilter(item: EquipmentItem) {
    return selectedCategories.size === 0 || selectedCategories.has(categoryKey(item.category));
  }

  function toggleCategory(category: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const visibleItems = useMemo(() => {
    if (!items) return undefined;
    const dir = sortDir === 'asc' ? 1 : -1;
    return items
      .filter((item) => (item.type === 'container' ? showContainer : showItem))
      .filter(matchesCategoryFilter)
      .filter((item) => brandFilter === '' || item.brand === brandFilter)
      .sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), 'de') * dir;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, showContainer, showItem, selectedCategories, brandFilter, sortKey, sortDir]);

  const gridItems = useMemo(
    () => (items ?? []).filter((i) => i.type === 'item' && matchesCategoryFilter(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, selectedCategories],
  );
  const gridContainers = useMemo(
    () => (items ?? []).filter((i) => i.type === 'container' && matchesCategoryFilter(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, selectedCategories],
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  function handleToggleContainer() {
    const next = !showContainer;
    if (!next && !showItem) {
      setShowContainer(true);
      setShowItem(true);
    } else {
      setShowContainer(next);
    }
  }

  function handleToggleItem() {
    const next = !showItem;
    if (!next && !showContainer) {
      setShowContainer(true);
      setShowItem(true);
    } else {
      setShowItem(next);
    }
  }

  function handleSelectAll() {
    setShowContainer(true);
    setShowItem(true);
  }

  async function handleDelete(id: string, name: string) {
    if (confirm(`"${name}" wirklich löschen?`)) {
      await db.equipmentItems.delete(id);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inventar</h1>
        <Link className="button button--primary" to="/inventory/new">
          + Ausrüstung hinzufügen
        </Link>
      </div>

      {categoryOptions.length > 0 && (
        <div className="category-facet">
          <button
            className={`category-facet__chip ${selectedCategories.size === 0 ? 'category-facet__chip--active' : ''}`}
            onClick={() => setSelectedCategories(new Set())}
          >
            Alle
          </button>
          {categoryOptions.map((category) => (
            <button
              key={category}
              className={`category-facet__chip ${selectedCategories.has(category) ? 'category-facet__chip--active' : ''}`}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="view-toggle-row">
        <div className="view-toggle">
          <button
            className={`view-toggle__button ${viewMode === 'list' ? 'view-toggle__button--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="Listenansicht"
            title="Listenansicht"
          >
            <ListIcon />
          </button>
          <button
            className={`view-toggle__button ${viewMode === 'grid' ? 'view-toggle__button--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Rasteransicht"
            title="Rasteransicht"
          >
            <GridIcon />
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="type-filter">
          <label>
            <input type="checkbox" checked={showContainer && showItem} onChange={handleSelectAll} />
            Alle
          </label>
          <label>
            <input type="checkbox" checked={showContainer} onChange={handleToggleContainer} />
            Container
          </label>
          <label>
            <input type="checkbox" checked={showItem} onChange={handleToggleItem} />
            Gegenstände
          </label>
        </div>
      )}

      {items === undefined && <p>Lade...</p>}
      {items?.length === 0 && <p className="empty-state">Noch keine Ausrüstungsgegenstände angelegt.</p>}

      {items && items.length > 0 && viewMode === 'list' && (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>
                <button className="th-sort" onClick={() => handleSort('name')}>
                  Name {sortIndicator('name')}
                </button>
              </th>
              <th>
                <button className="th-sort" onClick={() => handleSort('category')}>
                  Kategorie {sortIndicator('category')}
                </button>
              </th>
              <th>
                <button className="th-sort" onClick={() => handleSort('brand')}>
                  Marke {sortIndicator('brand')}
                </button>
                <select className="th-filter" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                  <option value="">Alle</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </th>
              <th>
                <button className="th-sort" onClick={() => handleSort('weight')}>
                  Gewicht {sortIndicator('weight')}
                </button>
              </th>
              <th>
                <button className="th-sort" onClick={() => handleSort('quantity')}>
                  Anzahl {sortIndicator('quantity')}
                </button>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleItems?.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  Keine Ausrüstung entspricht den gewählten Filtern.
                </td>
              </tr>
            )}
            {visibleItems?.map((item: EquipmentItem) => (
              <tr key={item.id}>
                <td>
                  <EquipmentImage image={item.image} alt={item.name} />
                </td>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.brand}</td>
                <td>{formatWeight(item.weight)}</td>
                <td>{item.quantity}</td>
                <td>
                  <div className="table-actions">
                    <Link to={`/inventory/${item.id}/edit`} className="button-link" aria-label="Bearbeiten" title="Bearbeiten">
                      <PencilIcon />
                    </Link>
                    <button
                      className="button-link"
                      onClick={() => handleDelete(item.id, item.name)}
                      aria-label="Löschen"
                      title="Löschen"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {items && items.length > 0 && viewMode === 'grid' && (
        <div className="equipment-grid">
          <div className="equipment-grid__column">
            <h2>Gegenstände</h2>
            <div className="equipment-grid__tiles">
              {gridItems.length === 0 && <p className="empty-state">Keine Gegenstände vorhanden.</p>}
              {gridItems.map((item) => (
                <EquipmentTile key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </div>
          </div>
          <div className="equipment-grid__column">
            <h2>Container</h2>
            <div className="equipment-grid__tiles">
              {gridContainers.length === 0 && <p className="empty-state">Keine Container vorhanden.</p>}
              {gridContainers.map((item) => (
                <EquipmentTile key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
