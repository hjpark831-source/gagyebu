import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAll, put, putMany } from './db.js';
import { addMonths, currentYm, daysIn, pad, todayStr, uid } from './format.js';

export const GROUPS = {
  income: '수입',
  fixed: '고정지출',
  variable: '변동지출',
};

const DEFAULT_CATEGORIES = {
  income: ['급여', '부수입', '이자·배당'],
  fixed: ['통신비', 'OTT', '보험료', '대출이자', '적금', '교통비', '주식', '생활비'],
  variable: ['식비', '카페', '쇼핑', '의료', '여가', '경조사'],
};

// 돈이 사라지는 소비가 아니라 자산으로 옮겨 가는 지출
const SAVING_NAMES = new Set(['적금', '주식']);

function seedCategories() {
  const now = Date.now();
  const out = [];
  for (const [group, names] of Object.entries(DEFAULT_CATEGORIES)) {
    names.forEach((name, i) =>
      out.push({ id: uid(), name, group, order: i, saving: SAVING_NAMES.has(name), deleted: false, updatedAt: now }),
    );
  }
  return out;
}

// 고정지출 자동 기록: 결제일이 지난 달 중 아직 기록되지 않은 달을 채운다.
// 한 번 만든 기록은 사용자가 지워도 다시 만들지 않는다 (지운 기록도 recurringKey를 남겨 둠).
export function runRecurring(rules, transactions) {
  const today = todayStr();
  const cur = currentYm();
  const keys = new Set(transactions.filter((t) => t.recurringKey).map((t) => t.recurringKey));
  const created = [];
  for (const r of rules) {
    if (r.deleted || !r.auto || !r.amount) continue;
    let ym = r.startMonth;
    let guard = 0;
    while (ym <= cur && guard++ < 240) {
      const date = `${ym}-${pad(Math.min(r.day, daysIn(ym)))}`;
      const key = `${r.id}:${ym}`;
      if (date <= today && !keys.has(key)) {
        created.push({
          id: uid(),
          type: 'expense',
          amount: r.amount,
          categoryId: r.categoryId,
          date,
          memo: r.name || '',
          recurringKey: key,
          deleted: false,
          updatedAt: Date.now(),
        });
        keys.add(key);
      }
      ym = addMonths(ym, 1);
    }
  }
  return created;
}

// 앱을 열 때 한 번만 불러온다 (개발 모드에서 두 번 실행돼도 기본 분류가 중복 생성되지 않게).
let loadPromise;
function loadAll() {
  if (!loadPromise) {
    loadPromise = (async () => {
      let [transactions, categories, recurring, settingsList] = await Promise.all(
        ['transactions', 'categories', 'recurring', 'settings'].map(getAll),
      );
      if (categories.length === 0) {
        categories = seedCategories();
        await putMany('categories', categories);
      }
      const settings = settingsList.find((s) => s.id === 'main') || EMPTY.settings;
      const auto = runRecurring(recurring, transactions);
      if (auto.length) {
        await putMany('transactions', auto);
        transactions = [...transactions, ...auto];
      }
      return { transactions, categories, recurring, settings };
    })();
  }
  return loadPromise;
}

const StoreContext = createContext(null);

const EMPTY = {
  transactions: [],
  categories: [],
  recurring: [],
  settings: { id: 'main', monthlyBudget: 0 },
};

export function StoreProvider({ children }) {
  const [raw, setRaw] = useState(EMPTY);
  const [status, setStatus] = useState('loading');
  const rawRef = useRef(raw);
  rawRef.current = raw;

  useEffect(() => {
    loadAll()
      .then((data) => {
        setRaw(data);
        setStatus('ready');
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
      });
  }, []);

  const upsert = useCallback(async (store, item) => {
    const rec = { deleted: false, ...item, updatedAt: Date.now() };
    await put(store, rec);
    setRaw((r) => {
      const list = r[store];
      const exists = list.some((x) => x.id === rec.id);
      return { ...r, [store]: exists ? list.map((x) => (x.id === rec.id ? rec : x)) : [...list, rec] };
    });
    return rec;
  }, []);

  const addMany = useCallback(async (store, items) => {
    if (!items.length) return;
    await putMany(store, items);
    setRaw((r) => ({ ...r, [store]: [...r[store], ...items] }));
  }, []);

  const actions = useMemo(
    () => ({
      saveTransaction: (tx) => upsert('transactions', { id: uid(), ...tx }),
      removeTransaction: (id) => {
        const tx = rawRef.current.transactions.find((t) => t.id === id);
        return tx && upsert('transactions', { ...tx, deleted: true });
      },
      addCategory: (name, group) => {
        const siblings = rawRef.current.categories.filter((c) => c.group === group && !c.deleted);
        const order = siblings.reduce((m, c) => Math.max(m, c.order), -1) + 1;
        return upsert('categories', { id: uid(), name, group, order, saving: false });
      },
      updateCategory: (cat) => upsert('categories', cat),
      removeCategory: (id) => {
        const cat = rawRef.current.categories.find((c) => c.id === id);
        return cat && upsert('categories', { ...cat, deleted: true });
      },
      moveCategory: async (id, dir) => {
        const cat = rawRef.current.categories.find((c) => c.id === id);
        const list = rawRef.current.categories
          .filter((c) => c.group === cat.group && !c.deleted)
          .sort((a, b) => a.order - b.order);
        const i = list.findIndex((c) => c.id === id);
        const j = i + dir;
        if (j < 0 || j >= list.length) return;
        const other = list[j];
        await upsert('categories', { ...cat, order: other.order });
        await upsert('categories', { ...other, order: cat.order });
      },
      saveRule: async (rule) => {
        const saved = await upsert('recurring', { id: uid(), ...rule });
        const auto = runRecurring([saved], rawRef.current.transactions);
        await addMany('transactions', auto);
        return saved;
      },
      removeRule: (id) => {
        const rule = rawRef.current.recurring.find((r) => r.id === id);
        return rule && upsert('recurring', { ...rule, deleted: true });
      },
      setBudget: async (amount) => {
        const settings = { ...rawRef.current.settings, monthlyBudget: amount, updatedAt: Date.now() };
        await put('settings', settings);
        setRaw((r) => ({ ...r, settings }));
      },
    }),
    [upsert, addMany],
  );

  const value = useMemo(() => {
    const catById = Object.fromEntries(raw.categories.map((c) => [c.id, c]));
    const categories = raw.categories.filter((c) => !c.deleted).sort((a, b) => a.order - b.order);
    return {
      status,
      transactions: raw.transactions.filter((t) => !t.deleted),
      allTransactions: raw.transactions,
      categories,
      catById,
      rules: raw.recurring.filter((r) => !r.deleted),
      settings: raw.settings,
      ...actions,
    };
  }, [raw, status, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

// 한 달 기록을 수입 / 고정지출 / 변동지출 / 저축·투자로 나눠 합산
export function summarize(list, catById) {
  const s = { income: 0, fixed: 0, variable: 0, saving: 0, spend: 0 };
  for (const t of list) {
    const cat = catById[t.categoryId];
    if (t.type === 'income') {
      s.income += t.amount;
      continue;
    }
    if (cat?.group === 'fixed') s.fixed += t.amount;
    else s.variable += t.amount;
    if (cat?.saving) s.saving += t.amount;
    else s.spend += t.amount;
  }
  return s;
}

export function sortByRecent(list) {
  return [...list].sort((a, b) => (a.date === b.date ? b.updatedAt - a.updatedAt : a.date < b.date ? 1 : -1));
}
