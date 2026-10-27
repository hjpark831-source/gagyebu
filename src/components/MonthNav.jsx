import { addMonths, currentYm, ymLabel } from '../format.js';

export default function MonthNav({ ym, onChange }) {
  const isCurrent = ym === currentYm();
  return (
    <div className="month-nav">
      <button type="button" className="icon-btn" aria-label="이전 달" onClick={() => onChange(addMonths(ym, -1))}>
        <Chevron dir="left" />
      </button>
      <h2>{ymLabel(ym)}</h2>
      <button
        type="button"
        className="icon-btn"
        aria-label="다음 달"
        disabled={isCurrent}
        onClick={() => onChange(addMonths(ym, 1))}
      >
        <Chevron dir="right" />
      </button>
    </div>
  );
}

function Chevron({ dir }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
