import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initPWA } from "./lib/pwa";

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service worker registered successfully:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, show update notification
                if (confirm('Nieuwe versie beschikbaar. Nu updaten?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.warn('[PWA] Service worker registration failed:', registrationError);
      });
  });
} else if (!('serviceWorker' in navigator)) {
  console.warn('[PWA] Service worker not supported in this browser');
} else {
  console.log('[PWA] Service worker disabled in development mode');
}

// Initialize PWA features
initPWA();

createRoot(document.getElementById("root")!).render(<App />);
