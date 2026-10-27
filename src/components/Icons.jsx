// 선 아이콘 모음. 색은 currentColor를 따른다.
const PATHS = {
  home: 'M4 10.6 12 4l8 6.6V19a1 1 0 0 1-1 1h-4.6v-5.4H9.6V20H5a1 1 0 0 1-1-1z',
  // 깃펜과 잉크병
  ledger: 'M6 14.5h7.5v4.8a1.2 1.2 0 0 1-1.2 1.2H7.2A1.2 1.2 0 0 1 6 19.3zM7.2 14.5v-1.6h5.1v1.6M10.2 13 19.6 3.6M19.6 3.6c-3.8.4-6.2 2.8-6.9 6.6 2.9-.3 5.4-2 6.9-6.6Z',
  // 열쇠 구멍이 있는 궤
  assets: 'M3.6 11h16.8v7.8a1.2 1.2 0 0 1-1.2 1.2H4.8a1.2 1.2 0 0 1-1.2-1.2zM3.6 11c0-3.4 3.8-5.8 8.4-5.8s8.4 2.4 8.4 5.8M7.6 5.8V20M16.4 5.8V20M10.6 10h2.8v3.6h-2.8z',
  // 두루마리
  memo: 'M8 4.2h11.2v13.6a2 2 0 0 1-2 2H6.4M8 4.2a2 2 0 0 0-4 0v1.6h4M8 4.2v13.6a2 2 0 1 1-4 0M11 8.6h5.4M11 11.6h5.4M11 14.6h3.4',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.2 13.4l1.6 1.2-1.8 3.1-1.9-.7a7.3 7.3 0 0 1-2 1.2l-.3 2h-3.6l-.3-2a7.3 7.3 0 0 1-2-1.2l-1.9.7-1.8-3.1 1.6-1.2a7.4 7.4 0 0 1 0-2.4L5.2 9.6 7 6.5l1.9.7a7.3 7.3 0 0 1 2-1.2l.3-2h3.6l.3 2a7.3 7.3 0 0 1 2 1.2l1.9-.7 1.8 3.1-1.6 1.2a7.4 7.4 0 0 1 0 2.4Z',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M7 17 17 7M9 7h8v8',
  back: 'M15 5.5 8.5 12l6.5 6.5',
  left: 'M14 6.5 8.5 12l5.5 5.5',
  right: 'M10 6.5l5.5 5.5-5.5 5.5',
  check: 'M6.5 12.5 10.5 16.5 17.5 8.5',
  search: 'M10.8 17.6a6.8 6.8 0 1 0 0-13.6 6.8 6.8 0 0 0 0 13.6ZM16 16l4 4',
};

export default function Icon({ name, size = 22, stroke = 1.7, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
