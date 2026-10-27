import { currentYm, daysIn, shortWon, todayStr, won } from '../format.js';
import { summarize, useStore } from '../store.jsx';
import Icon from './Icons.jsx';
import Landscape from './Landscape.jsx';

const WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 앱을 열면 처음 보이는 화면: 인사, 이번 달 예산 카드, 탭 3개, 풍경
export default function Launcher({ open, onRecord }) {
  const { transactions, catById, settings, memos } = useStore();
  const ym = currentYm();
  const now = new Date();
  const month = transactions.filter((t) => t.date.startsWith(ym));
  const s = summarize(month, catById);
  const budget = settings.monthlyBudget || 0;
  const left = budget - s.spend;
  const usedPct = budget ? Math.min(100, Math.round((s.spend / budget) * 100)) : 0;
  const todayCount = transactions.filter((t) => t.date === todayStr()).length;
  const perDay = left > 0 ? left / (daysIn(ym) - now.getDate() + 1) : 0;

  const tiles = [
    { id: 'ledger', label: '가계부', sub: todayCount ? `오늘 ${todayCount}건` : '오늘 기록 없음' },
    { id: 'assets', label: '자산', sub: '준비 중' },
    { id: 'memo', label: '메모', sub: memos.length ? `${memos.length}개` : '비어 있음' },
  ];

  return (
    <section className="launcher">
      <p className="greet-date">
        {now.getMonth() + 1}월 {now.getDate()}일 {WEEK[now.getDay()]}
      </p>
      <h1 className="greet">
        오늘도 차곡차곡.
      </h1>
      <p className="greet-sub">
        {budget
          ? left >= 0
            ? `이번 달 예산이 ${shortWon(left)}원 남았어요.`
            : `이번 달 예산을 ${shortWon(-left)}원 넘겼어요.`
          : '월 예산을 정하면 남은 금액을 알려드려요.'}
      </p>
      <span className="greet-rule" aria-hidden="true" />

      <div className="budget-card">
        <div className="bc-top">
          <span className="pill">{now.getMonth() + 1}월 예산</span>
          <button type="button" className="circle-btn ghost" aria-label="가계부 열기" onClick={() => open('ledger')}>
            <Icon name="arrow" size={22} />
          </button>
        </div>
        {budget ? (
          <>
            <p className="bc-amount">
              {won(Math.abs(left))}
              <small>{left >= 0 ? ' 남음' : ' 초과'}</small>
            </p>
            <p className="bc-sub">
              {won(budget)} 중 {won(s.spend)} 사용{perDay > 0 && `, 하루 ${won(perDay)}`}
            </p>
            <div className={`hatch-bar ${left < 0 ? 'over' : ''}`} role="img" aria-label={`예산 ${usedPct}% 사용`}>
              <span className="hb-used" style={{ width: `${Math.max(usedPct, 6)}%` }}>
                사용
              </span>
              <span className="hb-left" />
            </div>
            <div className="hb-legend">
              <span>{usedPct}%</span>
              <span>{100 - usedPct}%</span>
            </div>
          </>
        ) : (
          <>
            <p className="bc-amount">{won(s.spend)}</p>
            <p className="bc-sub">이번 달 소비</p>
          </>
        )}
        <button type="button" className="slide-pill" onClick={onRecord}>
          <span className="sp-knob">
            <Icon name="plus" size={18} stroke={2.2} />
          </span>
          지금 쓴 돈 기록하기
          <span className="sp-chev" aria-hidden="true">
            ›››
          </span>
        </button>
      </div>

      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.id} type="button" className="tile" data-tab={t.id} onClick={() => open(t.id)}>
            <span className="tile-face">
              <Icon name={t.id} size={40} stroke={1.5} />
            </span>
            <span className="tile-label">{t.label}</span>
            <span className="tile-sub">{t.sub}</span>
          </button>
        ))}
      </div>

      <Landscape />
    </section>
  );
}
