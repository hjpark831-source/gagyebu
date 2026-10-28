import { useEffect, useMemo, useState } from 'react';
import { ASSET_GROUPS, KINDS, daysUntil, included, profitOf, totals, valueOf } from '../assets.js';
import { addMonths, currentYm, shortWon, won } from '../format.js';
import { useStore } from '../store.jsx';
import AssetSheet from './AssetSheet.jsx';
import Icon from './Icons.jsx';

const STALE_DAYS = 30;

export default function Assets() {
  const { assets, transactions, snapshots, saveSnapshot } = useStore();
  const [sheet, setSheet] = useState(null); // { asset } 또는 { asset: null }
  const t = useMemo(() => totals(assets, transactions), [assets, transactions]);
  const ym = currentYm();

  // 이번 달 순자산을 기록해 두고 지난달과 비교한다
  const thisSnap = snapshots.find((s) => s.id === `snap-${ym}`);
  const lastSnap = snapshots.find((s) => s.id === `snap-${addMonths(ym, -1)}`);
  useEffect(() => {
    if (!assets.length && !t.card) return;
    if (thisSnap && thisSnap.net === t.net && thisSnap.total === t.total && thisSnap.debt === t.debt) return;
    saveSnapshot({ id: `snap-${ym}`, ym, total: t.total, debt: t.debt, net: t.net });
  }, [assets.length, t.net, t.total, t.debt, t.card, thisSnap, ym, saveSnapshot]);
  const diff = lastSnap ? t.net - lastSnap.net : null;

  const maturities = assets
    .filter((a) => a.maturity && KINDS[a.kind])
    .map((a) => ({ a, d: daysUntil(a.maturity) }))
    .filter(({ d }) => d >= 0 && d <= 120)
    .sort((x, y) => x.d - y.d);

  const positive = ASSET_GROUPS.filter((g) => g.id !== 'debt' && t.byGroup[g.id] > 0);
  const empty = !assets.length && !t.card;

  return (
    <section className="screen">
      <header className="top-row">
        <button type="button" className="circle-btn" aria-label="자산 추가" onClick={() => setSheet({ asset: null })}>
          <Icon name="plus" size={22} />
        </button>
      </header>
      <div className="title-row">
        <h1 className="page-title">
          <small>모은 돈과 갚을 돈</small>
          자산
        </h1>
      </div>

      <div className="net-card">
        <p className="net-label">순자산</p>
        <p className={`net-amount ${t.net < 0 ? 't-out' : ''}`}>{won(t.net)}</p>
        {diff !== null && (
          <p className={`net-diff ${diff >= 0 ? 'up' : 'down'}`}>
            지난달보다 {diff >= 0 ? '+' : '−'}
            {won(Math.abs(diff))}
          </p>
        )}
        <div className="net-split">
          <div>
            <span>총자산</span>
            <strong>{won(t.total)}</strong>
          </div>
          <div>
            <span>부채</span>
            <strong className="t-out">{won(t.debt)}</strong>
          </div>
        </div>
        {t.total > 0 && (
          <>
            <div className="mix-bar" role="img" aria-label="자산 비중">
              {positive.map((g) => (
                <span key={g.id} style={{ flex: t.byGroup[g.id], background: g.color }} />
              ))}
            </div>
            <ul className="mix-legend">
              {positive.map((g) => (
                <li key={g.id}>
                  <i style={{ background: g.color }} />
                  {g.label} {Math.round((t.byGroup[g.id] / t.total) * 100)}%
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {maturities.length > 0 && (
        <>
          <h2 className="list-title">다가오는 만기</h2>
          <div className="maturity-row">
            {maturities.map(({ a, d }) => (
              <button key={a.id} type="button" className="maturity-chip" onClick={() => setSheet({ asset: a })}>
                <strong>{d === 0 ? 'D-DAY' : `D-${d}`}</strong>
                <span>{a.name || KINDS[a.kind].label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {empty ? (
        <div className="memo-empty">
          <p>자유입출금, 적금, 예금, 주식, 코인, 연금, 보험, 대출을 적어 두면 순자산을 한눈에 볼 수 있어요. 왼쪽 위 + 버튼으로 시작해요.</p>
        </div>
      ) : (
        ASSET_GROUPS.map((g) => {
          const items = assets.filter((a) => KINDS[a.kind]?.group === g.id);
          const card = g.id === 'debt' && t.card > 0;
          if (!items.length && !card) return null;
          return (
            <section key={g.id} className="asset-group">
              <h2 className="list-title">
                <i className="group-dot" style={{ background: g.color }} />
                {g.label}
                <span className="group-sum">{won(t.byGroup[g.id])}</span>
              </h2>
              <div className="asset-list">
                {items.map((a) => (
                  <AssetRow key={a.id} a={a} onOpen={() => setSheet({ asset: a })} />
                ))}
                {card && (
                  <div className="asset-row auto">
                    <span className="ar-main">
                      <span className="ar-name">카드 할부 남은 금액</span>
                      <span className="ar-sub">가계부의 할부 기록에서 자동 계산</span>
                    </span>
                    <span className="ar-val t-out">{won(t.card)}</span>
                  </div>
                )}
              </div>
            </section>
          );
        })
      )}

      {sheet && <AssetSheet key={sheet.asset?.id ?? 'new'} asset={sheet.asset} onClose={() => setSheet(null)} />}
    </section>
  );
}

function AssetRow({ a, onOpen }) {
  const k = KINDS[a.kind];
  const v = valueOf(a);
  const p = profitOf(a);
  const days = Math.floor((Date.now() - (a.updatedAt || 0)) / 86400000);
  const stale = days >= STALE_DAYS;
  const sub = [];
  if (a.inst) sub.push(a.inst);
  if (a.kind === 'stock' || a.kind === 'coin') sub.push(`${Number(a.qty || 0).toLocaleString('ko-KR')}${k.unit}`);
  if (a.kind === 'installmentSaving' && a.monthly) sub.push(`매달 ${shortWon(Number(a.monthly))}원`);
  if (a.maturity) sub.push(`만기 ${a.maturity.slice(2).replace(/-/g, '.')}`);
  if (!included(a)) sub.push('합계 제외');
  if (stale) sub.push(`${days}일 전 수정`);

  return (
    <button type="button" className={`asset-row ${stale ? 'stale' : ''}`} onClick={onOpen}>
      <span className="ar-main">
        <span className="ar-name">
          {a.name || k.label}
          <i className="pb-tag">{k.label}</i>
        </span>
        {sub.length > 0 && <span className="ar-sub">{sub.join(' · ')}</span>}
      </span>
      <span className="ar-right">
        <span className={`ar-val ${k.group === 'debt' ? 't-out' : ''}`}>{won(v)}</span>
        {p && (
          <span className={`ar-profit ${p.amount >= 0 ? 'up' : 'down'}`}>
            {p.amount >= 0 ? '+' : ''}
            {(p.rate * 100).toFixed(1)}%
          </span>
        )}
      </span>
    </button>
  );
}
