import { useCallback, useEffect, useRef, useState } from 'react';
import Assets from './components/Assets.jsx';
import Icon from './components/Icons.jsx';
import Launcher from './components/Launcher.jsx';
import Ledger from './components/Ledger.jsx';
import Memo, { MemoSheet } from './components/Memo.jsx';
import QuickEntry from './components/QuickEntry.jsx';
import Settings from './components/Settings.jsx';
import { useStore } from './store.jsx';

const NAV = [
  { id: 'launcher', label: '처음', icon: 'home' },
  { id: 'ledger', label: '가계부', icon: 'ledger' },
  { id: 'assets', label: '자산', icon: 'assets' },
  { id: 'memo', label: '메모', icon: 'memo' },
  { id: 'settings', label: '설정', icon: 'gear' },
];

export default function App() {
  const { status } = useStore();
  const [screen, setScreenState] = useState('launcher');
  const [entry, setEntry] = useState(null); // 가계부 기록 창 { editing }
  const [memoOpen, setMemoOpen] = useState(null); // 메모 창 { memo }
  const screenRef = useRef(screen);
  screenRef.current = screen;

  // 폰의 뒤로 가기를 누르면 처음 화면으로 돌아온다
  const go = useCallback((next) => {
    if (next === screenRef.current) return;
    if (screenRef.current === 'launcher') history.pushState({ inApp: true }, '');
    if (next === 'launcher' && history.state?.inApp) {
      history.back();
      return;
    }
    setScreenState(next);
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const onPop = () => setScreenState('launcher');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const newEntry = useCallback(() => setEntry({ editing: null }), []);
  const openEdit = useCallback((tx) => setEntry({ editing: tx }), []);
  const closeEntry = useCallback(() => setEntry(null), []);
  const closeMemo = useCallback(() => setMemoOpen(null), []);

  if (status === 'loading') return <div className="boot" aria-busy="true" />;
  if (status === 'error') {
    return (
      <div className="boot">
        <p>기록을 불러오지 못했어요. 브라우저의 시크릿 모드에서는 저장이 안 될 수 있어요. 일반 창에서 다시 열어 주세요.</p>
      </div>
    );
  }

  return (
    <div className="app" data-screen={screen}>
      <main>
        {screen === 'launcher' && <Launcher open={go} />}
        {screen === 'ledger' && <Ledger goTo={go} onEdit={openEdit} onNew={newEntry} />}
        {screen === 'assets' && <Assets />}
        {screen === 'memo' && <Memo onOpen={(memo) => setMemoOpen({ memo })} onNew={() => setMemoOpen({ memo: null })} />}
        {screen === 'settings' && <Settings onBack={() => go('launcher')} />}
      </main>

      <nav className="navbar" aria-label="화면 이동">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            className={screen === n.id ? 'on' : ''}
            aria-current={screen === n.id ? 'page' : undefined}
            aria-label={n.label}
            onClick={() => go(n.id)}
          >
            <Icon name={n.icon} size={22} />
            {screen === n.id && <span>{n.label}</span>}
          </button>
        ))}
      </nav>

      {entry && <QuickEntry key={entry.editing?.id ?? 'new'} editing={entry.editing} onClose={closeEntry} />}
      {memoOpen && <MemoSheet key={memoOpen.memo?.id ?? 'new'} memo={memoOpen.memo} onClose={closeMemo} />}
    </div>
  );
}
