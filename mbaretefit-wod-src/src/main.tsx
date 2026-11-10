import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './index.css';

// PWA: instala el service worker y se actualiza sola cuando hay una versión nueva.
registerSW({ immediate: true });

const root = document.getElementById('root');
if (!root) throw new Error('Falta el elemento #root en index.html.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
