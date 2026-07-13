const testimonials = [
  {
    quote: 'Ordered a Monstera and it arrived beautifully packaged, healthy, and even bigger than expected. The care card included was a lovely touch.',
    name: 'Priya Sharma',
    meta: 'Mumbai · Indoor Plant Enthusiast',
    initials: 'PS',
    plant: 'Monstera Deliciosa',
    rating: 5,
  },
  {
    quote: 'As a total beginner, I was nervous. But the team recommended perfect starter plants and the online care guide made it so easy. All three are thriving!',
    name: 'Rahul Mehta',
    meta: 'Bangalore · New Plant Parent',
    initials: 'RM',
    plant: 'Snake Plant',
    rating: 5,
  },
  {
    quote: 'Same-day delivery is incredible. Ordered at 10am, my fiddle-leaf fig arrived by 4pm in perfect condition. Will never buy plants anywhere else.',
    name: 'Ananya Krishnan',
    meta: 'Chennai · Interior Designer',
    initials: 'AK',
    plant: 'Fiddle Leaf Fig',
    rating: 5,
  },
  {
    quote: 'Bought 6 succulents for my office. Each one was labeled with care instructions. Three months later, every single one is still thriving. Amazing quality!',
    name: 'Vikram Patel',
    meta: 'Pune · Office Plant Collector',
    initials: 'VP',
    plant: 'Succulent Collection',
    rating: 5,
  },
  {
    quote: 'The repotting guide on the site saved my pothos! Had no idea I was overwatering. Customer support responded in minutes. Truly exceptional service.',
    name: 'Sneha Gupta',
    meta: 'Delhi · Home Gardener',
    initials: 'SG',
    plant: 'Golden Pothos',
    rating: 5,
  },
  {
    quote: 'Got 3 air-purifying plants for my bedroom. Sleep quality has genuinely improved. Scientific claims proved right — I am a convert!',
    name: 'Arjun Nair',
    meta: 'Hyderabad · Wellness Enthusiast',
    initials: 'AN',
    plant: 'Peace Lily',
    rating: 5,
  },
];

const Stars: React.FC<{ count: number }> = ({ count }) => (
  <div className="pa-testi-stars">
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className="pa-testi-star">★</span>
    ))}
  </div>
);

const PaTestimonials: React.FC = () => (
  <section className="pa-testi-section">
    <div className="pa-wrap">
      <div className="pa-sec-hdr">
        <span className="pa-pill">⭐ Customer Stories</span>
        <h2 className="pa-sec-h2">
          Loved by <span className="pa-grad-text">Plant Parents</span>
        </h2>
        <p className="pa-sec-sub">
          Over 50,000 happy customers and counting. Here is what they say about us.
        </p>
      </div>

      <div className="pa-testi-grid">
        {testimonials.map((t) => (
          <div key={t.name} className="pa-testi-card">
            <Stars count={t.rating} />
            <p className="pa-testi-quote">{t.quote}</p>
            <div className="pa-testi-author">
              <div className="pa-testi-avatar-fallback">{t.initials}</div>
              <div>
                <div className="pa-testi-name">{t.name}</div>
                <div className="pa-testi-meta">{t.meta}</div>
              </div>
              <span className="pa-testi-badge">{t.plant}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PaTestimonials;
