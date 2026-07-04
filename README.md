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

Das Ergebnis landet in `dist/` und kann direkt auf jedem statischen Hosting (z.B. GitLab Pages) ausgeliefert werden.

## Deployment: GitHub → GitLab Pages

Der Quellcode liegt in diesem GitHub-Repository, die veröffentlichte Seite läuft aber auf GitLab Pages, da kein eigener Server betrieben werden soll. Der Ablauf:

1. Ein GitHub-Actions-Workflow (`.github/workflows/deploy-gitlab-pages.yml`) baut das Projekt bei jedem Push auf `main`.
2. Die gebauten Dateien werden als `public/` zusammen mit einer minimalen `.gitlab-ci.yml` (aus `deploy/gitlab-ci.yml`) in ein separates GitLab-Repository gepusht.
3. GitLab Pages veröffentlicht den Inhalt von `public/` automatisch.

### Einmalige Einrichtung

1. In GitLab ein leeres Projekt anlegen (z.B. `outdoorplanner`), das ausschließlich als Pages-Ziel dient.
2. In diesem GitLab-Projekt unter **Settings → Repository → Deploy tokens** einen Token mit Scope `write_repository` erstellen.
3. Im GitHub-Repository unter **Settings → Secrets and variables → Actions** zwei Secrets anlegen:
   - `GITLAB_DEPLOY_TOKEN`: der eben erstellte Deploy Token
   - `GITLAB_REPO`: Namespace/Projektname in GitLab, z.B. `dein-username/outdoorplanner`
4. Push auf `main` in GitHub – die Action baut und deployed automatisch. Die Seite ist danach unter `https://<namespace>.gitlab.io/<projekt>/` erreichbar.

## Datenmodell

- **EquipmentItem**: `name`, `type` (`container` | `item`), `category`, `brand`, `weight` (g), `quantity`, optionales `image` (Blob)
- **Tour**: `name`, Liste von Top-Level-Containern
- **TourContainer**: referenziert einen `EquipmentItem` vom Typ `container`, hat einen tourspezifischen Namen, eine Liste befüllter Gegenstände mit Menge (`contents`) sowie eine Liste verschachtelter Container (`containers`) – Container können so beliebig tief ineinander gepackt werden
