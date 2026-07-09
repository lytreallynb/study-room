export default function CoinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="var(--lamp)" />
      <circle cx="8" cy="8" r="5" fill="none" stroke="#00000033" strokeWidth="1.5" />
      <path
        d="M8 4.5 v7 M6 6 h4 M6 10 h4"
        stroke="#00000055"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
