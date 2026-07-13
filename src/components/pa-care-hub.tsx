const guides = [
  {
    emoji: '💧',
    title: 'Watering Guide',
    desc: 'Master the art of watering — when, how much, and the signs of over- and under-watering.',
    href: '#',
  },
  {
    emoji: '🌿',
    title: 'Fertiliser Guide',
    desc: 'Feed your plants the right nutrients at the right time for explosive, healthy growth.',
    href: '#',
  },
  {
    emoji: '🪴',
    title: 'Repotting Guide',
    desc: 'Know exactly when and how to repot to keep your plants thriving as they grow.',
    href: '#',
  },
  {
    emoji: '🔬',
    title: 'Disease & Pest Guide',
    desc: 'Identify and treat the most common plant diseases and pests before they spread.',
    href: '#',
  },
  {
    emoji: '🌱',
    title: 'Beginner Tips',
    desc: 'Start your plant journey the right way. Simple, proven tips for first-time plant parents.',
    href: '#',
  },
];

const PaCareHub: React.FC = () => (
  <section className="pa-care-section">
    <div className="pa-wrap">
      <div className="pa-sec-hdr">
        <span className="pa-pill">📚 Learning Hub</span>
        <h2 className="pa-sec-h2">
          Plant Care <span className="pa-grad-text">Guides</span>
        </h2>
        <p className="pa-sec-sub">
          Expert advice to help every plant parent succeed — from first-timers to seasoned botanists.
        </p>
      </div>

      <div className="pa-care-grid">
        {guides.map((g) => (
          <a key={g.title} href={g.href} className="pa-care-card">
            <div className="pa-care-icon">
              <span role="img" aria-label={g.title}>{g.emoji}</span>
            </div>
            <h3 className="pa-care-title">{g.title}</h3>
            <p className="pa-care-desc">{g.desc}</p>
            <span className="pa-care-link">
              Read guide
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export default PaCareHub;
