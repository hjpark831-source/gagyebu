// 첫 화면 아래 그림: 구름 사이로 비치는 달, 안개 낀 밤 호수, 바위 언덕 위 등대, 물가의 불 켜진 오두막.
// 위쪽은 화면 바탕색에서 저녁 하늘, 밤하늘로 이어진다.
function pine(x, base, h, w) {
  const t = base - h;
  const s = (k) =>
    `M${x} ${t + h * k * 0.18}L${x + w * (0.55 + k * 0.22)} ${t + h * (0.42 + k * 0.24)}L${x - w * (0.55 + k * 0.22)} ${t + h * (0.42 + k * 0.24)}Z`;
  return `${s(0)}${s(1)}${s(2)}M${x - w * 0.08} ${base - h * 0.12}h${w * 0.16}V${base}h${-w * 0.16}Z`;
}

// 뭉게구름: 원 여러 개를 겹쳐 만들고, 달 쪽 윗면에 밝은 테두리를 깐다
function Cloud({ x, y, s = 1, dark = '#3a4954', rim = '#b9c0bf', rimOpacity = 0.5 }) {
  const puffs = [
    [-38, 6, 16], [-18, -4, 22], [6, -10, 26], [32, -2, 20], [52, 6, 14], [-56, 10, 10], [70, 10, 10],
  ];
  const base = `M${-66} 14h146v10h-146z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill={rim} opacity={rimOpacity} transform="translate(0 -3)">
        {puffs.map(([px, py, r]) => (
          <circle key={`r${px}`} cx={px} cy={py} r={r} />
        ))}
      </g>
      <g fill={dark}>
        {puffs.map(([px, py, r]) => (
          <circle key={`d${px}`} cx={px} cy={py} r={r} />
        ))}
        <path d={base} />
      </g>
    </g>
  );
}

const STARS = [
  [36, 196, 0.9], [150, 176, 0.8], [200, 160, 1.1], [236, 206, 0.8], [372, 186, 0.9], [176, 226, 0.7], [64, 230, 0.7], [276, 170, 0.8],
];
const SHORE_PINES = [
  [12, 394, 30, 9], [26, 396, 40, 11], [42, 395, 26, 8], [150, 392, 26, 8], [166, 394, 36, 10], [182, 393, 28, 9],
  [198, 395, 22, 7], [212, 394, 30, 9],
];
const CLIFF_PINES = [
  [262, 344, 30, 9], [276, 340, 40, 11], [352, 336, 36, 10], [368, 334, 44, 12], [386, 338, 32, 9], [398, 335, 40, 11],
];
const FRONT_PINES = [
  [4, 566, 170, 32], [32, 570, 120, 25], [378, 568, 136, 27], [402, 564, 180, 34],
];

export default function Landscape() {
  return (
    <svg className="landscape" viewBox="0 0 400 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="nl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2eee6" />
          <stop offset="0.2" stopColor="#f2eee6" />
          <stop offset="0.3" stopColor="#d6d5cc" />
          <stop offset="0.38" stopColor="#8f9b9f" />
          <stop offset="0.48" stopColor="#3f505b" />
          <stop offset="0.7" stopColor="#25333d" />
        </linearGradient>
        <linearGradient id="nl-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3c4e59" />
          <stop offset="1" stopColor="#18242b" />
        </linearGradient>
        <linearGradient id="nl-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a5149" />
          <stop offset="1" stopColor="#2a2724" />
        </linearGradient>
        <linearGradient id="nl-beam" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff1c2" stopOpacity="0.32" />
          <stop offset="1" stopColor="#fff1c2" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nl-moon">
          <stop offset="0" stopColor="#fbf3d9" stopOpacity="0.95" />
          <stop offset="0.22" stopColor="#ece6d1" stopOpacity="0.55" />
          <stop offset="1" stopColor="#c9d0cf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nl-warm">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <filter id="nl-soft" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="nl-mist" x="-30%" y="-150%" width="160%" height="400%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <rect width="400" height="560" fill="url(#nl-sky)" />
      {STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#f4efe0" opacity="0.8" />
      ))}

      {/* 달과 구름 */}
      <circle cx="112" cy="252" r="110" fill="url(#nl-moon)" />
      <circle cx="112" cy="252" r="19" fill="#faf3dc" />
      <g filter="url(#nl-soft)">
        <Cloud x={70} y={286} s={1.05} dark="#465661" rim="#e2dfd2" rimOpacity={0.55} />
        <Cloud x={170} y={240} s={0.75} dark="#4f5e68" rim="#e8e3d3" rimOpacity={0.6} />
        <Cloud x={312} y={232} s={1.35} dark="#33424c" rim="#8d989c" rimOpacity={0.45} />
        <Cloud x={250} y={300} s={1.1} dark="#2c3a44" rim="#6f7c82" rimOpacity={0.4} />
        <Cloud x={20} y={226} s={0.6} dark="#55646d" rim="#d8d6ca" rimOpacity={0.5} />
      </g>

      {/* 먼 산 */}
      <path d="M0 372C34 356 66 346 104 350s58 14 92 10 40-16 64-18V400H0Z" fill="#37474f" />

      {/* 오른쪽 바위 언덕과 등대 */}
      <path d="M232 400C240 376 250 352 270 342s40-8 58-12 46-6 72-2V400Z" fill="url(#nl-rock)" />
      <path d="M262 360l14 10M290 352l10 16M340 346l-8 18M372 344l6 14M300 380l16 6M354 372l-14 8" stroke="#6e655b" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <polygon points="314,262 120,226 120,300" fill="url(#nl-beam)" />
      <circle cx="318" cy="264" r="44" fill="url(#nl-warm)" opacity="0.5" />
      <path d="M309 332l3-58h12l3 58z" fill="#d9d2c3" />
      <path d="M318 332v-58h6l3 58z" fill="#b5ad9d" />
      <path d="M310.5 312h15M311.4 296h13.2" stroke="#8a4a3e" strokeWidth="4" />
      <rect x="309" y="264" width="18" height="10" rx="1" fill="#ffd27a" />
      <path d="M307 264h22l-11-9z" fill="#2a2522" />
      <path d="M306 274h24" stroke="#2a2522" strokeWidth="2" />
      <g fill="#1d2a2f">
        {CLIFF_PINES.map(([x, b, h, w]) => (
          <path key={`c${x}`} d={pine(x, b, h, w)} />
        ))}
      </g>

      {/* 왼쪽 물가와 오두막 */}
      <path d="M0 398C40 390 120 388 232 400H0Z" fill="#26343b" />
      <g fill="#1d2a2f">
        {SHORE_PINES.map(([x, b, h, w]) => (
          <path key={`s${x}`} d={pine(x, b, h, w)} />
        ))}
      </g>
      <circle cx="96" cy="382" r="32" fill="url(#nl-warm)" opacity="0.55" />
      <path d="M76 396v-16l20-15 20 15v16z" fill="#25211d" />
      <path d="M72 382l24-19 24 19" fill="none" stroke="#171513" strokeWidth="4" strokeLinejoin="round" />
      <rect x="105" y="358" width="5" height="11" fill="#25211d" />
      <rect x="82" y="383" width="7" height="7" rx="1" fill="#ffcf6e" />
      <rect x="101" y="383" width="7" height="7" rx="1" fill="#ffcf6e" />
      <path d="M108 356c-4-8 4-12 0-22" fill="none" stroke="#c9cfcf" strokeWidth="2" opacity="0.35" strokeLinecap="round" />

      {/* 호수와 반사 */}
      <rect x="0" y="400" width="400" height="160" fill="url(#nl-lake)" />
      <g stroke="#f1e9cf" strokeLinecap="round" opacity="0.7" strokeWidth="2.4">
        <path d="M100 412h26M96 426h34M104 440h20M98 456h28M106 472h14M102 490h18" />
      </g>
      <g stroke="#ffcf6e" strokeLinecap="round" opacity="0.6" strokeWidth="2">
        <path d="M86 404v10M105 404v12M85 422v5M104 424v6" />
        <path d="M318 406v14M316 428h6M312 442h14M317 458v8M314 476h8" />
      </g>
      <path d="M170 430h70M250 450h80M150 476h60M260 496h90M40 506h70M180 520h90" stroke="#6f818a" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />

      {/* 물안개 */}
      <g filter="url(#nl-mist)" fill="#e6e8e2">
        <ellipse cx="80" cy="400" rx="120" ry="9" opacity="0.38" />
        <ellipse cx="300" cy="404" rx="140" ry="10" opacity="0.32" />
        <ellipse cx="200" cy="388" rx="90" ry="6" opacity="0.22" />
        <ellipse cx="320" cy="352" rx="70" ry="6" opacity="0.18" />
      </g>

      <g fill="#121a1d">
        {FRONT_PINES.map(([x, b, h, w]) => (
          <path key={`f${x}`} d={pine(x, b, h, w)} />
        ))}
      </g>
    </svg>
  );
}
