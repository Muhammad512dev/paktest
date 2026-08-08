import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './index.css';
import 'katex/dist/katex.min.css';
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

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