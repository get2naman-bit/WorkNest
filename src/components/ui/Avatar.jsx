/* Placeholder portrait. Replace with <img src="/src/assets/alex.jpg" /> for the real photo. */
export default function Avatar({ size = 140 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label="Alex Morgan portrait" style={{ borderRadius: 14 }}>
      <defs>
        <linearGradient id="avbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9d8e6" /><stop offset="1" stopColor="#8fa6bd" />
        </linearGradient>
      </defs>
      <rect width="140" height="140" fill="url(#avbg)" />
      <path d="M18 140c4-30 26-42 52-42s48 12 52 42z" fill="#2c4a6b" />
      <rect x="58" y="80" width="24" height="20" rx="8" fill="#d9a988" />
      <ellipse cx="70" cy="60" rx="24" ry="27" fill="#e2b493" />
      <path d="M44 54c0-20 12-28 26-28s26 8 26 28c-6-8-14-11-26-11s-20 3-26 11z" fill="#1f3a5a" />
      <rect x="42" y="46" width="56" height="9" rx="4" fill="#1f3a5a" />
      <path d="M56 72c4 10 24 10 28 0-2 12-8 16-14 16s-12-4-14-16z" fill="#4b3a2f" />
    </svg>
  );
}
