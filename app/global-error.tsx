'use client';

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, which
 * app/error.tsx cannot. Because the layout is what failed, this component must
 * render its own <html> and <body> — Next mounts it in place of the whole
 * document.
 *
 * That also means NO shared providers, NO theme applier, and therefore no brand
 * CSS variables or Tailwind classes can be relied on. Everything here is inline
 * styles with literal values on purpose. This is the one file in the codebase
 * where hardcoded hex is correct: it renders precisely when the token layer is
 * unavailable.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: '#FAF9F6',
          color: '#16301A',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: '30rem', textAlign: 'center' }}>
          <svg
            viewBox="0 0 48 56"
            width="64"
            height="64"
            fill="none"
            aria-hidden="true"
            style={{ opacity: 0.35, marginBottom: '24px' }}
          >
            <path d="M24 54V22" stroke="#2E5E2A" strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M24 26c0-9 6.5-16.5 15-18 1 8.5-4.5 17-15 18z"
              stroke="#2E5E2A"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="#2E5E2A"
              fillOpacity="0.12"
            />
            <path
              d="M24 34c0-8-6-15-13.5-16.5C9.6 25 14.5 33 24 34z"
              stroke="#2E5E2A"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="#2E5E2A"
              fillOpacity="0.12"
            />
          </svg>

          <p
            style={{
              margin: '0 0 12px',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#908A7E',
            }}
          >
            PlantAtHome
          </p>
          <h1 style={{ margin: '0 0 16px', fontSize: '24px', lineHeight: 1.3, fontWeight: 600 }}>
            The shop hit an unexpected error
          </h1>
          <p style={{ margin: '0 0 32px', fontSize: '14px', lineHeight: 1.7, color: '#6F6A60' }}>
            We&apos;ve logged it. Reloading usually clears it.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                background: '#2E5E2A',
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                color: '#16301A',
                border: '1px solid #E9E3D6',
              }}
            >
              Back to home
            </a>
          </div>

          {error?.digest ? (
            <p style={{ marginTop: '32px', fontSize: '11px', color: '#B6B0A4' }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
