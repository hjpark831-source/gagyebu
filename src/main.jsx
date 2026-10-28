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

// 오프라인용: 지금 화면에 쓰인 파일과 그림, 아이콘을 서비스 워커에 저장해 달라고 보낸다
function precacheList() {
  const same = (u) => u.startsWith(location.origin);
  const used = performance.getEntriesByType('resource').map((e) => e.name).filter(same);
  const extra = ['./', 'manifest.webmanifest', 'scene.jpg', 'tile-ledger.png', 'tile-assets.png', 'tile-memo.png',
    'nav-ledger.png', 'nav-assets.png', 'nav-memo.png', 'icon-glasses-192.png', 'icon-glasses-512.png',
    'icon-glasses-maskable-512.png', 'favicon-glasses.png'];
  const scripts = [...document.querySelectorAll('script[src], link[rel=stylesheet][href]')].map((el) => el.src || el.href).filter(same);
  return [...new Set([...used, ...scripts, ...extra])];
}

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  const send = (sw) => sw?.postMessage({ precache: precacheList() });
  // 새 버전 서비스 워커가 자리를 잡으면 다시 보낸다
  navigator.serviceWorker.addEventListener('controllerchange', () => send(navigator.serviceWorker.controller));
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data === 'need-precache') send(navigator.serviceWorker.controller);
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => send(reg.active))
      .catch(() => {});
  });
}
