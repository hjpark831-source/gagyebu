import { useEffect, useState } from 'react';
import { num, todayStr } from '../format.js';
import { GROUPS, useStore } from '../store.jsx';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];

// 빠른 입력: 금액을 누르고 분류 칩을 누르면 바로 저장된다.
export default function QuickEntry({ editing, onClose }) {
  const { categories, saveTransaction, removeTransaction, addCategory, catById } = useStore();
  const editCat = editing ? catById[editing.categoryId] : null;
  const [type, setType] = useState(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [date, setDate] = useState(editing?.date ?? todayStr());
  const [memo, setMemo] = useState(editing && editing.memo !== editCat?.name ? editing.memo : '');
  const [hint, setHint] = useState('');
  const [adding, setAdding] = useState(null); // 새 분류를 만들 그룹

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const value = Number(amount || 0);

  const press = (k) => {
    setHint('');
    if (k === 'del') return setAmount((a) => a.slice(0, -1));
    setAmount((a) => {
      const next = (a + k).replace(/^0+/, '');
      return next.length > 11 ? a : next;
    });
  };

  const save = async (cat) => {
    if (!value) {
      setHint('금액을 먼저 입력해 주세요');
      return;
    }
    await saveTransaction({
      ...(editing ?? {}),
      type: cat.group === 'income' ? 'income' : 'expense',
      amount: value,
      categoryId: cat.id,
      date,
      memo: memo.trim(),
    });
    onClose();
  };

  const remove = async () => {
    await removeTransaction(editing.id);
    onClose();
  };

  const groups = type === 'income' ? ['income'] : ['fixed', 'variable'];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? '기록 고치기' : '새 기록'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-top">
          <div className="seg seg-small" role="tablist" aria-label="수입 지출 선택">
            <button type="button" role="tab" aria-selected={type === 'expense'} className={type === 'expense' ? 'on' : ''} onClick={() => setType('expense')}>
              지출
            </button>
            <button type="button" role="tab" aria-selected={type === 'income'} className={type === 'income' ? 'on' : ''} onClick={() => setType('income')}>
              수입
            </button>
          </div>
          <button type="button" className="text-btn" onClick={onClose}>
            닫기
          </button>
        </div>

        <p className={`entry-amount ${type === 'income' ? 't-in' : ''} ${value ? '' : 'is-empty'}`} aria-live="polite">
          {value ? num(value) : '0'}
          <span>원</span>
        </p>

        <div className="entry-meta">
          <input type="date" value={date} max="2100-12-31" onChange={(e) => setDate(e.target.value)} aria-label="날짜" />
          <input
            type="text"
            value={memo}
            placeholder="메모 (선택)"
            maxLength={40}
            onChange={(e) => setMemo(e.target.value)}
            aria-label="메모"
          />
        </div>

        <p className="entry-guide">{hint || (editing ? '분류를 누르면 고친 내용이 저장돼요' : '분류를 누르면 바로 저장돼요')}</p>

        <div className="chips-area">
          {groups.map((g) => (
            <div key={g} className="chip-group">
              {groups.length > 1 && <p className="chip-group-name">{GROUPS[g]}</p>}
              <div className="chips">
                {categories
                  .filter((c) => c.group === g)
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`chip ${editing?.categoryId === c.id ? 'current' : ''}`}
                      onClick={() => save(c)}
                    >
                      {c.name}
                    </button>
                  ))}
                {adding === g ? (
                  <NewChip
                    onDone={async (name) => {
                      setAdding(null);
                      if (name) await addCategory(name, g);
                    }}
                  />
                ) : (
                  <button type="button" className="chip chip-add" onClick={() => setAdding(g)}>
                    + 추가
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="keypad">
          {KEYS.map((k) => (
            <button key={k} type="button" onClick={() => press(k)} aria-label={k === 'del' ? '지우기' : k}>
              {k === 'del' ? '⌫' : k}
            </button>
          ))}
        </div>

        {editing && (
          <button type="button" className="btn-danger" onClick={remove}>
            이 기록 삭제
          </button>
        )}
      </div>
    </div>
  );
}

function NewChip({ onDone }) {
  const [name, setName] = useState('');
  return (
    <form
      className="chip-form"
      onSubmit={(e) => {
        e.preventDefault();
        onDone(name.trim());
      }}
    >
      <input autoFocus value={name} maxLength={12} placeholder="새 분류 이름" onChange={(e) => setName(e.target.value)} />
      <button type="submit">만들기</button>
    </form>
  );
}
