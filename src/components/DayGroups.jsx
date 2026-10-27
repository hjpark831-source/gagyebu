import { num } from '../format.js';
import { useStore } from '../store.jsx';

const WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 일간 보기: 날짜별 카드. 머리줄에 날짜·요일·그날 수입/지출 합계, 아래에 기록 한 줄씩.
export default function DayGroups({ rows, onSelect, empty }) {
  const { catById } = useStore();
  if (!rows.length) return <p className="passbook-empty">{empty}</p>;

  const groups = [];
  for (const t of rows) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  }

  return (
    <div className="day-groups">
      {groups.map(({ date, items }) => {
        const [y, m, d] = date.split('-').map(Number);
        const wd = new Date(y, m - 1, d).getDay();
        const inSum = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const outSum = items.filter((t) => t.type !== 'income').reduce((s, t) => s + t.amount, 0);
        return (
          <section key={date} className="day-card" aria-label={`${m}월 ${d}일`}>
            <header className="day-head">
              <strong className="dh-day">{d}</strong>
              <span className={`dh-week ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}`}>{WEEK[wd]}</span>
              <span className="dh-ym">
                {y}.{String(m).padStart(2, '0')}
              </span>
              <span className="dh-in">{inSum ? `${num(inSum)}원` : ''}</span>
              <span className="dh-out">{outSum ? `${num(outSum)}원` : ''}</span>
            </header>
            {items.map((t) => {
              const cat = catById[t.categoryId];
              const income = t.type === 'income';
              return (
                <button key={t.id} type="button" className="day-row" onClick={() => onSelect?.(t)}>
                  <span className="dr-cat">
                    {cat?.name ?? '분류 없음'}
                    {cat?.group === 'fixed' && <i className="pb-tag">고정</i>}
                  </span>
                  <span className="dr-what">
                    <span className="dr-title">{t.memo || cat?.name || '기록'}</span>
                    {t.recurringKey && <span className="dr-sub">매달 자동 기록</span>}
                  </span>
                  <span className={`dr-amt ${income ? 'in' : 'out'}`}>{num(t.amount)}원</span>
                </button>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
