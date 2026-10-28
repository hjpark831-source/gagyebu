import { useEffect, useState } from 'react';
import { currentYm, todayStr, won } from '../format.js';
import { GROUPS, useStore } from '../store.jsx';
import Icon from './Icons.jsx';

export default function Settings({ onBack }) {
  return (
    <section className="screen">
      <header className="top-row">
        <button type="button" className="circle-btn ghost" aria-label="처음 화면으로" onClick={onBack}>
          <Icon name="back" size={22} />
        </button>
      </header>
      <div className="title-row">
        <h1 className="page-title">
          <small>예산, 고정지출, 분류</small>
          설정
        </h1>
      </div>
      <BackupSection />
      <BudgetForm />
      <FixedRules />
      <CategoryManager />
      <DataSection />
    </section>
  );
}

function BudgetForm() {
  const { settings, setBudget } = useStore();
  const [value, setValue] = useState(settings.monthlyBudget ? String(settings.monthlyBudget) : '');
  const [saved, setSaved] = useState(false);
  // 다른 폰에서 바꾼 예산이 백업으로 들어오면 입력칸도 맞춘다
  useEffect(() => {
    setValue(settings.monthlyBudget ? String(settings.monthlyBudget) : '');
  }, [settings.monthlyBudget]);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        await setBudget(Number(value) || 0);
        setSaved(true);
      }}
    >
      <h3>월 예산</h3>
      <p className="panel-desc">적금·주식을 뺀 소비 금액 기준이에요. 매달 1일에 새로 시작해요.</p>
      <div className="inline-field">
        <input
          inputMode="numeric"
          value={value}
          placeholder="예: 1500000"
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, ''));
            setSaved(false);
          }}
          aria-label="월 예산 금액"
        />
        <button type="submit" className="btn">
          {saved ? '저장됨' : '저장'}
        </button>
      </div>
      {value && <p className="panel-desc">{won(Number(value))}</p>}
    </form>
  );
}

function FixedRules() {
  const { rules, categories, catById, saveRule, removeRule } = useStore();
  const fixedCats = categories.filter((c) => c.group === 'fixed');
  const [form, setForm] = useState(null);

  const startNew = () =>
    setForm({ categoryId: fixedCats[0]?.id ?? '', name: '', amount: '', day: '', auto: true, thisMonth: true });

  return (
    <div className="panel">
      <h3>고정지출 자동 기록</h3>
      <p className="panel-desc">등록해 두면 매달 결제일에 가계부에 자동으로 적혀요.</p>
      {rules.length > 0 && (
        <ul className="rule-list">
          {rules.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="rule-main"
                onClick={() => setForm({ ...r, amount: String(r.amount), day: String(r.day), thisMonth: false })}
              >
                <span className="rule-name">{r.name || catById[r.categoryId]?.name}</span>
                <span className="rule-sub">
                  매달 {r.day}일, {r.auto ? '자동 기록' : '자동 기록 꺼짐'}
                </span>
              </button>
              <span className="rule-amt">{won(r.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {form ? (
        <form
          className="rule-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const day = Math.min(31, Math.max(1, Number(form.day) || 1));
            const today = Number(todayStr().slice(8));
            const { thisMonth, ...rest } = form;
            await saveRule({
              ...rest,
              amount: Number(form.amount) || 0,
              day,
              startMonth: form.startMonth ?? (thisMonth || day > today ? currentYm() : nextYm()),
            });
            setForm(null);
          }}
        >
          <label>
            분류
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {fixedCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            이름 (선택)
            <input value={form.name} placeholder="예: 넷플릭스" maxLength={20} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="two-col">
            <label>
              금액
              <input
                inputMode="numeric"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, '') })}
              />
            </label>
            <label>
              매달 결제일
              <input
                inputMode="numeric"
                required
                value={form.day}
                placeholder="1~31"
                onChange={(e) => setForm({ ...form, day: e.target.value.replace(/\D/g, '').slice(0, 2) })}
              />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={form.auto} onChange={(e) => setForm({ ...form, auto: e.target.checked })} />
            결제일에 자동으로 기록
          </label>
          {!form.id && (
            <label className="check">
              <input type="checkbox" checked={form.thisMonth} onChange={(e) => setForm({ ...form, thisMonth: e.target.checked })} />
              결제일이 지났으면 이번 달 것도 기록
            </label>
          )}
          <div className="form-actions">
            {form.id && (
              <button
                type="button"
                className="btn-danger-text"
                onClick={async () => {
                  await removeRule(form.id);
                  setForm(null);
                }}
              >
                삭제
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>
              취소
            </button>
            <button type="submit" className="btn">
              저장
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-ghost wide" onClick={startNew}>
          + 고정지출 등록
        </button>
      )}
    </div>
  );
}

function nextYm() {
  const ym = currentYm();
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

function CategoryManager() {
  const { categories, addCategory, updateCategory, removeCategory, moveCategory } = useStore();
  const [group, setGroup] = useState('fixed');
  const [name, setName] = useState('');
  const list = categories.filter((c) => c.group === group);

  return (
    <div className="panel">
      <h3>분류 관리</h3>
      <div className="seg seg-small">
        {Object.entries(GROUPS).map(([id, label]) => (
          <button key={id} type="button" className={group === id ? 'on' : ''} onClick={() => setGroup(id)}>
            {label}
          </button>
        ))}
      </div>
      <ul className="cat-list">
        {list.map((c, i) => (
          <li key={c.id}>
            <input
              key={c.name}
              defaultValue={c.name}
              maxLength={12}
              aria-label={`${c.name} 이름`}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== c.name) updateCategory({ ...c, name: v });
                else e.target.value = c.name;
              }}
            />
            <button type="button" className="icon-btn small" aria-label="위로" disabled={i === 0} onClick={() => moveCategory(c.id, -1)}>
              ↑
            </button>
            <button type="button" className="icon-btn small" aria-label="아래로" disabled={i === list.length - 1} onClick={() => moveCategory(c.id, 1)}>
              ↓
            </button>
            <button type="button" className="btn-danger-text" onClick={() => removeCategory(c.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
      <form
        className="inline-field"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await addCategory(name.trim(), group);
          setName('');
        }}
      >
        <input value={name} maxLength={12} placeholder={`새 ${GROUPS[group]} 분류`} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn">
          추가
        </button>
      </form>
      <p className="panel-desc">분류를 지워도 그동안의 기록은 그대로 남아요.</p>
    </div>
  );
}

function DataSection() {
  const { allTransactions, catById } = useStore();

  const exportCsv = () => {
    const rows = [['날짜', '구분', '분류', '금액', '메모']];
    const list = allTransactions.filter((t) => !t.deleted).sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const t of list) {
      const cat = catById[t.categoryId];
      const kind = t.type === 'income' ? '수입' : cat?.group === 'fixed' ? '고정지출' : '변동지출';
      rows.push([t.date, kind, cat?.name ?? '', t.amount, t.memo ?? '']);
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `가계부_${todayStr()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="panel">
      <h3>엑셀로 내려받기</h3>
      <p className="panel-desc">모든 기록을 엑셀에서 열 수 있는 파일로 저장해요.</p>
      <button type="button" className="btn-ghost wide" onClick={exportCsv}>
        엑셀(CSV)로 내려받기
      </button>
    </div>
  );
}

function syncTimeLabel(ts) {
  if (!ts) return '아직 백업 전';
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return sameDay ? `오늘 ${hm}` : `${d.getMonth() + 1}월 ${d.getDate()}일 ${hm}`;
}

function BackupSection() {
  const { cloud, connectGoogle, disconnectGoogle, syncNow } = useStore();

  if (!cloud.configured) {
    return (
      <div className="panel">
        <h3>구글 자동 백업</h3>
        <p className="panel-desc">아직 연결 준비 중이에요. 그 전까지는 기록이 이 폰 안에만 저장돼요.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>구글 자동 백업</h3>
      {cloud.user ? (
        <>
          <p className="backup-who">
            <span className={`backup-dot ${cloud.error ? 'warn' : 'ok'}`} aria-hidden="true" />
            {cloud.user.email}
          </p>
          <p className="panel-desc">
            {cloud.syncing ? '백업하는 중…' : `마지막 백업: ${syncTimeLabel(cloud.lastSync)}`}. 기록할 때마다 자동으로 저장돼요.
            폰을 바꿔도 같은 구글 계정으로 연결하면 그대로 이어서 쓸 수 있어요.
          </p>
          {cloud.error && <p className="backup-error">{cloud.error}</p>}
          <div className="form-actions">
            <button type="button" className="btn-danger-text" onClick={disconnectGoogle}>
              연결 해제
            </button>
            <button type="button" className="btn" onClick={syncNow} disabled={cloud.syncing}>
              지금 백업
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="panel-desc">
            구글 계정으로 연결하면 기록할 때마다 클라우드에 자동으로 저장돼요. 폰을 바꿔도 같은 계정으로 연결하면 그대로 복원돼요.
          </p>
          {cloud.error && <p className="backup-error">{cloud.error}</p>}
          <button type="button" className="btn wide-btn" onClick={connectGoogle}>
            구글 계정으로 연결
          </button>
        </>
      )}
    </div>
  );
}
