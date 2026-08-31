import { ImageResponse } from 'next/og';

/**
 * Default OG image for every page that doesn't set its own (PDPs use the
 * product photo). Generated — no 1200x630 design asset exists in the repo,
 * and the public/ heroes are the wrong aspect ratio.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'PlantAtHome — Buy Plants Online in India';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0D3B2E 0%, #16442e 55%, #2E5E2A 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 96 }}>🌿</div>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>PlantAtHome</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: 'rgba(255,255,255,0.85)' }}>
          Premium plants, pots &amp; care — delivered across India
        </div>
      </div>
    ),
    size,
  );
}
