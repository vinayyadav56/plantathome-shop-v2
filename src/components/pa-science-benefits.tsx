'use client';
import React from 'react';
import { useSettings } from '@/framework/settings';

const AirIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" width="24" height="24">
    <circle cx="14" cy="14" r="10" stroke="#2E6B4A" strokeWidth="1.5"/>
    <path d="M9 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#2E6B4A" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 9v-2M7 14H5M23 14h-2" stroke="#C7A76C" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const StressIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" width="24" height="24">
    <path d="M14 4C8.48 4 4 8.48 4 14s4.48 10 10 10 10-4.48 10-10S19.52 4 14 4z" stroke="#2E6B4A" strokeWidth="1.5"/>
    <path d="M10 15s.83 2 4 2 4-2 4-2" stroke="#C7A76C" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10.5" cy="12.5" r="1" fill="#2E6B4A"/>
    <circle cx="17.5" cy="12.5" r="1" fill="#2E6B4A"/>
  </svg>
);

const SleepIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" width="24" height="24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#2E6B4A" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M15 9h4l-4 4h4" stroke="#C7A76C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DecorIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" width="24" height="24">
    <rect x="5" y="5" width="18" height="18" rx="2" stroke="#2E6B4A" strokeWidth="1.5"/>
    <path d="M9 17c2-4 8-6 10-2" stroke="#2E6B4A" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="10" r="1.5" fill="#C7A76C"/>
  </svg>
);

const FocusIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" width="24" height="24">
    <rect x="4" y="4" width="20" height="20" rx="2" stroke="#2E6B4A" strokeWidth="1.5"/>
    <path d="M7 18l4-4 3 3 4-5 3 3" stroke="#2E6B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 9h20" stroke="#C7A76C" strokeWidth="1" opacity="0.5"/>
  </svg>
);

const DEFAULT_BENEFITS = [
  {
    id: 'air',
    title: 'Air Purification',
    description: 'Plants filter toxins like formaldehyde and benzene — creating a measurably cleaner, fresher home.',
    image: '/images/benefits/air.jpg',
    featured: false,
  },
  {
    id: 'stress',
    title: 'Stress Reduction',
    description: 'Tending to plants lowers cortisol by up to 20% — a natural, science-backed way to unwind daily.',
    image: '/images/benefits/calm.jpg',
    featured: false,
  },
  {
    id: 'sleep',
    title: 'Better Sleep',
    description: 'Bedroom plants release oxygen at night and maintain optimal humidity, creating the calm atmosphere sleep needs.',
    image: '/images/benefits/sleep.jpg',
    featured: true,
  },
  {
    id: 'decor',
    title: 'Living Decor',
    description: 'Biophilic design with living plants elevates interiors — textures and forms that breathe and evolve.',
    image: '/images/benefits/humidity.jpg',
    featured: false,
  },
  {
    id: 'focus',
    title: 'Productivity Boost',
    description: 'Plants in workspaces increase productivity by 15% and sharpen focus for sustained deep work.',
    image: '/images/benefits/focus.jpg',
    featured: false,
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  air:    <AirIcon />,
  stress: <StressIcon />,
  sleep:  <SleepIcon />,
  decor:  <DecorIcon />,
  focus:  <FocusIcon />,
};

const PaScienceBenefits: React.FC = () => {
  const { settings } = useSettings() as any;
  const benefits: typeof DEFAULT_BENEFITS =
    settings?.scienceBenefits?.length ? settings.scienceBenefits : DEFAULT_BENEFITS;

  return (
    <section className="pa-sci-section">
      {/* Floating leaf decorations (nth-child positions defined in CSS) */}
      <div className="pa-sci-leaf" aria-hidden="true">
        <svg viewBox="0 0 80 100" fill="none" width="100%">
          <path d="M40 95C40 95 5 70 5 35C5 10 40 5 40 5C40 5 75 10 75 35C75 70 40 95 40 95Z" fill="#2E6B4A"/>
          <path d="M40 5L40 95" stroke="#2E6B4A" strokeWidth="1.5"/>
        </svg>
      </div>
      <div className="pa-sci-leaf" aria-hidden="true">
        <svg viewBox="0 0 60 80" fill="none" width="100%">
          <path d="M30 75C30 75 3 56 3 28C3 8 30 3 30 3C30 3 57 8 57 28C57 56 30 75 30 75Z" fill="#2E6B4A"/>
        </svg>
      </div>

      <div className="pa-wrap">
        {/* Header */}
        <div className="pa-sci-header">
          <span className="pa-sci-gold-leaf">🌿</span>
          <h2 className="pa-sci-h2">
            Why Every Home <span>Needs Plants</span>
          </h2>
          <p className="pa-sci-sub">
            Backed by research. Proven by nature. Transform your living space into a sanctuary
            that nurtures body, mind, and soul.
          </p>
        </div>

        {/* Cards grid */}
        <div className="pa-sci-grid">
          {benefits.map((item) => (
            <div
              key={item.id}
              className={`pa-sci-card${item.featured ? ' pa-sci-card--featured' : ''}`}
            >
              {/* Background image wrapper — CSS scales this on hover */}
              <div className="pa-sci-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="pa-sci-bg-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>

              {/* Dark gradient overlay */}
              <div className="pa-sci-overlay" />

              {/* Icon badge */}
              <div className="pa-sci-icon-badge">
                {ICON_MAP[item.id] ?? <AirIcon />}
              </div>

              {/* Text body */}
              <div className="pa-sci-body">
                <h3 className="pa-sci-title">{item.title}</h3>
                <div className="pa-sci-divider">
                  <span className="pa-sci-divider-dot" />
                </div>
                <p className="pa-sci-desc">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PaScienceBenefits;
