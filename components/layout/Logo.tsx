export function Logo({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const mark = dark ? '#8FD56F' : '#4E8B31';
  const ink = dark ? '#F4F1EA' : '#16301A';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2.6 3.4 8v9.2L12 21.4 20.6 17.2V8L12 2.6Z" stroke={dark ? '#8FD56F' : '#2E5E2A'} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M12 16.8c0-3.1 1.8-5.4 4.4-6.3-.2 3.1-2.1 5.4-4.4 6.3Zm0 0c0-2.6-1.6-4.6-3.9-5.3.2 2.7 1.8 4.6 3.9 5.3Z" fill={mark} />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-pahserif text-[1.35rem] font-semibold tracking-tight" style={{ color: ink }}>
          Plant<span style={{ color: mark }}>at</span>Home
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.22em]" style={{ color: dark ? 'rgba(244,241,234,.6)' : 'rgba(22,48,26,.5)' }}>
          Bring Nature Home
        </span>
      </span>
    </span>
  );
}
