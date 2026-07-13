import { useSettings } from '@/framework/settings';

const DEFAULT_FEATURES = [
  {
    emoji: '🚚',
    title: 'Free Delivery',
    desc: 'Free shipping on orders above ₹999. Safe, swift delivery to your door.',
  },
  {
    emoji: '🌱',
    title: 'Healthy Plants',
    desc: 'Every plant is nurtured by experts and arrives thriving, ready to grow.',
  },
  {
    emoji: '🔄',
    title: 'Easy Returns',
    desc: '7-day hassle-free returns. Unhappy with your plant? We make it right.',
  },
  {
    emoji: '💬',
    title: 'Plant Care Support',
    desc: 'Expert advice and care guides, available 7 days a week, just for you.',
  },
];

const PaFeatures: React.FC = () => {
  const { settings } = useSettings() as any;
  const features: typeof DEFAULT_FEATURES =
    settings?.homeFeatures?.length ? settings.homeFeatures : DEFAULT_FEATURES;

  return (
    <section className="pa-feat-section">
      <div className="pa-wrap">
        <div className="pa-feat-grid">
          {features.map((f: any) => (
            <div key={f.title} className="pa-feat-card">
              <div className="pa-feat-icon">
                <span role="img" aria-label={f.title}>{f.emoji}</span>
              </div>
              <div>
                <h3 className="pa-feat-title">{f.title}</h3>
                <p className="pa-feat-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PaFeatures;
