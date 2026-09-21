import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'katex/dist/katex.min.css';
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global dynamic module chunk reload handler for new deployments
window.addEventListener('error', (event) => {
  if (
    event?.message &&
    (event.message.includes('Failed to fetch dynamically imported module') ||
     event.message.includes('MIME type of "text/html"'))
  ) {
    const isRetried = window.sessionStorage.getItem('module_load_retry');
    if (!isRetried) {
      window.sessionStorage.setItem('module_load_retry', 'true');
      window.location.reload();
    }
  }
});

// Disable right-click globally across the entire app
document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);