export const pad = (n) => String(n).padStart(2, '0');

export const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;

export const num = (n) => Math.round(n || 0).toLocaleString('ko-KR');

// 달력 칸처럼 좁은 곳에 쓰는 짧은 금액 (예: 12,300 → 1.2만)
export function shortWon(n) {
  if (n >= 100000) return `${Math.round(n / 10000)}만`;
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}만`;
  return num(n);
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const currentYm = () => todayStr().slice(0, 7);

export function addMonths(ym, k) {
  let [y, m] = ym.split('-').map(Number);
  m += k;
  while (m > 12) { m -= 12; y += 1; }
  while (m < 1) { m += 12; y -= 1; }
  return `${y}-${pad(m)}`;
}

export function daysIn(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function firstWeekday(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).getDay();
}

export function ymLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${y}년 ${m}월`;
}

export const monthOnly = (ym) => `${Number(ym.slice(5, 7))}월`;

export const mdLabel = (date) => `${Number(date.slice(5, 7))}.${date.slice(8, 10)}`;

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
export function dayLabel(date) {
  const [y, m, d] = date.split('-').map(Number);
  return `${m}월 ${d}일 ${WEEK[new Date(y, m - 1, d).getDay()]}요일`;
}

export const uid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
