# Outdoor Planner

Webbasierte Verwaltung von Outdoor-Ausrüstung: Inventarliste mit Bildern und Tourenplanung, bei der Ausrüstungsgegenstände vom Typ "Container" (z.B. Rucksäcke) beliebig verschachtelt mit anderer Ausrüstung befüllt werden können. Das Gesamtgewicht der Tour wird live berechnet.

## Lokal starten

Voraussetzung: [Node.js](https://nodejs.org/) (Version 20 oder neuer).

```bash
npm install
npm run dev
```

Das Terminal zeigt danach eine URL an (standardmäßig `http://localhost:5173`) – dort im Browser öffnen. Änderungen am Code werden per Hot-Reload sofort übernommen.

Alle Daten werden lokal in der IndexedDB des Browsers gespeichert. Zum Zurücksetzen: Browser-DevTools → Application/Storage → IndexedDB → Datenbank `outdoor-planner` löschen.

Weitere nützliche Befehle:

```bash
npm run build     # Production-Build nach dist/
npm run preview   # gebauten dist/-Ordner lokal ausliefern
npm run lint      # oxlint
```

## Features

- **Inventar**: Ausrüstungsgegenstände mit Name, Typ (Container/Gegenstand), Kategorie, Marke, Gewicht, Anzahl und Bild. Listen- und Rasteransicht, sortierbare Spalten, Filter nach Typ/Kategorie/Marke. Bilder per Datei-Upload oder Drag & Drop (auch von anderen Webseiten, sofern deren Server CORS erlaubt).
- **Tourenplanung**: Container (links) und Ausrüstung (rechts) per Drag & Drop in die Tour bzw. ineinander verschachteln, nach Kategorie gruppiert und auf-/zuklappbar. Live-Gesamtgewicht pro Container und Tour. Mengenbegrenzung anhand des Inventarbestands – bereits vollständig verplante Gegenstände verschwinden aus der Auswahl.
- **Daten sichern**: Export/Import des gesamten Datenbestands (Inventar + Touren + Bilder) als einzelne JSON-Datei, z.B. zum Übertragen auf ein anderes Gerät oder als Backup.

## Architektur

Die Seite ist eine reine Single-Page-Application ohne Backend:

- **Daten**: Alle Ausrüstungsgegenstände, Bilder und Touren werden lokal im Browser in **IndexedDB** gespeichert (via [Dexie](https://dexie.org/)). Es gibt keinen Server und keine externe Datenbank – die App läuft komplett clientseitig und ist als PWA auch offline nutzbar.
- **Kehrseite**: Die Daten sind an den jeweiligen Browser/das Gerät gebunden. Es gibt keine automatische Synchronisation zwischen Geräten – dafür die manuelle Export/Import-Funktion unter "Daten".
- **Frontend**: React + TypeScript + Vite, `@dnd-kit` für das Drag & Drop, `react-router-dom` (HashRouter, damit Routing auch ohne Server-Rewrite auf statischem Hosting funktioniert).

## Build

```bash
npm run build
```

Das Ergebnis landet in `dist/` und kann direkt auf jedem statischen Hosting ausgeliefert werden.

## Deployment: GitHub Pages

Ein GitHub-Actions-Workflow (`.github/workflows/deploy-github-pages.yml`) baut das Projekt bei jedem Push auf `main` und veröffentlicht `dist/` direkt über GitHub Pages – kein separates Repo/System nötig.

### Einmalige Einrichtung

1. Im GitHub-Repository unter **Settings → Pages** bei "Source" **GitHub Actions** auswählen (statt "Deploy from a branch").
2. Push auf `main` – die Action baut und deployed automatisch. Die Seite ist danach unter `https://<dein-github-username>.github.io/<repo-name>/` erreichbar.

## Datenmodell

- **EquipmentItem**: `name`, `type` (`container` | `item`), `category`, `brand`, `weight` (g), `quantity`, optionales `image` (Blob)
- **Tour**: `name`, Liste von Top-Level-Containern
- **TourContainer**: referenziert einen `EquipmentItem` vom Typ `container`, hat einen tourspezifischen Namen, eine Liste befüllter Gegenstände mit Menge (`contents`) sowie eine Liste verschachtelter Container (`containers`) – Container können so beliebig tief ineinander gepackt werden
