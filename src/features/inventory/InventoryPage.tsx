import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db';
import { formatWeight } from '../../utils/format';
import { EquipmentImage } from './EquipmentImage';

export function InventoryPage() {
  const items = useLiveQuery(() => db.equipmentItems.orderBy('name').toArray(), []);

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

      {items === undefined && <p>Lade...</p>}
      {items?.length === 0 && <p className="empty-state">Noch keine Ausrüstungsgegenstände angelegt.</p>}

      {items && items.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Typ</th>
              <th>Kategorie</th>
              <th>Marke</th>
              <th>Gewicht</th>
              <th>Anzahl</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <EquipmentImage image={item.image} alt={item.name} />
                </td>
                <td>{item.name}</td>
                <td>
                  <span className={`badge badge--${item.type}`}>
                    {item.type === 'container' ? 'Container' : 'Gegenstand'}
                  </span>
                </td>
                <td>{item.category}</td>
                <td>{item.brand}</td>
                <td>{formatWeight(item.weight)}</td>
                <td>{item.quantity}</td>
                <td className="table-actions">
                  <Link to={`/inventory/${item.id}/edit`}>Bearbeiten</Link>
                  <button className="button-link" onClick={() => handleDelete(item.id, item.name)}>
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
