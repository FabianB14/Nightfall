import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { applyThemeVars } from './theme/tokens';
import { validateContent } from '@data/index';

// Fail loudly in dev if any content data is malformed (§11).
validateContent();
applyThemeVars();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
