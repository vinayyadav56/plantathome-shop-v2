const stats = [
  {
    number: '50,000',
    suffix: '+',
    label: 'Plants Delivered',
    desc: 'Across India',
  },
  {
    number: '4.9',
    suffix: '★',
    label: 'Customer Rating',
    desc: 'Verified reviews',
  },
  {
    number: '100',
    suffix: '+',
    label: 'Local Nurseries',
    desc: 'Trusted partners',
  },
  {
    number: '98',
    suffix: '%',
    label: 'Healthy Delivery',
    desc: 'Success rate',
  },
];

const PaStats: React.FC = () => (
  <section className="pa-stats-section">
    <div className="pa-wrap pa-stats-inner">
      <div className="pa-stats-head">
        <div className="pa-stats-tag">
          <span>🏆</span>
          <span>Trusted by Plant Lovers</span>
        </div>
        <h2 className="pa-stats-h2">Why PlantAtHome</h2>
        <p className="pa-stats-sub">
          From expert curation to your doorstep — we grow with you.
        </p>
      </div>

      <div className="pa-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="pa-stat-item">
            <div className="pa-stat-number">
              {s.number}
              <span className="pa-stat-suffix">{s.suffix}</span>
            </div>
            <div className="pa-stat-label">{s.label}</div>
            <div className="pa-stat-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PaStats;
