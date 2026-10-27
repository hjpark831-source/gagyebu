import { useState } from 'react';
import { addMonths, currentYm, dayLabel, daysIn, firstWeekday, pad, shortWon, todayStr, won } from '../format.js';
import { GROUPS, sortByRecent, summarize, useStore } from '../store.jsx';
import Icon from './Icons.jsx';
import Passbook from './Passbook.jsx';
import Stats from './Stats.jsx';

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'income', label: '수입' },
  { id: 'fixed', label: '고정지출' },
  { id: 'variable', label: '변동지출' },
];

const VIEWS = [
  ['list', '목록'],
  ['calendar', '달력'],
  ['stats', '통계'],
];

export default function Ledger({ onEdit, onNew, goTo }) {
  const { transactions, catById, rules } = useStore();
  const [ym, setYm] = useState(currentYm());
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const [day, setDay] = useState(null);

  const month = transactions.filter((t) => t.date.startsWith(ym));
  const groupOf = (t) => (t.type === 'income' ? 'income' : catById[t.categoryId]?.group === 'fixed' ? 'fixed' : 'variable');
  const filtered = filter === 'all' ? month : month.filter((t) => groupOf(t) === filter);
  const shown = sortByRecent(day ? filtered.filter((t) => t.date === day) : filtered);
  const s = summarize(month, catById);
  const [y, m] = ym.split('-').map(Number);
  const isCurrent = ym === currentYm();

  const changeMonth = (k) => {
    setYm(addMonths(ym, k));
    setDay(null);
  };

  return (
    <section className="screen">
      <header className="top-row">
        <button type="button" className="circle-btn" aria-label="새 기록" onClick={onNew}>
          <Icon name="plus" size={22} />
        </button>
        <div className="view-pill" role="tablist" aria-label="보기 방식">
          {VIEWS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={view === id ? 'on' : ''}
              onClick={() => {
                setView(id);
                setDay(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="title-row">
        <h1 className="page-title">
          <small>{y}년</small>
          {m}월 가계부
        </h1>
        <div className="month-arrows">
          <button type="button" className="circle-btn small ghost" aria-label="이전 달" onClick={() => changeMonth(-1)}>
            <Icon name="left" size={18} />
          </button>
          <button type="button" className="circle-btn small ghost" aria-label="다음 달" disabled={isCurrent} onClick={() => changeMonth(1)}>
            <Icon name="right" size={18} />
          </button>
        </div>
      </div>

      <div className="sum-card">
        <div>
          <span>수입</span>
          <strong className="t-in">{won(s.income)}</strong>
        </div>
        <div>
          <span>지출</span>
          <strong>{won(s.fixed + s.variable)}</strong>
        </div>
        <div>
          <span>남은 돈</span>
          <strong>{won(s.income - s.fixed - s.variable)}</strong>
        </div>
      </div>

      {view === 'stats' ? (
        <Stats ym={ym} embedded />
      ) : (
        <>
          <FixedCards ym={ym} rules={rules} month={month} catById={catById} goTo={goTo} />

          <div className="chips-row" role="tablist" aria-label="분류">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={`chip-tab ${filter === f.id ? 'on' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {view === 'calendar' && <Calendar ym={ym} list={filtered} day={day} onPick={setDay} />}

          <h2 className="list-title">{day ? dayLabel(day) : filter === 'all' ? '이번 달 기록' : `${GROUPS[filter]} 기록`}</h2>
          <Passbook rows={shown} onSelect={onEdit} empty={day ? '이 날은 기록이 없어요.' : '이 달에는 해당하는 기록이 없어요.'} />
        </>
      )}
    </section>
  );
}

// 고정지출: 두 번째 참고 사진의 일정 카드처럼 가로로 넘겨 보는 카드
function FixedCards({ ym, rules, month, catById, goTo }) {
  const today = todayStr();
  if (!rules.length) {
    return (
      <button type="button" className="fixed-empty" onClick={() => goTo('settings')}>
        <span>
          <strong>고정지출 등록하기</strong>
          통신비, 보험료처럼 매달 나가는 돈을 결제일에 자동으로 적어 드려요.
        </span>
        <Icon name="arrow" size={22} />
      </button>
    );
  }
  const items = rules
    .map((r) => {
      const date = `${ym}-${pad(Math.min(r.day, daysIn(ym)))}`;
      const done = month.some((t) => t.recurringKey === `${r.id}:${ym}`);
      return { r, date, done };
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const nextId = items.find((i) => !i.done && i.date >= today)?.r.id;

  return (
    <>
      <h2 className="list-title">고정지출</h2>
      <div className="fixed-cards">
        {items.map(({ r, done }) => (
          <div key={r.id} className={`fx-card ${r.id === nextId ? 'next' : ''}`}>
            <span className="fx-day">매달 {r.day}일</span>
            <strong className="fx-name">{r.name || catById[r.categoryId]?.name}</strong>
            <span className="fx-amt">{shortWon(r.amount)}원</span>
            <span className="fx-state">{done ? '기록됨' : r.id === nextId ? '다가옴' : '예정'}</span>
            <span className={`fx-mark ${done ? 'done' : ''}`} aria-hidden="true">
              {done ? <Icon name="check" size={16} stroke={2.4} /> : null}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Calendar({ ym, list, day, onPick }) {
  const total = {};
  for (const t of list) {
    if (t.type === 'income') continue;
    total[t.date] = (total[t.date] || 0) + t.amount;
  }
  const blanks = firstWeekday(ym);
  const n = daysIn(ym);
  const today = todayStr();
  const cells = [];
  for (let i = 0; i < blanks; i++) cells.push(<span key={`b${i}`} className="cal-cell blank" />);
  for (let d = 1; d <= n; d++) {
    const date = `${ym}-${pad(d)}`;
    const sum = total[date];
    cells.push(
      <button
        key={date}
        type="button"
        className={`cal-cell ${day === date ? 'picked' : ''} ${date === today ? 'today' : ''}`}
        onClick={() => onPick(day === date ? null : date)}
        aria-label={`${d}일${sum ? ` 지출 ${won(sum)}` : ''}`}
      >
        <span className="cal-d">{d}</span>
        {sum ? <span className="cal-sum">{shortWon(sum)}</span> : null}
      </button>,
    );
  }
  return (
    <div className="calendar">
      {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
        <span key={w} className="cal-w">
          {w}
        </span>
      ))}
      {cells}
    </div>
  );
}
