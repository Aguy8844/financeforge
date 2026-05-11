import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildProjection, getMonthlySummary } from '../lib/calculations';
import { formatDate, formatMonth } from '../lib/date';
import { clamp, formatMoney, formatPercent } from '../lib/format';
import { Card, SectionHeader, StatCard } from '../components/ui';
import type { ViewProps } from './types';

const periods = [
  { label: '6 Monate', value: 6 },
  { label: '12 Monate', value: 12 },
  { label: '24 Monate', value: 24 },
  { label: '36 Monate', value: 36 },
  { label: '60 Monate', value: 60 },
  { label: 'Benutzerdefiniert', value: 0 },
];

export const ProjectionView = ({ state, setState, selectedMonth }: ViewProps) => {
  const [period, setPeriod] = useState(24);
  const [customMonths, setCustomMonths] = useState(48);
  const months = period === 0 ? customMonths : period;
  const selectedSummary = getMonthlySummary(state, selectedMonth);
  const projection = useMemo(() => buildProjection(state, months), [state, months]);
  const lastPoint = projection[projection.length - 1];
  const firstPoint = projection[0];
  const compareRates = Array.from(new Set([1, state.settings.annualInterestRate, 5])).sort((a, b) => a - b);
  const comparison = projection.map((point, index) => {
    const row: Record<string, string | number> = { label: point.label };
    compareRates.forEach((rate) => {
      row[`${rate}%`] = Math.round(buildProjection(state, months, rate)[index].balance);
    });
    return row;
  });

  const updateSetting = <K extends keyof typeof state.settings>(key: K, value: (typeof state.settings)[K]) => {
    setState((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Endvermögen"
          value={formatMoney(lastPoint?.balance ?? state.settings.startBalance)}
          icon="projection"
          tone="mint"
          detail={`${months} Monate`}
        />
        <StatCard
          label="Zinsertrag Monat"
          value={formatMoney(firstPoint?.interest ?? 0)}
          icon="line-chart"
          tone="cyan"
          detail={formatPercent(state.settings.annualInterestRate)}
        />
        <StatCard
          label="Entnehmbarer Anteil"
          value={formatMoney(firstPoint?.withdrawableInterest ?? 0)}
          icon="wallet"
          tone="violet"
          detail={formatPercent(state.settings.withdrawableInterestPercentage)}
        />
        <StatCard
          label="Reinvestiert"
          value={formatMoney(firstPoint?.reinvestedInterest ?? 0)}
          icon="repeat"
          tone="amber"
          detail={formatPercent(state.settings.reinvestInterestPercentage)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionHeader title="Projektionsparameter" />
          <div className="space-y-4">
            <label>
              <span className="label">Zeitraum</span>
              <select className="field mt-1" value={period} onChange={(event) => setPeriod(Number(event.target.value))}>
                {periods.map((item) => (
                  <option key={item.label} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {period === 0 ? (
              <label>
                <span className="label">Benutzerdefinierte Monate</span>
                <input className="field mt-1" min="1" max="240" type="number" value={customMonths} onChange={(event) => setCustomMonths(clamp(Number(event.target.value), 1, 240))} />
              </label>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">Startvermögen</span>
                <input className="field mt-1" type="number" step="0.01" value={state.settings.startBalance} onChange={(event) => updateSetting('startBalance', Number(event.target.value))} />
              </label>
              <label>
                <span className="label">Standard-Sparrate</span>
                <input className="field mt-1" type="number" step="0.01" value={state.settings.defaultSavingsRate} onChange={(event) => updateSetting('defaultSavingsRate', Number(event.target.value))} />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 light:text-slate-700">
              <input type="checkbox" checked={state.settings.projectionUseManualValues} onChange={(event) => updateSetting('projectionUseManualValues', event.target.checked)} />
              Manuelle Monatswerte für Projektion verwenden
            </label>
            {state.settings.projectionUseManualValues ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="label">Monatliche Einnahmen</span>
                  <input className="field mt-1" type="number" step="0.01" value={state.settings.projectionMonthlyIncome} onChange={(event) => updateSetting('projectionMonthlyIncome', Number(event.target.value))} />
                </label>
                <label>
                  <span className="label">Monatliche Ausgaben</span>
                  <input className="field mt-1" type="number" step="0.01" value={state.settings.projectionMonthlyExpenses} onChange={(event) => updateSetting('projectionMonthlyExpenses', Number(event.target.value))} />
                </label>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 p-3 text-sm text-slate-300 light:border-slate-200 light:text-slate-700">
                Aktuell aus Einträgen: {formatMoney(selectedSummary.incomeTotal)} Einnahmen und {formatMoney(selectedSummary.expenseTotal)} Ausgaben im ausgewählten Monat.
              </div>
            )}

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 light:text-slate-700">
              <input type="checkbox" checked={state.settings.futureCapitalEnabled} onChange={(event) => updateSetting('futureCapitalEnabled', event.target.checked)} />
              Kapitalzufluss aktiv
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">Erwartetes zukünftiges Kapital</span>
                <input className="field mt-1" type="number" step="0.01" value={state.settings.futureCapitalAmount} onChange={(event) => updateSetting('futureCapitalAmount', Number(event.target.value))} />
              </label>
              <label>
                <span className="label">Datum des Kapitalzuflusses</span>
                <input className="field mt-1" type="date" value={state.settings.futureCapitalDate} onChange={(event) => updateSetting('futureCapitalDate', event.target.value)} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label>
                <span className="label">Zinssatz pro Jahr (%)</span>
                <input className="field mt-1" type="number" step="0.01" value={state.settings.annualInterestRate} onChange={(event) => updateSetting('annualInterestRate', Number(event.target.value))} />
              </label>
              <label>
                <span className="label">Entnehmbarer Anteil (%)</span>
                <input className="field mt-1" min="0" max="100" type="number" value={state.settings.withdrawableInterestPercentage} onChange={(event) => updateSetting('withdrawableInterestPercentage', clamp(Number(event.target.value), 0, 100))} />
              </label>
              <label>
                <span className="label">Reinvestierter Anteil (%)</span>
                <input className="field mt-1" min="0" max="100" type="number" value={state.settings.reinvestInterestPercentage} onChange={(event) => updateSetting('reinvestInterestPercentage', clamp(Number(event.target.value), 0, 100))} />
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Entwicklung mit und ohne Kapitalzufluss" />
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} width={42} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type="monotone" dataKey="balance" name="Mit Kapitalzufluss" stroke="#47D7AC" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="balanceWithoutCapital" name="Ohne Kapitalzufluss" stroke="#A78BFA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <SectionHeader title="Zinssatz-Vergleich" />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} width={42} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                {compareRates.map((rate, index) => (
                  <Line
                    key={rate}
                    type="monotone"
                    dataKey={`${rate}%`}
                    stroke={['#38BDF8', '#47D7AC', '#FBBF24'][index] ?? '#A78BFA'}
                    strokeWidth={rate === state.settings.annualInterestRate ? 3 : 2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Monatliche Zinserträge" />
          <div className="space-y-3">
            {projection.slice(0, 6).map((point) => (
              <div key={point.month} className="rounded-lg border border-white/10 p-3 light:border-slate-200">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold">{formatMonth(point.month)}</p>
                  <p className="font-bold">{formatMoney(point.interest)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  entnehmbar {formatMoney(point.withdrawableInterest)} · reinvestiert {formatMoney(point.reinvestedInterest)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] p-3 text-sm text-cyan-100 light:bg-cyan-50 light:text-cyan-900">
            Dies ist eine Simulation und keine Finanzberatung. Kapital, Zinssatz und Entnahmequote sind frei editierbare Annahmen.
          </p>
          <p className="mt-3 text-xs text-slate-500">Kapitalzufluss geplant am {formatDate(state.settings.futureCapitalDate)}.</p>
        </Card>
      </div>
    </div>
  );
};
