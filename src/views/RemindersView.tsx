import { useState } from 'react';
import { getReminderMessages } from '../lib/calculations';
import { currentMonthKey } from '../lib/date';
import { Card, EmptyState, SectionHeader } from '../components/ui';
import type { ViewProps } from './types';

const reminderLabels: Record<string, string> = {
  'missing-income': 'Keine Einnahmen im aktuellen Monat',
  'missing-expense': 'Keine Ausgaben im aktuellen Monat',
  'stale-expenses': 'Länger als 7 Tage keine Ausgabe',
  'monthly-close': 'Monatsabschluss fehlt',
};

export const RemindersView = ({ state, setState, selectedMonth, notify }: ViewProps) => {
  const [customText, setCustomText] = useState('Bitte aktualisiere deine Monatsdaten in FinanceForge.');
  const messages = getReminderMessages(state, selectedMonth || currentMonthKey());

  const updateRemindersEnabled = (enabled: boolean) => {
    setState((current) => ({ ...current, settings: { ...current.settings, remindersEnabled: enabled } }));
  };

  const toggleReminder = (id: string) => {
    setState((current) => ({
      ...current,
      reminders: current.reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder,
      ),
    }));
  };

  const sendBrowserNotification = async () => {
    if (!('Notification' in window)) {
      notify('Browser-Benachrichtigungen werden nicht unterstützt.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      notify('Benachrichtigung wurde nicht erlaubt.');
      return;
    }
    new Notification('FinanceForge Erinnerung: Monatsdaten aktualisieren', {
      body: customText,
    });
    notify('Browser-Benachrichtigung ausgelöst.');
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <SectionHeader title="Lokale Erinnerungen" />
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 p-4 light:border-slate-200">
            <div>
              <p className="font-bold">Erinnerungen</p>
              <p className="text-sm text-slate-400">Lokale Hinweise laufen ohne Konto, Server oder Cloud.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={state.settings.remindersEnabled}
                onChange={(event) => updateRemindersEnabled(event.target.checked)}
              />
              Aktiv
            </label>
          </div>

          {messages.length ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50">
                  <p className="font-bold">{message.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{message.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="reminders" title="Keine aktiven Hinweise">
              Für den ausgewählten Monat sind keine lokalen Erinnerungen offen.
            </EmptyState>
          )}

          <div className="mt-4 space-y-2">
            {state.reminders.map((reminder) => (
              <label key={reminder.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm light:border-slate-200">
                <span>{reminderLabels[reminder.type]}</span>
                <input type="checkbox" checked={reminder.enabled} onChange={() => toggleReminder(reminder.id)} />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Browser-Hinweis"
            description="Optionaler lokaler Hinweis über die Browser Notification API. Es wird nichts an externe Dienste gesendet."
          />
          <div className="space-y-4">
            <label>
              <span className="label">Erinnerungstext</span>
              <textarea className="field mt-1 min-h-28" value={customText} onChange={(event) => setCustomText(event.target.value)} />
            </label>
            <div className="rounded-xl border border-white/10 p-4 text-sm leading-6 text-slate-400 light:border-slate-200">
              FinanceForge kann dich im geöffneten Browser lokal erinnern. Es werden keine externen Dienste
              angesprochen und keine Zugangsdaten für Benachrichtigungen benötigt.
            </div>
            <button className="btn btn-primary" type="button" onClick={sendBrowserNotification}>
              Browser-Hinweis testen
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
