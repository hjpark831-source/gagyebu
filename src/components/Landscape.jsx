// 첫 화면 아래 풍경: 달 뜬 저녁, 안개 낀 산, 전나무 숲, 고요한 호수.
function pine(x, base, h, w) {
  // 삼각형 세 단을 겹친 전나무
  const t = base - h;
  const s = (k) => `M${x} ${t + h * k * 0.18}L${x + w * (0.55 + k * 0.22)} ${t + h * (0.42 + k * 0.24)}L${x - w * (0.55 + k * 0.22)} ${t + h * (0.42 + k * 0.24)}Z`;
  return `${s(0)}${s(1)}${s(2)}M${x - w * 0.08} ${base - h * 0.12}h${w * 0.16}V${base}h${-w * 0.16}Z`;
}

const FAR_TREES = [
  [18, 218, 26, 9], [34, 220, 34, 11], [52, 219, 24, 8], [66, 221, 30, 10], [84, 220, 22, 8],
  [236, 222, 22, 8], [252, 220, 30, 10], [270, 222, 26, 9], [288, 219, 36, 12], [306, 221, 24, 8],
  [322, 220, 32, 10], [340, 222, 22, 8], [356, 219, 30, 10], [374, 221, 26, 9], [392, 220, 34, 11],
];

const NEAR_TREES = [
  [8, 340, 150, 32], [38, 346, 112, 26], [64, 352, 80, 19], [370, 346, 120, 27], [396, 340, 156, 32],
];

const STARS = [
  [60, 40, 1.4], [110, 22, 1], [150, 54, 1.2], [200, 30, 0.9], [236, 66, 1], [352, 30, 1.3], [380, 74, 1], [84, 82, 0.8], [180, 86, 0.8],
];

export default function Landscape() {
  return (
    <svg className="landscape" viewBox="0 0 400 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="ls-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--paper)" stopOpacity="1" />
          <stop offset="0.35" stopColor="var(--paper)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ls-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9c3b8" />
          <stop offset="1" stopColor="#97a69a" />
        </linearGradient>
        <radialGradient id="ls-halo">
          <stop offset="0" stopColor="#e8cf98" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e8cf98" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform="translate(14 58)">
      {STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#b59a66" opacity="0.7" />
      ))}
      <circle cx="312" cy="62" r="54" fill="url(#ls-halo)" />
      <path d="M312 38a24 24 0 1 0 16 41.8 19 19 0 1 1-16-41.8Z" fill="#d6b779" />
      </g>

      <path d="M0 178C30 160 40 140 60 138s30 18 50 12 35-38 58-42 32 32 54 32 28-16 46-14 32 24 50 20 32-24 52-22 22 16 30 22V360H0Z" fill="#d3d4c8" />
      <path d="M0 200C24 186 40 170 62 172s34 20 58 14 36-28 60-26 34 30 58 28 30-20 54-18 34 22 58 20 36-12 50-8V360H0Z" fill="#b8bfb0" />
      <rect x="0" y="186" width="400" height="18" fill="#f2eee6" opacity="0.45" />
      <path d="M0 216C40 204 80 200 120 206s70-6 110-2 70 10 110 4 50-2 60 2V360H0Z" fill="#9aa795" />

      <g fill="#526c62">
        {FAR_TREES.map(([x, b, h, w]) => (
          <path key={`f${x}`} d={pine(x, b, h, w)} />
        ))}
      </g>

      <rect x="0" y="222" width="400" height="138" fill="url(#ls-lake)" />
      <path d="M298 232h28M294 244h36M300 256h24M304 268h16M300 282h22M306 296h10" stroke="#e3cb92" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      <path d="M40 240h70M150 250h90M60 262h60M190 272h110M120 284h80M30 300h90M170 310h120M80 326h70" stroke="#dfe4dc" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />

      <g fill="#2f4a44">
        {NEAR_TREES.map(([x, b, h, w]) => (
          <path key={`n${x}`} d={pine(x, b, h, w)} />
        ))}
      </g>

      <rect x="0" y="0" width="400" height="300" fill="url(#ls-fade)" />
    </svg>
  );
}
