# FinanceForge

FinanceForge ist eine lokale, offene persönliche Finanz-App für Einnahmen, Ausgaben, Budgets, Sparziele, Vermögenskonten, Projektionen und Erinnerungen.

Die App läuft im Browser auf dem eigenen PC. Es gibt keine Cloud-Speicherung, keine Trackingdienste, keine echten Bankzugänge, keinen Login, keine Paywall und keine Payment-Integration.

## Open-Source-Hinweis

FinanceForge ist als öffentlich herunterladbares Open-Source-Projekt gedacht. Der Code darf lokal geprüft, angepasst und selbst gebaut werden. Die enthaltene öffentliche Demo nutzt ausschließlich fiktive Vorführdaten.

Dieses Projekt wurde mit KI-Unterstützung erstellt und anschließend vom Projektinhaber geprüft.

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- Recharts
- lucide-react
- IndexedDB mit localStorage-Fallback

## Lokal Starten

```powershell
npm.cmd install
npm.cmd run dev
```

Frontend:

```text
http://127.0.0.1:5173
```

Der Dev-Server ist bewusst auf Port `5173` fixiert, damit die lokale URL stabil bleibt.

## Öffentliche Demo

Lokale Demo-Startseite:

```text
http://127.0.0.1:5173/demo
```

Direkte App-Demos:

```text
http://127.0.0.1:5173/demo/de
http://127.0.0.1:5173/demo/en
```

Für statische Hosts wie GitHub Pages funktionieren zusätzlich:

```text
?demo=1
?demo=1&app=de
?demo=1&app=en
```

Die Demo ist ein Klon der echten App-Oberfläche mit fiktiven Daten. Sie liest keine lokalen FinanceForge-Daten und schreibt nichts in IndexedDB oder localStorage.

## Deutsche und Englische Builds

Deutsche Version bauen:

```powershell
npm.cmd run build:de
```

Englische Version bauen:

```powershell
npm.cmd run build:en
```

Release-ZIP-Dateien unter Windows erstellen:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1
```

Danach liegen diese Dateien in `release/`:

```text
financeforge-de.zip
financeforge-en.zip
```

## GitHub Pages Preview

1. Repository öffnen:

```text
https://github.com/Aguy8844/financeforge
```

2. Lokales Repository pushen:

```powershell
git remote add origin https://github.com/Aguy8844/financeforge.git
git branch -M main
git push -u origin main
```

3. In GitHub öffnen: `Settings` -> `Pages`.
4. Als Source `GitHub Actions` auswählen.
5. Nach dem Push läuft `.github/workflows/pages.yml`.
6. Die Preview ist danach unter dieser Form erreichbar:

```text
https://aguy8844.github.io/financeforge/?demo=1
```

Deutsch:

```text
https://aguy8844.github.io/financeforge/?demo=1&app=de
```

English:

```text
https://aguy8844.github.io/financeforge/?demo=1&app=en
```

## Öffentliche Downloads über GitHub Releases

Wenn du ein GitHub Release veröffentlichst, baut `.github/workflows/release.yml` automatisch:

- `financeforge-de.zip`
- `financeforge-en.zip`

Diese Dateien werden an das Release angehängt und sind öffentlich herunterladbar.

Damit die Download-Buttons auf der Demo-Startseite direkt auf dein Repository zeigen, kannst du in GitHub unter `Settings` -> `Secrets and variables` -> `Actions` oder lokal in einer `.env` setzen:

```env
VITE_REPOSITORY_URL=https://github.com/Aguy8844/financeforge
```

Auf GitHub Pages versucht die Demo den Repository-Link außerdem automatisch aus der Pages-URL abzuleiten.

## Datenschutz und Privatsphäre

- Finanzdaten werden lokal im Browser gespeichert.
- Keine Cloud-Synchronisierung.
- Keine externen Trackingdienste.
- Keine echten Bankzugänge.
- Keine sensiblen API-Keys im Frontend.
- JSON-Export und JSON-Import bleiben vollständig lokal.
- Daten können in den Einstellungen gelöscht oder über Browserdaten entfernt werden.

## Windows-Autostart

Im Projekt liegen zwei Starter:

- `start-financeforge.bat`: startet FinanceForge sichtbar in einem Terminal.
- `start-financeforge-hidden.vbs`: startet FinanceForge versteckt im Hintergrund.

Autostart-Ordner:

1. `Win + R`
2. `shell:startup`
3. Verknüpfung zu `start-financeforge-hidden.vbs` in diesen Ordner legen.

Danach ist FinanceForge nach dem Windows-Login unter `http://127.0.0.1:5173` erreichbar.

## Enthaltene Features

- Dashboard mit Monatszahlen, Warnungen und Charts
- Spending Score mit Budgettempo, No-Spend-Tagen, flexiblen Ausgaben, Sparquote und Ausgaben-Review
- Tages-Tracking als Linechart
- Tages-Einnahmen/Ausgaben-Säulenstatistik
- Kontostand-Verlauf pro Tag für Privatkonto, Sparkonto und Gesamtvermögen
- Wochenansicht für Einnahmen, Ausgaben und Netto
- Heute-darf-ich-ausgeben Anzeige
- Schnell-Sparen per Eigenüberweisung aufs Sparkonto
- Mehrere Vermögenskonten mit Plus-Kachel
- Einmalige und wiederkehrende Einnahmen
- Einmalige und wiederkehrende Ausgaben
- Ausgaben-Review: notwendig, okay, unnötig
- Fixkosten vs. variable Ausgaben
- Budgetübersicht mit Warnstufen
- Sparziele mit Prioritäten und Verteilung
- Zukunftsprojektion mit Kapitalzufluss, Zinsen, Entnahme und Reinvestition
- Lokale Erinnerungen und optional Browser Notifications
- Einstellungen, Kategorien, Quick-Tags, JSON Import/Export
- Monatsabschluss mit automatisch generiertem Kommentar

## Lizenz

MIT
