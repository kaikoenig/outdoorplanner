# Outdoor Planner

Webbasierte Verwaltung von Outdoor-Ausrüstung: Inventarliste mit Bildern und Touren­planung, bei der Ausrüstungsgegenstände vom Typ "Container" (z.B. Rucksäcke) mit anderer Ausrüstung befüllt werden können. Das Gesamtgewicht der Tour wird live berechnet.

## Architektur

Die Seite ist eine reine Single-Page-Application ohne Backend:

- **Daten**: Alle Ausrüstungsgegenstände, Bilder und Touren werden lokal im Browser in **IndexedDB** gespeichert (via [Dexie](https://dexie.org/)). Es gibt keinen Server und keine externe Datenbank – die App läuft komplett clientseitig und ist als PWA auch offline nutzbar.
- **Kehrseite**: Die Daten sind an den jeweiligen Browser/das Gerät gebunden. Es gibt aktuell keine automatische Synchronisation zwischen Geräten.
- **Frontend**: React + TypeScript + Vite, `@dnd-kit` für das Drag & Drop beim Befüllen von Containern, `react-router-dom` (HashRouter, damit Routing auch ohne Server-Rewrite auf statischem Hosting funktioniert).

## Entwicklung

```bash
npm install
npm run dev
```

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

- **EquipmentItem**: `name`, `type` (`container` | `item`), `category`, `weight` (g), `brand`, `quantity`, optionales `image` (Blob)
- **Tour**: `name`, Liste von Containern; jeder Container referenziert einen `EquipmentItem` vom Typ `container`, hat einen tourspezifischen Namen und eine Liste befüllter Gegenstände mit Menge

## Backup / Datenmigration

Da die Daten lokal im Browser liegen, empfiehlt sich früher oder später eine Export/Import-Funktion (JSON + Bilder) als manuelles Backup bzw. zum Übertragen auf ein anderes Gerät. Das ist noch nicht umgesetzt.
