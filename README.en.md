# FinanceForge

FinanceForge is a local, open personal finance app for tracking income, expenses, budgets, savings goals, accounts and long-term projections.

The app runs on your own device. There is no cloud storage, no tracking, no bank connection, no login, no paywall and no payment integration.

## Try The Demo

The public demo uses fictional showcase data and does not store anything in your browser:

- Demo landing page: https://aguy8844.github.io/financeforge/?demo=1
- German demo: https://aguy8844.github.io/financeforge/?demo=1&app=de
- English demo: https://aguy8844.github.io/financeforge/?demo=1&app=en

## Download

Download the latest release:

- Releases: https://github.com/Aguy8844/financeforge/releases
- German version: https://github.com/Aguy8844/financeforge/releases/latest/download/financeforge-de.zip
- English version: https://github.com/Aguy8844/financeforge/releases/latest/download/financeforge-en.zip

## Start For Normal Users

### Option A: Release ZIP

1. Download `financeforge-de.zip` or `financeforge-en.zip` from the releases.
2. Extract the ZIP file.
3. On Windows, open `start-financeforge.bat`.
4. FinanceForge starts locally at:

```text
http://127.0.0.1:5173
```

The release ZIP contains a ready-made static web app. The start script uses Python as a small local web server. If Python is not installed, you can serve the extracted folder with any other local web server.

### Option B: Source Code

Requirement: Node.js is installed.

```powershell
npm.cmd install
npm.cmd run dev
```

Then open:

```text
http://127.0.0.1:5173
```

## Local Data Storage

FinanceForge stores your data locally in the browser via IndexedDB with a localStorage fallback. Your financial data does not leave your device.

FinanceForge can store:

- settings
- income
- expenses
- budgets
- savings goals
- asset accounts
- internal transfers
- categories and quick tags
- monthly closes
- local reminders

## Export, Import And Delete Data

In Settings you can:

- export all data as JSON
- import a JSON backup
- load starter data
- delete local finance data

Imports never overwrite data silently. The app asks for confirmation first.

## Privacy

- 100% local data storage
- no cloud sync
- no external tracking services
- no real bank access
- no sensitive API keys in the frontend
- no email or SMTP function
- no accounts, login or paywall

The web demo uses fictional data only. It is not connected to your local FinanceForge data.

## Included Features

- dashboard with monthly numbers, warnings and charts
- income management
- expense management
- budgets with warning levels
- savings goals with priorities and progress
- multiple asset accounts
- internal transfers between accounts
- daily tracking as a line chart
- daily income/expense bar chart
- account balance history by day
- spending score and spending coach
- fixed vs. variable expenses
- expense review: necessary, okay, unnecessary
- projection with capital inflow, interest, withdrawal and reinvestment
- local reminders and optional browser notifications
- JSON import/export
- monthly close with an automatically generated comment
- German and English build versions

## Windows Autostart

When you run FinanceForge from the source code, the project includes two starters:

- `start-financeforge.bat`: starts FinanceForge visibly in a terminal.
- `start-financeforge-hidden.vbs`: starts FinanceForge hidden in the background.

Set up autostart:

1. Press `Win + R`.
2. Enter `shell:startup`.
3. Put a shortcut to `start-financeforge-hidden.vbs` into that folder.

After Windows login, FinanceForge will be available at `http://127.0.0.1:5173`.

## For Developers

Tech stack:

- React + Vite + TypeScript
- Tailwind CSS
- Recharts
- lucide-react
- IndexedDB with localStorage fallback

Build:

```powershell
npm.cmd run build
```

German and English release builds:

```powershell
npm.cmd run build:de
npm.cmd run build:en
```

Create release ZIPs locally:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1
```

GitHub Pages and release downloads are built via the workflows in `.github/workflows/`.

## Transparency

This project was created with AI assistance and then checked by the project owner. FinanceForge is intended as a publicly downloadable open-source project.

## License

MIT
