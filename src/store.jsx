import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAll, put, putMany, SEED_TIME, onDbBlocked } from './db.js';
import { isConfigured, lastSyncedAt, signIn, signOutUser, syncNow, watchUser } from './sync.js';
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
  const now = SEED_TIME;
  const out = [];
  for (const [group, names] of Object.entries(DEFAULT_CATEGORIES)) {
    // 기본 분류 id는 모든 폰에서 같게 만든다 (백업으로 합칠 때 같은 분류로 인식)
    names.forEach((name, i) =>
      out.push({ id: `seed-${group}-${i}`, name, group, order: i, saving: SAVING_NAMES.has(name), deleted: false, updatedAt: now }),
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
          id: `auto-${key.replace(/[^a-zA-Z0-9-]/g, '-')}`,
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

// 폰 저장소에서 전부 읽어 온다. 기본 분류 만들기와 고정지출 자동 기록도 여기서 한다.
async function readAll() {
      let [transactions, categories, recurring, settingsList, memos, assets, snapshots] = await Promise.all(
        ['transactions', 'categories', 'recurring', 'settings', 'memos', 'assets', 'snapshots'].map(getAll),
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
      return { transactions, categories, recurring, settings, memos, assets, snapshots };
}

// 앱을 열 때 한 번만 불러온다 (개발 모드에서 두 번 실행돼도 기본 분류가 중복 생성되지 않게).
let loadPromise;
function loadAll() {
  if (!loadPromise) loadPromise = readAll();
  return loadPromise;
}

const StoreContext = createContext(null);

const EMPTY = {
  transactions: [],
  categories: [],
  recurring: [],
  memos: [],
  assets: [],
  snapshots: [],
  settings: { id: 'main', monthlyBudget: 0 },
};

export function StoreProvider({ children }) {
  const [raw, setRaw] = useState(EMPTY);
  const [status, setStatus] = useState('loading');
  const rawRef = useRef(raw);
  rawRef.current = raw;

  // 구글 백업 상태
  const [cloud, setCloud] = useState({
    configured: isConfigured,
    user: null,
    syncing: false,
    lastSync: lastSyncedAt(),
    error: '',
  });
  const userRef = useRef(null);
  const pushTimer = useRef(null);

  useEffect(() => {
    onDbBlocked(() => setStatus((s) => (s === 'loading' ? 'blocked' : s)));
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

  const runSync = useCallback(async () => {
    const user = userRef.current;
    if (!user || !navigator.onLine) return;
    setCloud((c) => ({ ...c, syncing: true, error: '' }));
    try {
      const changed = await syncNow(user);
      if (changed) setRaw(await readAll());
      setCloud((c) => ({ ...c, syncing: false, lastSync: lastSyncedAt() }));
    } catch (e) {
      console.error(e);
      const msg =
        e?.code === 'permission-denied'
          ? '클라우드 보안 규칙이 막고 있어요. Firestore 규칙을 확인해 주세요.'
          : '지금은 백업하지 못했어요. 인터넷이 연결되면 다시 시도해요.';
      setCloud((c) => ({ ...c, syncing: false, error: msg }));
    }
  }, []);

  // 기록이 바뀌면 잠시 뒤 한꺼번에 올린다
  const schedulePush = useCallback(() => {
    if (!userRef.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(runSync, 1500);
  }, [runSync]);

  // 로그인 상태 감시, 앱을 다시 보거나 인터넷이 돌아오면 동기화
  useEffect(() => {
    if (!isConfigured || status !== 'ready') return undefined;
    let stop = () => {};
    watchUser((user) => {
      userRef.current = user;
      setCloud((c) => ({ ...c, user: user ? { email: user.email, name: user.displayName } : null }));
      if (user) runSync();
    })
      .then((fn) => {
        stop = fn;
      })
      .catch((e) => {
        console.error(e);
        setCloud((c) => ({ ...c, error: '구글 백업을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.' }));
      });
    const onVisible = () => document.visibilityState === 'visible' && runSync();
    window.addEventListener('online', runSync);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stop();
      window.removeEventListener('online', runSync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, runSync]);

  const upsert = useCallback(async (store, item) => {
    const rec = { deleted: false, ...item, updatedAt: Date.now() };
    await put(store, rec);
    setRaw((r) => {
      const list = r[store];
      const exists = list.some((x) => x.id === rec.id);
      return { ...r, [store]: exists ? list.map((x) => (x.id === rec.id ? rec : x)) : [...list, rec] };
    });
    schedulePush();
    return rec;
  }, [schedulePush]);

  const addMany = useCallback(async (store, items) => {
    if (!items.length) return;
    await putMany(store, items);
    setRaw((r) => ({ ...r, [store]: [...r[store], ...items] }));
    schedulePush();
  }, [schedulePush]);

  const actions = useMemo(
    () => ({
      saveTransaction: (tx) => upsert('transactions', { id: uid(), ...tx }),
      // 할부: 총액을 개월 수로 나눠 첫 결제일부터 매달 같은 날에 기록한다. 나머지 원 단위는 첫 달에 더한다.
      saveInstallment: async ({ amount, months, date, memo, categoryId }) => {
        const groupId = uid();
        const base = Math.floor(amount / months);
        const first = amount - base * (months - 1);
        const [y, m, d] = date.split('-').map(Number);
        const startYm = `${y}-${pad(m)}`;
        const title = memo || '';
        const now = Date.now();
        const rows = Array.from({ length: months }, (_, i) => {
          const ym = addMonths(startYm, i);
          return {
            id: `${groupId}-${i + 1}`,
            type: 'expense',
            amount: i === 0 ? first : base,
            categoryId,
            date: `${ym}-${pad(Math.min(d, daysIn(ym)))}`,
            memo: `${title ? `${title} ` : ''}(${i + 1}/${months})`,
            installmentId: groupId,
            installmentNo: i + 1,
            installmentOf: months,
            installmentTotal: amount,
            installmentTitle: title,
            deleted: false,
            updatedAt: now,
          };
        });
        await addMany('transactions', rows);
      },
      removeInstallment: async (groupId) => {
        const now = Date.now();
        const rows = rawRef.current.transactions
          .filter((t) => t.installmentId === groupId && !t.deleted)
          .map((t) => ({ ...t, deleted: true, updatedAt: now }));
        await putMany('transactions', rows);
        setRaw((r) => ({
          ...r,
          transactions: r.transactions.map((t) => rows.find((x) => x.id === t.id) || t),
        }));
        schedulePush();
      },
      saveAsset: (asset) => upsert('assets', { id: uid(), ...asset }),
      removeAsset: (id) => {
        const a = rawRef.current.assets.find((x) => x.id === id);
        return a && upsert('assets', { ...a, deleted: true });
      },
      saveSnapshot: (snap) => upsert('snapshots', snap),
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
      saveMemo: (memo) => upsert('memos', { id: uid(), pinned: false, ...memo }),
      removeMemo: (id) => {
        const memo = rawRef.current.memos.find((m) => m.id === id);
        return memo && upsert('memos', { ...memo, deleted: true });
      },
      setBudget: async (amount) => {
        const settings = { ...rawRef.current.settings, monthlyBudget: amount, updatedAt: Date.now() };
        await put('settings', settings);
        setRaw((r) => ({ ...r, settings }));
        schedulePush();
      },
      connectGoogle: async () => {
        setCloud((c) => ({ ...c, error: '' }));
        try {
          await signIn();
        } catch (e) {
          console.error(e);
          if (e?.code !== 'auth/popup-closed-by-user') {
            const msg =
              e?.code === 'auth/unauthorized-domain'
                ? 'Firebase 승인된 도메인에 hjpark831-source.github.io를 추가해 주세요.'
                : '구글 로그인에 실패했어요. 잠시 뒤 다시 시도해 주세요.';
            setCloud((c) => ({ ...c, error: msg }));
          }
        }
      },
      disconnectGoogle: async () => {
        await signOutUser();
        setCloud((c) => ({ ...c, user: null, lastSync: null }));
      },
      syncNow: runSync,
    }),
    [upsert, addMany, schedulePush, runSync],
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
      assets: raw.assets.filter((a) => !a.deleted),
      snapshots: raw.snapshots,
      memos: raw.memos
        .filter((m) => !m.deleted)
        .sort((a, b) => (a.pinned === b.pinned ? b.updatedAt - a.updatedAt : a.pinned ? -1 : 1)),
      settings: raw.settings,
      cloud,
      ...actions,
    };
  }, [raw, status, cloud, actions]);

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
