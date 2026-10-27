import { useState } from 'react';
import { addMonths, currentYm, won } from '../format.js';
import { summarize, useStore } from '../store.jsx';
import MonthNav from './MonthNav.jsx';

export default function Stats() {
  const { transactions, catById } = useStore();
  const [ym, setYm] = useState(currentYm());

  const month = transactions.filter((t) => t.date.startsWith(ym));
  const prevYm = addMonths(ym, -1);
  const prev = transactions.filter((t) => t.date.startsWith(prevYm));
  const s = summarize(month, catById);
  const p = summarize(prev, catById);
  const diff = s.spend - p.spend;

  const byCat = {};
  for (const t of month) {
    if (t.type === 'income') continue;
    byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount;
  }
  const rows = Object.entries(byCat)
    .map(([id, amount]) => ({ cat: catById[id], amount }))
    .sort((a, b) => b.amount - a.amount);
  const spendRows = rows.filter((r) => !r.cat?.saving);
  const saveRows = rows.filter((r) => r.cat?.saving);
  const max = Math.max(1, ...spendRows.map((r) => r.amount));

  return (
    <section className="screen">
      <MonthNav ym={ym} onChange={setYm} />

      <div className="stat-lead">
        <p className="home-label">소비 합계</p>
        <p className="stat-amount">{won(s.spend)}</p>
        {prev.length > 0 && (
          <p className="home-sub">
            지난달보다 {won(Math.abs(diff))} {diff > 0 ? '더 썼어요' : diff < 0 ? '덜 썼어요' : '같아요'}
          </p>
        )}
      </div>

      <h3 className="list-title">어디에 썼나</h3>
      {spendRows.length ? (
        <ul className="bars">
          {spendRows.map(({ cat, amount }) => (
            <li key={cat?.id ?? 'none'}>
              <div className="bar-label">
                <span>
                  {cat?.name ?? '분류 없음'}
                  {cat?.group === 'fixed' && <i className="pb-tag">고정</i>}
                </span>
                <span className="bar-val">
                  {won(amount)} <small>{Math.round((amount / s.spend) * 100)}%</small>
                </span>
              </div>
              <div className="bar-track" aria-hidden="true">
                <span style={{ width: `${(amount / max) * 100}%` }} className={cat?.group === 'fixed' ? 'fixed' : ''} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="passbook-empty">이 달에는 소비 기록이 없어요.</p>
      )}

      {saveRows.length > 0 && (
        <>
          <h3 className="list-title">저축·투자로 모은 돈</h3>
          <ul className="plain-rows">
            {saveRows.map(({ cat, amount }) => (
              <li key={cat.id}>
                <span>{cat.name}</span>
                <span className="t-in">{won(amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
