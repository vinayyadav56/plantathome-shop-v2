import Link from '@/components/ui/link';
import { Image } from '@/components/ui/image';
import { useRouter } from '@/compat/next-router';

// Self-hosted (served by Vercel CDN) — no external Unsplash dependency, which
// had already started failing for the featured image.
const HERO_IMG = '/images/hero/hero-bg.jpg';
const FEATURED_IMG = '/images/hero/hero-featured.jpg';

const badges = [
  { icon: '🚚', text: 'Same Day Delivery' },
  { icon: '🌱', text: 'Healthy Plant Guarantee' },
  { icon: '💬', text: 'Expert Support' },
  { icon: '♻️', text: 'Eco Packaging' },
];

const PaHero: React.FC = () => {
  const router = useRouter();

  return (
    <section className="pa-hero">
      {/* Background */}
      <img
        src={HERO_IMG}
        alt=""
        className="pa-hero-bg"
        aria-hidden="true"
      />
      <div className="pa-hero-overlay" aria-hidden="true" />

      <div className="pa-hero-inner">
        {/* Left: copy */}
        <div className="pa-hero-content">
          <div className="pa-hero-tag">
            <span>🌿</span>
            <span>Premium Plant Nursery</span>
          </div>

          <h1 className="pa-hero-h1">
            Bring <em>Nature</em><br />
            Home
          </h1>

          <p className="pa-hero-sub">
            Premium plants delivered fresh from local nurseries — curated
            by botanists, loved by plant parents across India.
          </p>

          <div className="pa-hero-actions">
            <Link href="/plants/search" className="pa-btn-primary pa-cta-glow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Shop Plants
            </Link>
            <Link href="/plants/search/?category=foliage-plants" className="pa-btn-secondary">
              Plant Care Guide
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          <div className="pa-hero-badges">
            {badges.map((b) => (
              <div key={b.text} className="pa-hero-badge">
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: featured plant image */}
        <div className="pa-hero-visual">
          <div className="pa-hero-img-wrap">
            <img src={FEATURED_IMG} alt="Featured plant collection" />

            {/* Floating card */}
            <div className="pa-hero-img-card pa-hero-img-card-top">
              <div className="pa-hero-card-icon">🌿</div>
              <div>
                <strong>840+ Plants</strong>
                <span>Ready to deliver</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaHero;
