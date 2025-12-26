import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Global error handler for startup crashes
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>Application Crashed at Startup</h1>
        <p><strong>Error:</strong> ${message}</p>
        <p><strong>Source:</strong> ${source}:${lineno}:${colno}</p>
        <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px; overflow: auto;">
          ${error?.stack || 'No stack trace available'}
        </pre>
      </div>
    `;
  }
};

try {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (e: any) {
  console.error("Startup Error:", e);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>Application Initialization Failed</h1>
        <p><strong>Error:</strong> ${e.message}</p>
        <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px; overflow: auto;">
          ${e.stack || 'No stack trace available'}
        </pre>
      </div>
    `;
  }
}
