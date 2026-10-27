import { currentYm, daysIn, monthOnly, todayStr, won } from '../format.js';
import { sortByRecent, summarize, useStore } from '../store.jsx';
import Passbook from './Passbook.jsx';

export default function Home({ goTo, onEdit }) {
  const { transactions, catById, settings } = useStore();
  const ym = currentYm();
  const month = transactions.filter((t) => t.date.startsWith(ym));
  const s = summarize(month, catById);
  const budget = settings.monthlyBudget || 0;
  const left = budget - s.spend;
  const used = budget ? Math.min(s.spend / budget, 1) : 0;
  const daysLeft = daysIn(ym) - Number(todayStr().slice(8)) + 1;
  const perDay = left > 0 ? left / daysLeft : 0;
  const recent = sortByRecent(month).slice(0, 6);

  return (
    <section className="screen home">
      <header className="home-head">
        <p className="home-month">{monthOnly(ym)}</p>
        {budget ? (
          <>
            <p className="home-label">{left >= 0 ? '이번 달 남은 예산' : '이번 달 예산 초과'}</p>
            <p className={`home-amount ${left < 0 ? 'is-over' : ''}`}>{won(Math.abs(left))}</p>
            <div className="meter" aria-hidden="true">
              <span style={{ width: `${used * 100}%` }} className={left < 0 ? 'is-over' : ''} />
            </div>
            <p className="home-sub">
              예산 {won(budget)} 중 {won(s.spend)} 사용
              {left > 0 && <> · 하루 {won(perDay)}씩 쓸 수 있어요</>}
            </p>
          </>
        ) : (
          <div className="home-nobudget">
            <p className="home-label">이번 달 지출</p>
            <p className="home-amount">{won(s.spend)}</p>
            <button type="button" className="text-btn" onClick={() => goTo('settings')}>
              월 예산을 정하면 남은 금액을 보여드려요
            </button>
          </div>
        )}
      </header>

      <dl className="tally">
        <div>
          <dt>수입</dt>
          <dd className="t-in">{won(s.income)}</dd>
        </div>
        <div>
          <dt>고정지출</dt>
          <dd>{won(s.fixed)}</dd>
        </div>
        <div>
          <dt>변동지출</dt>
          <dd>{won(s.variable)}</dd>
        </div>
      </dl>
      {s.saving > 0 && <p className="note">지출 중 {won(s.saving)}은 적금·주식으로 모은 돈이라 예산에서 뺐어요.</p>}

      <div className="section-head">
        <h3>최근 기록</h3>
        {month.length > 6 && (
          <button type="button" className="text-btn" onClick={() => goTo('ledger')}>
            전체 보기
          </button>
        )}
      </div>
      <Passbook rows={recent} onSelect={onEdit} empty="아직 이번 달 기록이 없어요. 아래 + 버튼으로 첫 지출을 적어 보세요." />
    </section>
  );
}
