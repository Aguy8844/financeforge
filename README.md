# FinanceForge

FinanceForge ist eine lokale, offene Finanz-App für Menschen, die Einnahmen, Ausgaben, Budgets, Sparziele, Konten und Zukunftsprojektionen selbst verwalten möchten.

Die App läuft auf deinem eigenen Gerät. Es gibt keine Cloud-Speicherung, kein Tracking, keine Bankzugänge, keinen Login, keine Paywall und keine Payment-Integration.

## Direkt Ausprobieren

Die öffentliche Demo nutzt fiktive Vorführdaten und speichert nichts in deinem Browser:

- Demo-Startseite: https://aguy8844.github.io/financeforge/?demo=1
- Deutsche Demo: https://aguy8844.github.io/financeforge/?demo=1&app=de
- English demo: https://aguy8844.github.io/financeforge/?demo=1&app=en

## Download

Sobald ein Release veröffentlicht ist, kannst du FinanceForge hier herunterladen:

- Releases: https://github.com/Aguy8844/financeforge/releases
- Deutsche Version: https://github.com/Aguy8844/financeforge/releases/latest/download/financeforge-de.zip
- English version: https://github.com/Aguy8844/financeforge/releases/latest/download/financeforge-en.zip

Wenn noch kein Release verfügbar ist, kannst du oben auf `Code` -> `Download ZIP` klicken und die App aus dem Quellcode starten.

## Start Für Normale Nutzer

### Variante A: Release-ZIP

1. Lade `financeforge-de.zip` oder `financeforge-en.zip` aus den Releases herunter.
2. Entpacke die ZIP-Datei.
3. Öffne unter Windows `start-financeforge.bat`.
4. FinanceForge startet lokal unter:

```text
http://127.0.0.1:5173
```

Hinweis: Die Release-ZIP enthält eine fertige statische Web-App. Der Start über `start-financeforge.bat` verwendet Python als kleinen lokalen Webserver. Falls Python nicht installiert ist, kannst du den entpackten Ordner auch mit jedem anderen lokalen Webserver starten.

### Variante B: Quellcode Starten

Voraussetzung: Node.js ist installiert.

```powershell
npm.cmd install
npm.cmd run dev
```

Danach öffnest du:

```text
http://127.0.0.1:5173
```

## Was FinanceForge Lokal Speichert

FinanceForge speichert deine Daten lokal im Browser über IndexedDB mit localStorage-Fallback. Deine Finanzdaten verlassen dein Gerät nicht.

Gespeichert werden können:

- Einstellungen
- Einnahmen
- Ausgaben
- Budgets
- Sparziele
- Vermögenskonten
- Eigenüberweisungen
- Kategorien und Quick-Tags
- Monatsabschlüsse
- lokale Erinnerungen

## Daten Exportieren, Importieren Und Löschen

In den Einstellungen kannst du:

- alle Daten als JSON exportieren
- ein JSON-Backup importieren
- Startdaten laden
- lokale Finanzdaten löschen

Beim Import wird nichts still überschrieben. Die App fragt vorher nach Bestätigung.

## Datenschutz Und Privatsphäre

- 100 % lokale Datenspeicherung
- keine Cloud-Synchronisierung
- keine externen Trackingdienste
- keine echten Bankzugänge
- keine sensiblen API-Keys im Frontend
- keine E-Mail- oder SMTP-Funktion
- keine Accounts, kein Login, keine Paywall

Die Demo im Web nutzt nur fiktive Daten. Sie ist nicht mit deinen lokalen FinanceForge-Daten verbunden.

## Enthaltene Funktionen

- Dashboard mit Monatszahlen, Warnungen und Charts
- Einnahmenverwaltung
- Ausgabenverwaltung
- Budgets mit Warnstufen
- Sparziele mit Prioritäten und Ziel-Fortschritt
- mehrere Vermögenskonten
- Eigenüberweisungen zwischen Konten
- Tages-Tracking als Linechart
- Tages-Einnahmen/Ausgaben-Säulenstatistik
- Kontostand-Verlauf pro Tag
- Spending Score und Ausgaben-Coach
- Fixkosten vs. variable Ausgaben
- Ausgaben-Review: notwendig, okay, unnötig
- Zukunftsprojektion mit Kapitalzufluss, Zinsen, Entnahme und Reinvestition
- lokale Erinnerungen und optionale Browser Notifications
- JSON Import/Export
- Monatsabschluss mit automatisch generiertem Kommentar
- deutsche und englische Build-Version

## Windows-Autostart

Wenn du FinanceForge aus dem Quellcode startest, liegen im Projekt zwei Starter:

- `start-financeforge.bat`: startet FinanceForge sichtbar im Terminal.
- `start-financeforge-hidden.vbs`: startet FinanceForge versteckt im Hintergrund.

Autostart einrichten:

1. `Win + R`
2. `shell:startup`
3. Verknüpfung zu `start-financeforge-hidden.vbs` in diesen Ordner legen.

Danach ist FinanceForge nach dem Windows-Login unter `http://127.0.0.1:5173` erreichbar.

## Für Entwickler

Tech Stack:

- React + Vite + TypeScript
- Tailwind CSS
- Recharts
- lucide-react
- IndexedDB mit localStorage-Fallback

Build:

```powershell
npm.cmd run build
```

Deutsche und englische Release-Builds:

```powershell
npm.cmd run build:de
npm.cmd run build:en
```

Release-ZIPs lokal erstellen:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1
```

GitHub Pages und Release-Downloads werden über die Workflows in `.github/workflows/` gebaut.

## Transparenz

Dieses Projekt wurde mit KI-Unterstützung erstellt und anschließend vom Projektinhaber geprüft. FinanceForge ist als öffentlich herunterladbares Open-Source-Projekt gedacht.

## Lizenz

MIT
