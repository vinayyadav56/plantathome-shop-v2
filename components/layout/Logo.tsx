export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2.6 3.4 8v9.2L12 21.4 20.6 17.2V8L12 2.6Z"
          stroke="#2E5E2A"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M12 16.5c0-3 1.7-5.2 4.2-6.1-.2 3-2 5.2-4.2 6.1Zm0 0c0-2.5-1.5-4.4-3.7-5.1.2 2.6 1.7 4.4 3.7 5.1Z"
          fill="#4E8B31"
        />
      </svg>
      <span className="font-heading text-xl font-semibold tracking-tight text-forest">PlantAtHome</span>
    </span>
  );
}
