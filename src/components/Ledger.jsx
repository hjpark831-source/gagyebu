import { useState } from 'react';
import { currentYm, dayLabel, daysIn, firstWeekday, pad, shortWon, todayStr, won } from '../format.js';
import { GROUPS, sortByRecent, summarize, useStore } from '../store.jsx';
import MonthNav from './MonthNav.jsx';
import Passbook from './Passbook.jsx';

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'income', label: '수입' },
  { id: 'fixed', label: '고정지출' },
  { id: 'variable', label: '변동지출' },
];

export default function Ledger({ onEdit, goTo }) {
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

  const changeMonth = (next) => {
    setYm(next);
    setDay(null);
  };

  return (
    <section className="screen">
      <MonthNav ym={ym} onChange={changeMonth} />

      <dl className="tally tally-tight">
        <div>
          <dt>수입</dt>
          <dd className="t-in">{won(s.income)}</dd>
        </div>
        <div>
          <dt>지출</dt>
          <dd className="t-out">{won(s.fixed + s.variable)}</dd>
        </div>
        <div>
          <dt>남은 돈</dt>
          <dd>{won(s.income - s.fixed - s.variable)}</dd>
        </div>
      </dl>

      <div className="seg" role="tablist" aria-label="분류">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={filter === f.id ? 'on' : ''}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'fixed' && <FixedStatus ym={ym} rules={rules} month={month} catById={catById} goTo={goTo} />}

      <div className="section-head">
        <h3>{day ? dayLabel(day) : filter === 'all' ? '이번 달 기록' : `${GROUPS[filter]} 기록`}</h3>
        <div className="view-toggle" role="group" aria-label="보기 방식">
          <button type="button" className={view === 'list' ? 'on' : ''} onClick={() => { setView('list'); setDay(null); }}>
            목록
          </button>
          <button type="button" className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}>
            달력
          </button>
        </div>
      </div>

      {view === 'calendar' && <Calendar ym={ym} list={filtered} day={day} onPick={setDay} />}

      <Passbook
        rows={shown}
        onSelect={onEdit}
        empty={day ? '이 날은 기록이 없어요.' : '이 달에는 해당하는 기록이 없어요.'}
      />
    </section>
  );
}

function FixedStatus({ ym, rules, month, catById, goTo }) {
  const today = todayStr();
  if (!rules.length) {
    return (
      <div className="callout">
        <p>통신비, 보험료처럼 매달 나가는 돈을 등록하면 결제일에 자동으로 기록돼요.</p>
        <button type="button" className="btn-ghost" onClick={() => goTo('settings')}>
          고정지출 등록하기
        </button>
      </div>
    );
  }
  return (
    <ul className="fixed-status">
      {rules.map((r) => {
        const date = `${ym}-${pad(Math.min(r.day, daysIn(ym)))}`;
        const done = month.some((t) => t.recurringKey === `${r.id}:${ym}`);
        const state = done ? '기록됨' : date > today ? `${r.day}일 예정` : r.auto ? '기록 안 됨' : '직접 기록';
        return (
          <li key={r.id}>
            <span className="fs-name">{r.name || catById[r.categoryId]?.name}</span>
            <span className="fs-amt">{won(r.amount)}</span>
            <span className={`fs-state ${done ? 'done' : ''}`}>{state}</span>
          </li>
        );
      })}
    </ul>
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
