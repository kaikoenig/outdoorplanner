import { useState, type ChangeEvent } from 'react';
import { db } from '../../db';
import type { EquipmentItem, Tour } from '../../types/models';
import { blobToDataUrl, dataUrlToBlob } from '../../utils/blob';

type ExportedEquipmentItem = Omit<EquipmentItem, 'image'> & { image: string | null };

interface BackupPayload {
  version: 1;
  exportedAt: string;
  equipmentItems: ExportedEquipmentItem[];
  tours: Tour[];
}

function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return Array.isArray(payload.equipmentItems) && Array.isArray(payload.tours);
}

export function BackupPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    const equipmentItems = await db.equipmentItems.toArray();
    const tours = await db.tours.toArray();

    const exportedEquipmentItems: ExportedEquipmentItem[] = await Promise.all(
      equipmentItems.map(async ({ image, ...rest }) => ({
        ...rest,
        image: image ? await blobToDataUrl(image) : null,
      })),
    );

    const payload: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      equipmentItems: exportedEquipmentItems,
      tours,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outdoor-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus(`${equipmentItems.length} Ausrüstungsgegenstände und ${tours.length} Touren exportiert.`);
    setError(null);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setStatus(null);

    let payload: BackupPayload;
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isBackupPayload(parsed)) throw new Error('Unerwartetes Dateiformat.');
      payload = parsed;
    } catch {
      setError('Datei konnte nicht gelesen werden – ist es eine gültige Outdoor-Planner-Backup-Datei?');
      return;
    }

    if (
      !confirm(
        `${payload.equipmentItems.length} Ausrüstungsgegenstände und ${payload.tours.length} Touren importieren? ` +
          'Bestehende Einträge mit gleicher ID werden dabei überschrieben, andere Daten bleiben erhalten.',
      )
    ) {
      return;
    }

    setImporting(true);
    try {
      const equipmentItems: EquipmentItem[] = await Promise.all(
        payload.equipmentItems.map(async ({ image, ...rest }) => ({
          ...rest,
          image: image ? await dataUrlToBlob(image) : undefined,
        })),
      );
      await db.equipmentItems.bulkPut(equipmentItems);
      await db.tours.bulkPut(payload.tours);
      setStatus(`${equipmentItems.length} Ausrüstungsgegenstände und ${payload.tours.length} Touren importiert.`);
    } catch {
      setError('Import fehlgeschlagen.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="page">
      <h1>Daten sichern</h1>
      <p className="hint">
        Alle Daten liegen ausschließlich lokal in diesem Browser. Exportiere sie als Backup oder um sie auf ein
        anderes Gerät zu übertragen.
      </p>

      <div className="backup-section">
        <h2>Export</h2>
        <p className="hint">Lädt eine Datei mit dem gesamten Inventar und allen Touren (inkl. Bilder) herunter.</p>
        <button className="button button--primary" onClick={handleExport}>
          Exportieren
        </button>
      </div>

      <div className="backup-section">
        <h2>Import</h2>
        <p className="hint">
          Importiert eine zuvor exportierte Backup-Datei. Bestehende Einträge mit gleicher ID werden überschrieben.
        </p>
        <label className="button">
          {importing ? 'Importiere...' : 'Datei auswählen'}
          <input type="file" accept="application/json" onChange={handleImport} disabled={importing} hidden />
        </label>
      </div>

      {status && <p className="backup-status">{status}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
