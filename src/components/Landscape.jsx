// 첫 화면 아래 그림: 구름 사이 달빛, 안개 낀 밤 호수, 어두운 숲, 물가에 불 켜진 작은 오두막.
// 위쪽은 화면 바탕색으로 자연스럽게 이어진다.
function pine(x, base, h, w) {
  const t = base - h;
  const s = (k) =>
    `M${x} ${t + h * k * 0.18}L${x + w * (0.55 + k * 0.22)} ${t + h * (0.42 + k * 0.24)}L${x - w * (0.55 + k * 0.22)} ${t + h * (0.42 + k * 0.24)}Z`;
  return `${s(0)}${s(1)}${s(2)}M${x - w * 0.08} ${base - h * 0.12}h${w * 0.16}V${base}h${-w * 0.16}Z`;
}

const SHORE_PINES = [
  [14, 252, 30, 9], [28, 254, 38, 11], [44, 253, 26, 8], [178, 250, 24, 8], [194, 252, 34, 10], [210, 251, 28, 9],
  [226, 253, 22, 7], [262, 246, 30, 9], [278, 244, 42, 12], [296, 246, 34, 10], [314, 243, 46, 13], [334, 245, 36, 11],
  [352, 243, 44, 12], [370, 246, 30, 9], [388, 244, 40, 11],
];
const FRONT_PINES = [
  [6, 384, 150, 30], [34, 388, 112, 24], [376, 386, 126, 26], [400, 382, 160, 32],
];
const STARS = [
  [40, 150, 0.9], [150, 128, 0.8], [210, 112, 1.1], [250, 150, 0.8], [330, 120, 1], [372, 160, 0.8], [182, 168, 0.7],
];

export default function Landscape() {
  return (
    <svg className="landscape" viewBox="0 0 400 380" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="nl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2eee6" />
          <stop offset="0.16" stopColor="#d9d7cf" />
          <stop offset="0.36" stopColor="#7d8a8f" />
          <stop offset="0.58" stopColor="#34444e" />
          <stop offset="0.7" stopColor="#2a3943" />
        </linearGradient>
        <linearGradient id="nl-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4c57" />
          <stop offset="1" stopColor="#1c2930" />
        </linearGradient>
        <radialGradient id="nl-moon">
          <stop offset="0" stopColor="#fbf3d9" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#e9e4d0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#c9d0cf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nl-warm">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <filter id="nl-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="nl-mist" x="-30%" y="-100%" width="160%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width="400" height="380" fill="url(#nl-sky)" />

      {STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#f4efe0" opacity="0.8" />
      ))}

      {/* 달과 구름 */}
      <circle cx="104" cy="150" r="72" fill="url(#nl-moon)" />
      <circle cx="104" cy="150" r="15" fill="#f8f1da" />
      <g filter="url(#nl-soft)">
        <ellipse cx="60" cy="168" rx="70" ry="13" fill="#4a5963" opacity="0.85" />
        <ellipse cx="150" cy="140" rx="60" ry="11" fill="#56656e" opacity="0.7" />
        <ellipse cx="300" cy="158" rx="110" ry="16" fill="#3d4c56" opacity="0.85" />
        <ellipse cx="250" cy="182" rx="90" ry="12" fill="#2f3e48" opacity="0.8" />
        <ellipse cx="128" cy="160" rx="34" ry="5" fill="#d9d6c8" opacity="0.45" />
      </g>

      {/* 먼 산등성이와 오른쪽 언덕 */}
      <path d="M0 236C40 222 70 214 110 218s70 14 100 10 50-12 80-14 70 6 110 0V260H0Z" fill="#3b4b54" />
      <path d="M236 250C250 232 268 214 296 208s58-6 80 4 24 22 24 30V262H236Z" fill="#2a383f" />
      <g fill="#1f2c31">
        {SHORE_PINES.map(([x, b, h, w]) => (
          <path key={`s${x}`} d={pine(x, b, h, w)} />
        ))}
      </g>

      {/* 물가 오두막 */}
      <circle cx="116" cy="244" r="34" fill="url(#nl-warm)" opacity="0.55" />
      <path d="M94 256v-18l22-16 22 16v18z" fill="#25211d" />
      <path d="M90 240l26-20 26 20" fill="none" stroke="#171513" strokeWidth="4" strokeLinejoin="round" />
      <rect x="126" y="214" width="5" height="12" fill="#25211d" />
      <rect x="101" y="242" width="8" height="8" rx="1" fill="#ffcf6e" />
      <rect x="121" y="242" width="8" height="8" rx="1" fill="#ffcf6e" />
      <path d="M128 212c-4-8 4-12 0-20" fill="none" stroke="#c9cfcf" strokeWidth="2" opacity="0.35" strokeLinecap="round" />

      {/* 호수 */}
      <rect x="0" y="256" width="400" height="124" fill="url(#nl-lake)" />
      <g stroke="#f1e9cf" strokeLinecap="round" opacity="0.75">
        <path d="M94 266h22M90 278h30M98 290h16M93 302h24M100 316h12" strokeWidth="2.4" />
      </g>
      <g stroke="#ffcf6e" strokeLinecap="round" opacity="0.6">
        <path d="M105 262v10M125 262v12M104 280v5M124 282v6" strokeWidth="2" />
      </g>
      <path d="M180 284h80M240 300h70M150 320h60M260 336h90M60 344h70" stroke="#6f818a" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* 물안개 */}
      <g filter="url(#nl-mist)" fill="#e6e8e2">
        <ellipse cx="80" cy="258" rx="110" ry="8" opacity="0.35" />
        <ellipse cx="300" cy="262" rx="130" ry="9" opacity="0.3" />
        <ellipse cx="200" cy="246" rx="90" ry="6" opacity="0.22" />
      </g>

      <g fill="#131c1f">
        {FRONT_PINES.map(([x, b, h, w]) => (
          <path key={`f${x}`} d={pine(x, b, h, w)} />
        ))}
      </g>
    </svg>
  );
}
