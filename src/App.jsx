import { useCallback, useState } from 'react';
import Assets from './components/Assets.jsx';
import Home from './components/Home.jsx';
import Ledger from './components/Ledger.jsx';
import QuickEntry from './components/QuickEntry.jsx';
import Settings from './components/Settings.jsx';
import Stats from './components/Stats.jsx';
import { useStore } from './store.jsx';

const TABS = [
  { id: 'home', label: '홈', icon: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z' },
  { id: 'ledger', label: '가계부', icon: 'M6 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6' },
  { id: 'stats', label: '통계', icon: 'M5 20V11M12 20V5M19 20v-6' },
  { id: 'assets', label: '자산', icon: 'M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 8l2-4h14l2 4M16 14h2' },
  { id: 'settings', label: '설정', icon: 'M5 7h14M5 12h14M5 17h14M9 5v4M15 10v4M8 15v4' },
];

export default function App() {
  const { status } = useStore();
  const [tab, setTab] = useState('home');
  const [entry, setEntry] = useState(null); // null | { editing }

  const openNew = () => setEntry({ editing: null });
  const openEdit = useCallback((tx) => setEntry({ editing: tx }), []);
  const close = useCallback(() => setEntry(null), []);

  if (status === 'loading') return <div className="boot" aria-busy="true" />;
  if (status === 'error') {
    return (
      <div className="boot">
        <p>기록을 불러오지 못했어요. 브라우저의 시크릿 모드에서는 저장이 안 될 수 있어요. 일반 창에서 다시 열어 주세요.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <main>
        {tab === 'home' && <Home goTo={setTab} onEdit={openEdit} />}
        {tab === 'ledger' && <Ledger goTo={setTab} onEdit={openEdit} />}
        {tab === 'stats' && <Stats />}
        {tab === 'assets' && <Assets />}
        {tab === 'settings' && <Settings />}
      </main>

      {tab !== 'settings' && tab !== 'assets' && (
        <button type="button" className="fab" onClick={openNew} aria-label="새 기록">
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <nav className="tabbar" aria-label="화면 이동">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'on' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d={t.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {entry && <QuickEntry key={entry.editing?.id ?? 'new'} editing={entry.editing} onClose={close} />}
    </div>
  );
}
