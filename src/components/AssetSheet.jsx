import { useEffect, useState } from 'react';
import { ASSET_GROUPS, KINDS, profitOf, valueOf } from '../assets.js';
import { won } from '../format.js';
import { useStore } from '../store.jsx';

const LABELS = {
  name: '이름',
  monthly: '월 납입액',
  start: '시작일',
  maturity: '만기일',
  rate: '금리 (%)',
  qty: '수량',
  avg: '평균 매수가',
  price: '현재가',
};

// 자산 추가·수정 창. 새로 만들 때는 종류부터 고른다.
export default function AssetSheet({ asset, onClose }) {
  const { saveAsset, removeAsset } = useStore();
  const [kind, setKind] = useState(asset?.kind ?? null);
  const [form, setForm] = useState(() => ({ ...(asset ?? {}) }));
  const k = kind ? KINDS[kind] : null;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key, v) => setForm((f) => ({ ...f, [key]: v }));
  const numOnly = (v, decimals) => (decimals ? v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') : v.replace(/\D/g, ''));

  const save = async (e) => {
    e.preventDefault();
    const rec = { ...form, kind };
    if (k.includeToggle && rec.includeInTotal == null) rec.includeInTotal = !k.defaultExcluded;
    await saveAsset(rec);
    onClose();
  };

  const preview = k ? valueOf({ ...form, kind }) : 0;
  const profit = k ? profitOf({ ...form, kind }) : null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet asset-sheet" role="dialog" aria-modal="true" aria-label={asset ? '자산 고치기' : '자산 추가'} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-top">
          <h2 className="sheet-title">{asset ? `${k.label} 고치기` : k ? `${k.label} 추가` : '어떤 자산인가요?'}</h2>
          <button type="button" className="text-btn" onClick={onClose}>
            닫기
          </button>
        </div>

        {!k ? (
          <div className="kind-picker">
            {ASSET_GROUPS.map((g) => {
              const kinds = Object.entries(KINDS).filter(([, v]) => v.group === g.id);
              if (!kinds.length) return null;
              return (
                <div key={g.id} className="chip-group">
                  <p className="chip-group-name">{g.label}</p>
                  <div className="chips">
                    {kinds.map(([id, v]) => (
                      <button key={id} type="button" className="chip" onClick={() => setKind(id)}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <form className="asset-form" onSubmit={save}>
            {k.fields.map((f) => {
              if (f === 'inst')
                return (
                  <label key={f}>
                    {k.inst}
                    <input value={form.inst ?? ''} maxLength={20} onChange={(e) => set('inst', e.target.value)} placeholder={k.inst === '은행' ? '예: 하나은행' : ''} />
                  </label>
                );
              if (f === 'name')
                return (
                  <label key={f}>
                    {kind === 'stock' || kind === 'coin' ? '종목' : LABELS.name}
                    <input
                      value={form.name ?? ''}
                      maxLength={30}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder={kind === 'stock' ? '예: 삼성전자' : kind === 'coin' ? '예: 비트코인' : '선택'}
                    />
                  </label>
                );
              if (f === 'start' || f === 'maturity')
                return (
                  <label key={f}>
                    {LABELS[f]}
                    <input type="date" value={form[f] ?? ''} onChange={(e) => set(f, e.target.value)} />
                  </label>
                );
              const label = f === 'amount' ? k.amountLabel : f === 'qty' ? `${LABELS.qty} (${k.unit})` : LABELS[f];
              const dec = f === 'rate' || (f === 'qty' && k.decimals);
              return (
                <label key={f}>
                  {label}
                  <input
                    inputMode={dec ? 'decimal' : 'numeric'}
                    value={form[f] ?? ''}
                    onChange={(e) => set(f, numOnly(e.target.value, dec))}
                    required={f === 'amount' ? !k.amountOptional : f === 'qty' || f === 'price'}
                  />
                </label>
              );
            })}

            {k.includeToggle && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.includeInTotal ?? !k.defaultExcluded}
                  onChange={(e) => set('includeInTotal', e.target.checked)}
                />
                총자산·순자산에 포함
              </label>
            )}

            <p className="asset-preview">
              {k.group === 'debt' ? '부채' : '평가금액'} {won(preview)}
              {profit && (
                <span className={profit.amount >= 0 ? 'up' : 'down'}>
                  {' '}
                  ({profit.amount >= 0 ? '+' : '−'}
                  {won(Math.abs(profit.amount))}, {(profit.rate * 100).toFixed(1)}%)
                </span>
              )}
            </p>

            <div className="form-actions">
              {asset && (
                <button
                  type="button"
                  className="btn-danger-text"
                  onClick={async () => {
                    await removeAsset(asset.id);
                    onClose();
                  }}
                >
                  삭제
                </button>
              )}
              {!asset && (
                <button type="button" className="btn-ghost" onClick={() => setKind(null)}>
                  종류 다시 고르기
                </button>
              )}
              <button type="submit" className="btn">
                저장
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
