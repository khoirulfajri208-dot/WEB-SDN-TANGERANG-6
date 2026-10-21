import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastContext.tsx';
import { ThemeProvider } from './utils/theme.ts';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { resilienceService } from './services/resilienceService.ts';
import { dailyScanSchedulerService } from './services/dailyScanSchedulerService.ts';
import './index.css';

// Initialize Boot Integrity, Self-Healing, and 15:00 Daily Scan Email Scheduler
resilienceService.init();
dailyScanSchedulerService.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Register PWA Service Worker for offline capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => {
        console.info('[PWA] Service Worker active:', reg.scope);
      },
      (err) => {
        console.info('[PWA] Service Worker registration notice:', err?.message || err);
      }
    );
  });
}
