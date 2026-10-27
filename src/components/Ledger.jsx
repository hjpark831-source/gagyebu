import { useState } from 'react';
import { addMonths, currentYm, dayLabel, daysIn, firstWeekday, num, pad, shortWon, todayStr, won } from '../format.js';
import { GROUPS, sortByRecent, summarize, useStore } from '../store.jsx';
import DayGroups from './DayGroups.jsx';
import Icon from './Icons.jsx';
import Stats from './Stats.jsx';

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'income', label: '수입' },
  { id: 'fixed', label: '고정지출' },
  { id: 'variable', label: '변동지출' },
];

const VIEWS = [
  ['daily', '일간'],
  ['monthly', '월간'],
  ['stats', '통계'],
];

export default function Ledger({ onEdit, onNew, goTo }) {
  const { transactions, catById, rules } = useStore();
  const [ym, setYm] = useState(currentYm());
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('daily');
  const [day, setDay] = useState(null);

  const month = transactions.filter((t) => t.date.startsWith(ym));
  const groupOf = (t) => (t.type === 'income' ? 'income' : catById[t.categoryId]?.group === 'fixed' ? 'fixed' : 'variable');
  const filtered = filter === 'all' ? month : month.filter((t) => groupOf(t) === filter);
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
          <strong className="t-out">{won(s.fixed + s.variable)}</strong>
        </div>
        <div>
          <span>합계</span>
          <strong>{won(s.income - s.fixed - s.variable)}</strong>
        </div>
      </div>

      {view === 'stats' && <Stats ym={ym} embedded />}

      {view === 'daily' && (
        <>
          <FixedCards ym={ym} rules={rules} month={month} catById={catById} goTo={goTo} />
          <FilterChips filter={filter} setFilter={setFilter} />
          <h2 className="list-title">{filter === 'all' ? '날짜별 기록' : `${GROUPS[filter]} 기록`}</h2>
          <DayGroups rows={sortByRecent(filtered)} onSelect={onEdit} empty="이 달에는 해당하는 기록이 없어요." />
        </>
      )}

      {view === 'monthly' && (
        <>
          <MonthCalendar ym={ym} all={transactions} day={day} onPick={setDay} />
          {day ? (
            <>
              <h2 className="list-title">{dayLabel(day)}</h2>
              <DayGroups rows={sortByRecent(transactions.filter((t) => t.date === day))} onSelect={onEdit} empty="이 날은 기록이 없어요." />
            </>
          ) : (
            <p className="hint">날짜를 누르면 그날 기록을 볼 수 있어요.</p>
          )}
        </>
      )}
    </section>
  );
}

function FilterChips({ filter, setFilter }) {
  return (
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
  );
}

// 고정지출: 가로로 넘겨 보는 일정 카드
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

// 월간 보기: 앞뒤 달 날짜까지 채운 6주 달력, 칸마다 수입 / 지출 / 합계
function MonthCalendar({ ym, all, day, onPick }) {
  const sums = {};
  for (const t of all) {
    const v = (sums[t.date] ||= { in: 0, out: 0 });
    if (t.type === 'income') v.in += t.amount;
    else v.out += t.amount;
  }
  const today = todayStr();
  const lead = firstWeekday(ym);
  const prevYm = addMonths(ym, -1);
  const nextYm = addMonths(ym, 1);
  const prevDays = daysIn(prevYm);
  const n = daysIn(ym);
  const total = Math.ceil((lead + n) / 7) * 7;

  const cells = [];
  for (let i = 0; i < total; i++) {
    let date;
    let label;
    let outside = false;
    if (i < lead) {
      const d = prevDays - lead + i + 1;
      date = `${prevYm}-${pad(d)}`;
      label = d;
      outside = true;
    } else if (i >= lead + n) {
      const d = i - lead - n + 1;
      date = `${nextYm}-${pad(d)}`;
      label = d === 1 ? `${Number(nextYm.slice(5))}.1` : d;
      outside = true;
    } else {
      const d = i - lead + 1;
      date = `${ym}-${pad(d)}`;
      label = d === 1 ? `${Number(ym.slice(5))}.1` : d;
    }
    const v = sums[date];
    const wd = i % 7;
    cells.push(
      <button
        key={date}
        type="button"
        className={`mc-cell ${outside ? 'outside' : ''} ${day === date ? 'picked' : ''} ${date === today ? 'today' : ''}`}
        onClick={() => onPick(day === date ? null : date)}
        aria-label={`${date}${v?.in ? ` 수입 ${won(v.in)}` : ''}${v?.out ? ` 지출 ${won(v.out)}` : ''}`}
      >
        <span className={`mc-d ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}`}>{label}</span>
        <span className="mc-nums">
          {v?.in ? <span className="mc-in">{num(v.in)}</span> : null}
          {v?.out ? <span className="mc-out">{num(v.out)}</span> : null}
          {v?.in ? <span className="mc-net">{num(v.in - v.out)}</span> : null}
        </span>
      </button>,
    );
  }

  return (
    <div className="month-cal">
      {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
        <span key={w} className={`mc-w ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>
          {w}
        </span>
      ))}
      {cells}
    </div>
  );
}
