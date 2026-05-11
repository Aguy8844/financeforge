import { useMemo } from 'react';
import App from './App';
import { createShowcaseState, SHOWCASE_MONTH } from './data/showcaseData';
import PublicDemoLanding from './PublicDemoLanding';
import type { Language } from './lib/staticTranslations';

export default function MarketingDemo() {
  const params = new URLSearchParams(window.location.search);
  const pathLanguage = window.location.pathname.match(/\/demo\/(de|en)\/?$/)?.[1] as Language | undefined;
  const hashLanguage = window.location.hash.match(/^#\/demo\/(de|en)$/)?.[1] as Language | undefined;
  const appLanguage = params.get('app') === 'en' || params.get('app') === 'de'
    ? (params.get('app') as Language)
    : undefined;
  const language = pathLanguage ?? hashLanguage ?? appLanguage;
  const demoState = useMemo(() => createShowcaseState(), []);

  if (!language) return <PublicDemoLanding />;

  return <App mode="demo" initialState={demoState} initialMonth={SHOWCASE_MONTH} language={language} />;
}
