import { FinanceIcon } from './components/Icons';

const appLink = (language: 'de' | 'en') => `?demo=1&app=${language}`;

const inferReleaseLink = (asset: string) => {
  const configured = import.meta.env.VITE_REPOSITORY_URL as string | undefined;
  if (configured) return `${configured.replace(/\/$/, '')}/releases/latest/download/${asset}`;

  const host = window.location.hostname;
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (host.endsWith('.github.io') && pathParts[0]) {
    const owner = host.replace('.github.io', '');
    return `https://github.com/${owner}/${pathParts[0]}/releases/latest/download/${asset}`;
  }

  return '';
};

const languages = [
  {
    code: 'de' as const,
    label: 'Deutsch',
    title: 'FinanceForge Demo auf Deutsch',
    body: 'Öffne die echte lokale App-Oberfläche mit realistischen Vorführdaten, deutschen UI-Texten und Tooltips.',
    cta: 'Deutsche Demo öffnen',
    asset: 'financeforge-de.zip',
    download: 'Deutsche Version herunterladen',
  },
  {
    code: 'en' as const,
    label: 'English',
    title: 'FinanceForge demo in English',
    body: 'Open the real local app interface with realistic showcase data, English UI copy and tooltips.',
    cta: 'Open English demo',
    asset: 'financeforge-en.zip',
    download: 'Download English version',
  },
];

export default function PublicDemoLanding() {
  return (
    <main className="finance-app-shell min-h-screen px-4 py-8 text-slate-100 light:text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-8">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-forge-cyan/30 bg-forge-cyan/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-forge-cyan">
            <FinanceIcon name="shield" size={15} />
            100 % lokal · Open Source · No paywall
          </div>
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-white light:text-slate-950 md:text-6xl">
            FinanceForge
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300 light:text-slate-600">
            <span className="block">
              Eine lokale persönliche Finanz-App für Einnahmen, Ausgaben, Budgets, Sparziele, Konten und Projektionen.
              Diese öffentliche Demo enthält ausschließlich fiktive Vorführdaten und speichert nichts in deinem Browser.
            </span>
            <span className="mt-3 block">
              A local personal finance app for income, expenses, budgets, savings goals, accounts and projections.
              The public demo uses fictional showcase data only and does not store anything in your browser.
            </span>
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {languages.map((language) => {
            const releaseLink = inferReleaseLink(language.asset);
            return (
              <article key={language.code} className="glass-panel rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-forge-mint">
                      {language.label}
                    </p>
                    <h2 className="mt-3 text-2xl font-extrabold">{language.title}</h2>
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-forge-cyan/15 text-forge-cyan">
                    <FinanceIcon name={language.code === 'de' ? 'dashboard' : 'line-chart'} size={22} />
                  </span>
                </div>
                <p className="mt-4 min-h-16 text-sm leading-6 text-slate-400">{language.body}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a className="btn btn-primary" href={appLink(language.code)}>
                    {language.cta}
                  </a>
                  {releaseLink ? (
                    <a className="btn" href={releaseLink}>
                      {language.download}
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-400 light:border-slate-200">
                      Release-Download nach GitHub-Release aktiv
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div id="download" className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="glass-panel rounded-xl p-6">
            <h2 className="text-xl font-extrabold">Download / Local start</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Die App bleibt vollständig lokal. Nutzer laden den Quellcode oder ein Release-ZIP herunter,
              starten FinanceForge auf dem eigenen PC und speichern Finanzdaten ausschließlich im eigenen Browser.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              The app stays fully local. Users download the source code or a release ZIP, run FinanceForge on their own PC
              and keep financial data only in their own browser.
            </p>
            <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-white">
                <p className="font-bold">Deutsche Version</p>
                <code className="mt-2 block rounded-lg bg-slate-950/70 p-3 text-xs text-forge-cyan light:bg-slate-100">
                  npm.cmd run build:de
                </code>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-white">
                <p className="font-bold">English version</p>
                <code className="mt-2 block rounded-lg bg-slate-950/70 p-3 text-xs text-forge-cyan light:bg-slate-100">
                  npm.cmd run build:en
                </code>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-xl p-6">
            <h2 className="text-xl font-extrabold">Transparenz / Transparency</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-400">
              <li>Keine externen Trackingdienste / no external tracking.</li>
              <li>Keine Cloud-Speicherung und keine Bankzugänge / no cloud storage or bank access.</li>
              <li>Kein Login, kein Stripe, keine Paywall / no login, Stripe or paywall.</li>
              <li>Mit KI-Unterstützung erstellt und vom Projektinhaber geprüft / created with AI assistance and checked by the project owner.</li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
