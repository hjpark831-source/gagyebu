import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';
import './styles.css';
import './theme-calm.css';
import './theme-night.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // 지금 화면에 쓰인 파일과 그림, 아이콘을 모두 저장해 둔다
        const same = (u) => u.startsWith(location.origin);
        const used = performance.getEntriesByType('resource').map((e) => e.name).filter(same);
        const extra = ['./', 'manifest.webmanifest', 'scene.jpg', 'tile-ledger.png', 'tile-assets.png', 'tile-memo.png',
          'nav-ledger.png', 'nav-assets.png', 'nav-memo.png', 'icon-glasses-192.png', 'icon-glasses-512.png'];
        reg.active?.postMessage({ precache: [...new Set([...used, ...extra])] });
      })
      .catch(() => {});
  });
}
