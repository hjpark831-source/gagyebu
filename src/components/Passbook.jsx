import { mdLabel, num } from '../format.js';
import { useStore } from '../store.jsx';

// 은행 통장처럼 한 줄에 날짜 · 내용 · 출금 · 입금을 찍어 보여주는 목록
export default function Passbook({ rows, onSelect, empty }) {
  const { catById } = useStore();

  if (!rows.length) {
    return <p className="passbook-empty">{empty}</p>;
  }

  return (
    <div className="passbook" role="table" aria-label="기록 목록">
      <div className="pb-row pb-head" role="row">
        <span role="columnheader">날짜</span>
        <span role="columnheader">내용</span>
        <span role="columnheader" className="pb-num">출금</span>
        <span role="columnheader" className="pb-num">입금</span>
      </div>
      {rows.map((t) => {
        const cat = catById[t.categoryId];
        const isIncome = t.type === 'income';
        return (
          <button key={t.id} type="button" className="pb-row" role="row" onClick={() => onSelect?.(t)}>
            <span className="pb-date" role="cell">{mdLabel(t.date)}</span>
            <span className="pb-what" role="cell">
              <span className="pb-cat">
                {cat?.name ?? '분류 없음'}
                {cat?.group === 'fixed' && <i className="pb-tag">고정</i>}
              </span>
              {t.memo && t.memo !== cat?.name && <span className="pb-memo">{t.memo}</span>}
            </span>
            <span className="pb-num pb-out" role="cell">{isIncome ? '' : num(t.amount)}</span>
            <span className="pb-num pb-in" role="cell">{isIncome ? num(t.amount) : ''}</span>
          </button>
        );
      })}
    </div>
  );
}
