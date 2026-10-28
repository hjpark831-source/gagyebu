// 자산 종류와 계산
import { todayStr } from './format.js';

// 구분: 자산 비중 막대와 목록 묶음에 쓰인다 (순서대로 표시)
export const ASSET_GROUPS = [
  { id: 'cash', label: '현금성', color: '#9cc0ff' },
  { id: 'saving', label: '저축', color: '#7fd1c1' },
  { id: 'invest', label: '투자', color: '#c6a8ff' },
  { id: 'pension', label: '연금', color: '#ffd38a' },
  { id: 'insurance', label: '보험', color: '#ffaec0' },
  { id: 'other', label: '기타', color: '#b8c2d8' },
  { id: 'debt', label: '부채', color: '#ff9f8f' },
];

// 종류별 입력 항목
// fields: name 이름, inst 금융사, amount 금액, monthly 월 납입액, start 시작일, maturity 만기일, rate 금리,
//         qty 수량, avg 평균단가, price 현재가
export const KINDS = {
  checking: { group: 'cash', label: '자유입출금', inst: '은행', fields: ['inst', 'name', 'amount'], amountLabel: '잔액' },
  cash: { group: 'cash', label: '현금', fields: ['name', 'amount'], amountLabel: '보유 현금' },
  installmentSaving: {
    group: 'saving',
    label: '적금',
    inst: '은행',
    fields: ['inst', 'name', 'monthly', 'start', 'maturity', 'rate', 'amount'],
    amountLabel: '납입 누계 (비워 두면 자동 계산)',
    amountOptional: true,
  },
  deposit: { group: 'saving', label: '예금', inst: '은행', fields: ['inst', 'name', 'amount', 'start', 'maturity', 'rate'], amountLabel: '원금' },
  housing: { group: 'saving', label: '주택청약', inst: '은행', fields: ['inst', 'name', 'monthly', 'amount'], amountLabel: '납입 누계' },
  stock: { group: 'invest', label: '주식', inst: '증권사', fields: ['inst', 'name', 'qty', 'avg', 'price'], unit: '주' },
  coin: { group: 'invest', label: '코인', inst: '거래소', fields: ['inst', 'name', 'qty', 'avg', 'price'], unit: '개', decimals: true },
  pension: { group: 'pension', label: '연금', inst: '금융사', fields: ['inst', 'name', 'amount'], amountLabel: '평가금액' },
  insurance: {
    group: 'insurance',
    label: '보험',
    inst: '보험사',
    fields: ['inst', 'name', 'amount', 'maturity'],
    amountLabel: '지금까지 납입한 금액',
    includeToggle: true,
  },
  other: { group: 'other', label: '기타 자산', fields: ['name', 'amount'], amountLabel: '금액', includeToggle: true, defaultExcluded: true },
  loan: { group: 'debt', label: '대출', inst: '금융사', fields: ['inst', 'name', 'amount', 'rate', 'monthly', 'maturity'], amountLabel: '남은 대출금' },
};

// 적금 납입 누계: 시작일부터 오늘까지 매달 같은 날 납입한 횟수 × 월 납입액 (만기일까지만)
function paidMonths(start, maturity, today) {
  if (!start) return 0;
  const end = maturity && maturity < today ? maturity : today;
  if (start > end) return 0;
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  let n = (ey - sy) * 12 + (em - sm) + 1;
  if (ed < sd) n -= 1;
  return Math.max(0, n);
}

export function valueOf(a, today = todayStr()) {
  if (a.kind === 'stock' || a.kind === 'coin') return Math.round((Number(a.qty) || 0) * (Number(a.price) || 0));
  if (a.kind === 'installmentSaving' && (a.amount === '' || a.amount == null)) {
    return (Number(a.monthly) || 0) * paidMonths(a.start, a.maturity, today);
  }
  return Number(a.amount) || 0;
}

export function included(a) {
  const k = KINDS[a.kind];
  if (!k?.includeToggle) return true;
  return a.includeInTotal ?? !k.defaultExcluded;
}

export function profitOf(a) {
  if (a.kind !== 'stock' && a.kind !== 'coin') return null;
  const qty = Number(a.qty) || 0;
  const cost = qty * (Number(a.avg) || 0);
  if (!cost) return null;
  const now = qty * (Number(a.price) || 0);
  return { amount: Math.round(now - cost), rate: (now - cost) / cost };
}

// 아직 결제되지 않은 할부 금액 (오늘 이후 날짜의 할부 기록 합계)
export function installmentDebt(transactions, today = todayStr()) {
  return transactions
    .filter((t) => t.installmentId && !t.deleted && t.date > today)
    .reduce((s, t) => s + t.amount, 0);
}

export function totals(assets, transactions) {
  const byGroup = Object.fromEntries(ASSET_GROUPS.map((g) => [g.id, 0]));
  let total = 0;
  let debt = 0;
  for (const a of assets) {
    const k = KINDS[a.kind];
    if (!k) continue;
    const v = valueOf(a);
    if (k.group === 'debt') {
      debt += v;
      byGroup.debt += v;
    } else if (included(a)) {
      total += v;
      byGroup[k.group] += v;
    }
  }
  const card = installmentDebt(transactions);
  debt += card;
  byGroup.debt += card;
  return { total, debt, net: total - debt, byGroup, card };
}

export function daysUntil(date, today = todayStr()) {
  const a = Date.parse(`${today}T00:00:00`);
  const b = Date.parse(`${date}T00:00:00`);
  return Math.round((b - a) / 86400000);
}
