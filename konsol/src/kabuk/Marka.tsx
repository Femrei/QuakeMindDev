export function Marka() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="2" fill="var(--color-accent)" />
        <path
          d="M14.2 5.8a6 6 0 0 1 0 8.4"
          stroke="var(--color-accent)"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity=".85"
        />
        <path
          d="M5.8 14.2a6 6 0 0 1 0-8.4"
          stroke="var(--color-accent)"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity=".85"
        />
        <path
          d="M17 3a9.9 9.9 0 0 1 0 14"
          stroke="var(--color-accent)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity=".38"
        />
        <path
          d="M3 17A9.9 9.9 0 0 1 3 3"
          stroke="var(--color-accent)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity=".38"
        />
      </svg>
      <b className="font-cond text-subtitle font-semibold tracking-marka uppercase">QuakeMind</b>
    </div>
  )
}
