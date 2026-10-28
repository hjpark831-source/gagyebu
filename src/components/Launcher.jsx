import { todayStr } from '../format.js';
import { useStore } from '../store.jsx';
import { totals } from '../assets.js';
import { shortWon } from '../format.js';

const WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 앱을 열면 처음 보이는 화면: 날짜, 제목, 탭 3개, 아래쪽 그림
export default function Launcher({ open }) {
  const { transactions, memos, assets } = useStore();
  const net = assets.length ? totals(assets, transactions).net : null;
  const now = new Date();
  const todayCount = transactions.filter((t) => t.date === todayStr()).length;

  const tiles = [
    { id: 'ledger', label: '가계부', sub: todayCount ? `오늘 ${todayCount}건` : '오늘 기록 없음' },
    { id: 'assets', label: '자산', sub: net === null ? '자산 적어 두기' : `순자산 ${net < 0 ? '−' : ''}${shortWon(Math.abs(net))}원` },
    { id: 'memo', label: '메모', sub: memos.length ? `${memos.length}개` : '비어 있음' },
  ];

  return (
    <section className="launcher">
      <p className="greet-date">
        {now.getMonth() + 1}월 {now.getDate()}일 {WEEK[now.getDay()]}
      </p>
      <h1 className="greet">희재의 가계부</h1>
      <span className="greet-rule" aria-hidden="true" />

      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.id} type="button" className="tile" data-tab={t.id} onClick={() => open(t.id)}>
            <span className="tile-face">
              <img src={`tile-${t.id}.png`} alt="" />
            </span>
            <span className="tile-label">{t.label}</span>
            <span className="tile-sub">{t.sub}</span>
          </button>
        ))}
      </div>

      <div className="scene" aria-hidden="true">
        <img src="scene.jpg" alt="" decoding="async" />
      </div>
    </section>
  );
}
