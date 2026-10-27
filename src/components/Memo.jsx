import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import Icon from './Icons.jsx';

function whenLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `오늘 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function Memo({ onOpen, onNew }) {
  const { memos } = useStore();
  const [query, setQuery] = useState('');
  const q = query.trim();
  const shown = q ? memos.filter((m) => `${m.title} ${m.body}`.includes(q)) : memos;

  return (
    <section className="screen">
      <header className="top-row">
        <button type="button" className="circle-btn" aria-label="새 메모" onClick={onNew}>
          <Icon name="plus" size={22} />
        </button>
      </header>
      <div className="title-row">
        <h1 className="page-title">
          <small>적어 두면 잊지 않아요</small>
          메모
        </h1>
      </div>
      {memos.length > 3 && (
        <input className="memo-search" value={query} placeholder="메모 찾기" onChange={(e) => setQuery(e.target.value)} aria-label="메모 찾기" />
      )}
      {shown.length ? (
        <ul className="memo-list">
          {shown.map((m) => (
            <li key={m.id}>
              <button type="button" className="memo-card" onClick={() => onOpen(m)}>
                <span className="memo-title">
                  {m.pinned && <i className="pb-tag">고정</i>}
                  {m.title || m.body.split('\n')[0] || '제목 없음'}
                </span>
                {m.body && <span className="memo-body">{m.body}</span>}
                <span className="memo-when">{whenLabel(m.updatedAt)}</span>
                <span className="memo-go" aria-hidden="true">
                  <Icon name="arrow" size={20} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="passbook-empty">
          {q ? '찾는 메모가 없어요.' : '사야 할 것, 다음 달 계획, 기억해 둘 금액을 적어 두세요. 아래 + 버튼으로 시작해요.'}
        </p>
      )}
    </section>
  );
}

export function MemoSheet({ memo, onClose }) {
  const { saveMemo, removeMemo } = useStore();
  const [title, setTitle] = useState(memo?.title ?? '');
  const [body, setBody] = useState(memo?.body ?? '');
  const [pinned, setPinned] = useState(memo?.pinned ?? false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async () => {
    if (!title.trim() && !body.trim()) {
      if (memo) await removeMemo(memo.id);
      onClose();
      return;
    }
    await saveMemo({ ...(memo ?? {}), title: title.trim(), body, pinned });
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={save}>
      <div className="sheet memo-sheet" role="dialog" aria-modal="true" aria-label={memo ? '메모 고치기' : '새 메모'} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-top">
          <label className="check pin">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            맨 위에 고정
          </label>
          <button type="button" className="btn" onClick={save}>
            저장
          </button>
        </div>
        <input className="memo-title-input" value={title} placeholder="제목" maxLength={60} onChange={(e) => setTitle(e.target.value)} aria-label="제목" />
        <textarea className="memo-body-input" value={body} placeholder="내용을 적어 주세요" onChange={(e) => setBody(e.target.value)} aria-label="내용" autoFocus={!memo} />
        {memo && (
          <button
            type="button"
            className="btn-danger"
            onClick={async () => {
              await removeMemo(memo.id);
              onClose();
            }}
          >
            이 메모 삭제
          </button>
        )}
      </div>
    </div>
  );
}
