import { useEffect } from 'react';

export type Language = 'de' | 'en';

const exactTranslations: Record<string, string> = {
  Dashboard: 'Dashboard',
  Einnahmen: 'Income',
  Ausgaben: 'Expenses',
  Budgets: 'Budgets',
  Sparziele: 'Savings goals',
  Projektion: 'Projection',
  Erinnerungen: 'Reminders',
  Einstellungen: 'Settings',
  Monat: 'Month',
  'Zur App': 'Open app',
  'Statische Demo': 'Static demo',
  'Öffentliche Vorführdaten': 'Public showcase data',
  'Private Finance OS': 'Private finance OS',
  'Lokale Finanz-App': 'Local finance app',
  'Fake-Daten': 'Fake data',
  'Keine Speicherung': 'No storage',
  'Echte UI': 'Real UI',
  Tooltips: 'Tooltips',
  'FinanceForge Cockpit': 'FinanceForge cockpit',
  'Dein Privatkonto bleibt Alltag, dein Sparkonto baut Ziele': 'Keep daily money separate from long-term goals',
  Vermögen: 'Assets',
  Einträge: 'Entries',
  'Aktive Ziele': 'Active goals',
  'Spending Score': 'Spending score',
  Gesamteinnahmen: 'Total income',
  Gesamtausgaben: 'Total expenses',
  Überschuss: 'Surplus',
  Tagesbudget: 'Daily budget',
  'Ausgaben-Coach': 'Spending coach',
  Budgetdruck: 'Budget pressure',
  'Freizeit + Essen': 'Leisure + food',
  'Rest pro Tag': 'Left per day',
  'Sparkonto als Ziel-Pool': 'Savings account as goal pool',
  Sparkonto: 'Savings account',
  Zielabdeckung: 'Goal coverage',
  Privatkonto: 'Current account',
  'Heute darf ich ausgeben': 'Today I can spend',
  'Erlaubt heute': 'Allowed today',
  'Heute ausgegeben': 'Spent today',
  'Heute noch frei': 'Still available today',
  'Schnell sparen': 'Quick saving',
  Direktüberweisung: 'Direct transfer',
  'Zwischen Privatkonto und Sparkonto umbuchen.': 'Move money between current account and savings account.',
  'Privat -> Sparen': 'Current -> Savings',
  'Sparen -> Privat': 'Savings -> Current',
  'Geld zu deinen Sparzielen legen.': 'Move money toward your savings goals.',
  'Sparkonto anzapfen, wenn es nötig ist.': 'Use savings when you need to.',
  'Erhöht deinen Sparziel-Pool.': 'Increases your savings goal pool.',
  'Reduziert deinen Sparziel-Pool.': 'Reduces your savings goal pool.',
  'Netto Sparkonto-Transfers': 'Net savings transfers',
  Buchen: 'Post',
  Betrag: 'Amount',
  'Notiz optional': 'Optional note',
  Verschieben: 'Move',
  Fixkosten: 'Fixed costs',
  'Variable Ausgaben': 'Variable expenses',
  Monatsbudget: 'Monthly budget',
  'Idealer Verbrauch bis heute': 'Ideal spend until today',
  'Vormonat Vergleich': 'Previous month comparison',
  Ausgabenfortschritt: 'Spending progress',
  'Top-Ausgabenkategorien': 'Top expense categories',
  'Tages-Tracking': 'Daily tracking',
  'Privatkonto aktuell': 'Current account now',
  'Sparkonto aktuell': 'Savings account now',
  'Einnahmen im Monat': 'Monthly income',
  'Tage mit Ausgaben': 'Days with spending',
  'No-Spend-Tage': 'No-spend days',
  'Teuerster Tag': 'Most expensive day',
  'Ins Sparkonto verschoben': 'Moved to savings',
  'Tägliche Einnahmen/Ausgaben': 'Daily income/expenses',
  'Kontostand pro Tag': 'Account balance by day',
  Wochenansicht: 'Weekly view',
  Vermögensentwicklung: 'Asset development',
  Monatsvergleich: 'Monthly comparison',
  'Wichtigste Sparziele': 'Main savings goals',
  Monatsabschluss: 'Monthly close',
  Abschließen: 'Close month',
  Sparbetrag: 'Saved amount',
  Status: 'Status',
  'Einnahme erfassen': 'Add income',
  'Einnahme bearbeiten': 'Edit income',
  'Einnahmenliste': 'Income list',
  Datum: 'Date',
  Name: 'Name',
  Kategorie: 'Category',
  Tags: 'Tags',
  Wiederholung: 'Recurrence',
  Aktionen: 'Actions',
  Bearbeiten: 'Edit',
  Löschen: 'Delete',
  Speichern: 'Save',
  Aktualisieren: 'Update',
  Abbrechen: 'Cancel',
  Quelle: 'Source',
  'Quelle optional': 'Optional source',
  Vermögenskonto: 'Asset account',
  'Quick-Tags': 'Quick tags',
  'Nur dieses Monat': 'This month only',
  'Jeden Monat': 'Every month',
  Benutzerdefiniert: 'Custom',
  Startmonat: 'Start month',
  'Endmonat optional': 'Optional end month',
  Rhythmus: 'Rhythm',
  'Alle 2 Monate': 'Every 2 months',
  Quartalsweise: 'Quarterly',
  Jährlich: 'Yearly',
  'Eigener Abstand': 'Custom interval',
  Aktiv: 'Active',
  'Ausgaben Monat': 'Monthly expenses',
  'Ø pro Monat': 'Average per month',
  'Vergleich Vormonat': 'Compared with previous month',
  'Top-Kategorie': 'Top category',
  'Stärkster Tag': 'Strongest tag',
  'Ausgaben-Bremse': 'Spending brake',
  'Gegen idealen Verlauf': 'Against ideal pace',
  'Freizeit + Essen/Trinken': 'Leisure + food/drinks',
  Empfehlung: 'Recommendation',
  'Plan halten': 'Stay on plan',
  'Fixkosten vs. variabel': 'Fixed vs. variable',
  Variabel: 'Variable',
  'Fixkosten-Anteil': 'Fixed cost share',
  'Ausgaben-Review': 'Expense review',
  Notwendig: 'Necessary',
  Okay: 'Okay',
  Unnötig: 'Unnecessary',
  Tagesauswertung: 'Daily analysis',
  'Getrackte Ausgabentage': 'Tracked spending days',
  'Höchster Tagesabfluss': 'Highest daily outflow',
  'Ausgabe erfassen': 'Add expense',
  'Ausgabe bearbeiten': 'Edit expense',
  'Name/Beschreibung': 'Name/description',
  'Zahlungsart optional': 'Optional payment method',
  Art: 'Type',
  Einmalig: 'One-time',
  Monatlich: 'Monthly',
  Ausgabenliste: 'Expense list',
  Beschreibung: 'Description',
  Bewertung: 'Rating',
  Ausgabenentwicklung: 'Expense trend',
  'Höchste Einzel-Ausgaben': 'Highest single expenses',
  'Ausgaben nach Tags': 'Expenses by tags',
  Allgemein: 'General',
  Währung: 'Currency',
  Sprache: 'Language',
  Darstellung: 'Appearance',
  Standardansicht: 'Default view',
  Finanzparameter: 'Financial parameters',
  Startvermögen: 'Starting assets',
  'Standard-Sparrate': 'Default savings rate',
  'Zinssatz (%)': 'Interest rate (%)',
  'Zukünftiges Kapital': 'Future capital',
  'Kapitalzufluss-Datum': 'Capital inflow date',
  'Entnehmbarer Zinsanteil (%)': 'Withdrawable interest share (%)',
  'Reinvestierter Zinsanteil (%)': 'Reinvested interest share (%)',
  'Kapitalzufluss aktiv': 'Capital inflow active',
  Vermögenskonten: 'Asset accounts',
  Startstand: 'Opening balance',
  'Snapshot-Datum': 'Snapshot date',
  'Konto löschen': 'Delete account',
  'Konto hinzufügen': 'Add account',
  'Neues Konto': 'New account',
  Farbe: 'Color',
  Icon: 'Icon',
  Selbstüberweisung: 'Internal transfer',
  Von: 'From',
  Nach: 'To',
  Überweisung: 'Transfer',
  'Überweisung speichern': 'Save transfer',
  Kategorien: 'Categories',
  'Neue Kategorie': 'New category',
  Ausgabe: 'Expense',
  Einnahme: 'Income',
  Verwendung: 'Usage',
  Hinzufügen: 'Add',
  'Import und Export': 'Import and export',
  'Backup exportieren': 'Export backup',
  'JSON importieren': 'Import JSON',
  'Aktuelle Startdaten laden': 'Load starter data',
  'Alle Daten löschen': 'Delete all data',
  'Lokale Erinnerungen': 'Local reminders',
  'Lokale Erinnerungen aktivieren': 'Enable local reminders',
  'Browser-Hinweis': 'Browser notification',
  'Browser-Hinweis testen': 'Test browser notification',
  Erinnerungstext: 'Reminder text',
  'Budgetübersicht': 'Budget overview',
  'Budget erstellen': 'Create budget',
  Budgetname: 'Budget name',
  'Kategorie optional': 'Optional category',
  'Monatsabschluss speichern': 'Save monthly close',
  'Keine Daten': 'No data',
  'Keine Einnahmen': 'No income',
  'Keine Ausgaben': 'No expenses',
  'Keine Analyse': 'No analysis',
  'Deutsch': 'German',
  'Dark Mode': 'Dark mode',
  'Light Mode': 'Light mode',
  Arbeit: 'Work',
  Uni: 'University',
  Freizeit: 'Leisure',
  'Essen/Trinken': 'Food/drinks',
  Kleidung: 'Clothing',
  Eigenüberweisungen: 'Internal transfers',
  Essen: 'Food',
  Lebensmittel: 'Groceries',
  Transport: 'Transport',
  Technik: 'Tech',
  Motorrad: 'Motorcycle',
  Auto: 'Car',
  Gesundheit: 'Health',
  Abos: 'Subscriptions',
  Wohnen: 'Housing',
  Geschenke: 'Gifts',
  Sonstiges: 'Other',
  Kapitalertrag: 'Capital income',
  Familie: 'Family',
  Nettoeinkommen: 'Net income',
  notwendig: 'necessary',
  okay: 'okay',
  unnötig: 'unnecessary',
  monatlich: 'monthly',
  'Jeden Monat wiederholen': 'Repeat every month',
  'Nur dieses Monat wiederholen': 'This month only',
};

const phraseTranslations: Array<[string, string]> = [
  ['Alle Konten, Buchungen, Budgets und Sparziele sind frei erfundene Vorführdaten für Screenshots und GitHub.', 'All accounts, transactions, budgets and savings goals are fictional showcase data for screenshots and GitHub.'],
  ['Änderungen in der Demo laufen nur in der aktuellen Browser-Session und werden nicht in IndexedDB oder localStorage geschrieben.', 'Changes in the demo only live in the current browser session and are not written to IndexedDB or localStorage.'],
  ['Die Demo verwendet die echte FinanceForge-Shell, Navigation, Formulare, Auswertungen und Diagramme.', 'The demo uses the real FinanceForge shell, navigation, forms, analytics and charts.'],
  ['Fahre über die Info-Symbole, um zu erklären, was Besucher auf GitHub gerade sehen.', 'Hover the info icons to explain what GitHub visitors are seeing.'],
  ['Dies ist eine Simulation und keine Finanzberatung.', 'This is a simulation and not financial advice.'],
  ['Monatsabschluss gespeichert', 'Monthly close saved'],
  ['Noch nicht abgeschlossen', 'Not closed yet'],
  ['Budgetverbrauch und Restbudget im ausgewählten Monat.', 'Budget usage and remaining budget in the selected month.'],
  ['Jeder Tag wird einzeln getrackt', 'Each day is tracked individually'],
  ['Eigene Säulenstatistik für direkte Tagesvergleiche.', 'Separate bar chart for direct daily comparisons.'],
  ['Privatkonto, Sparkonto und Gesamtvermögen im Monatsverlauf.', 'Current account, savings account and total assets during the month.'],
  ['Simulation auf Basis deiner editierbaren Parameter.', 'Simulation based on your editable parameters.'],
  ['Einnahmen, Ausgaben und Überschuss der letzten Monate.', 'Income, expenses and surplus over the last months.'],
  ['Jeder Euro dort zählt automatisch zu deinen Sparzielen.', 'Every euro there automatically counts toward your savings goals.'],
  ['Eigenüberweisung direkt vom Privatkonto aufs Sparkonto.', 'Internal transfer directly from the current account to the savings account.'],
  ['Lokale Daten werden vorbereitet.', 'Local data is being prepared.'],
  ['FinanceForge wird geladen', 'FinanceForge is loading'],
  ['Demo wird nicht gespeichert.', 'Demo is not saved.'],
  ['über idealem Verlauf', 'above ideal pace'],
  ['unter idealem Verlauf', 'below ideal pace'],
  ['für den restlichen Monat', 'for the rest of the month'],
  ['stärkster Hebel zum Bremsen', 'strongest lever to slow spending'],
  ['stark', 'strong'],
  ['stabil', 'stable'],
  ['angespannt', 'strained'],
  ['kritisch', 'critical'],
  ['Prio', 'Priority'],
  ['Restbetrag', 'Remaining'],
  ['Sparkonto-Anteil', 'Savings share'],
  ['Buchungen', 'transactions'],
  ['Monatliches Einkommen', 'Monthly income'],
  ['Automatische Sparrate', 'Automatic savings rate'],
  ['Verfügbar:', 'Available:'],
];

const monthTranslations: Record<string, string> = {
  Januar: 'January',
  Februar: 'February',
  März: 'March',
  April: 'April',
  Mai: 'May',
  Juni: 'June',
  Juli: 'July',
  August: 'August',
  September: 'September',
  Oktober: 'October',
  November: 'November',
  Dezember: 'December',
};

const attributeNames = ['placeholder', 'title', 'aria-label'];

const preserveWhitespace = (source: string, translated: string) => {
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
};

const translateText = (source: string) => {
  const trimmed = source.trim();
  if (!trimmed) return source;
  if (exactTranslations[trimmed]) return preserveWhitespace(source, exactTranslations[trimmed]);

  let next = source;
  phraseTranslations.forEach(([from, to]) => {
    next = next.split(from).join(to);
  });
  Object.entries(monthTranslations).forEach(([from, to]) => {
    next = next.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  });
  return next;
};

const translateNode = (node: Node) => {
  if (node.nodeType === Node.TEXT_NODE && node.textContent) {
    const translated = translateText(node.textContent);
    if (translated !== node.textContent) node.textContent = translated;
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as HTMLElement;
  if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(element.tagName)) return;

  attributeNames.forEach((attribute) => {
    const value = element.getAttribute(attribute);
    if (!value) return;
    const translated = translateText(value);
    if (translated !== value) element.setAttribute(attribute, translated);
  });

  element.childNodes.forEach(translateNode);
};

export const useStaticTranslations = (language: Language) => {
  useEffect(() => {
    document.documentElement.lang = language;
    if (language !== 'en') return;

    const root = document.getElementById('root');
    if (!root) return;

    translateNode(root);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          translateNode(mutation.target);
          return;
        }
        mutation.addedNodes.forEach(translateNode);
      });
    });
    observer.observe(root, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
};

export const buildLanguage = (): Language =>
  import.meta.env.VITE_FINANCEFORGE_LANGUAGE === 'en' ? 'en' : 'de';
