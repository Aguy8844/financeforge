import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import MarketingDemo from './MarketingDemo';
import './index.css';

const isDemoRoute =
  window.location.pathname.includes('/demo') ||
  new URLSearchParams(window.location.search).has('demo') ||
  window.location.hash.startsWith('#/demo');
const Root = isDemoRoute ? MarketingDemo : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
