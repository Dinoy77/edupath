import React, { useState } from 'react';

export default function Hero({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
    document.getElementById('colleges')?.scrollIntoView({ behavior: 'smooth' });
  };

  const quickLinks = ['B.Pharm', 'M.Pharm', 'Nursing', 'GNM', 'Government'];

  return (
    <section style={styles.hero}>
      <div style={styles.bg} />
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.content}>
        <div style={styles.badge}>🇮🇳 South India's #1 College Discovery Platform</div>

        <h1 style={styles.heading}>
          Find Your Perfect{' '}
          <span style={styles.highlight}>College</span>
          <br className="hide-mobile" /> in Soth India
        </h1>

        <p style={styles.sub}>
          Explore 261 colleges across Kerala, Bangalore & Tamil Nadu.
          Compare, enquire, and start your dream career.
        </p>

        <form style={styles.searchBox} onSubmit={handleSearch}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search colleges, courses, cities..."
            value={query}
            onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
          />
          <button type="submit" style={styles.searchBtn}>Search</button>
        </form>

        <div style={styles.quickLinks}>
          <span style={styles.quickLabel}>Popular:</span>
          {quickLinks.map(q => (
            <button key={q} style={styles.quickChip}
              onClick={() => { onSearch(q); document.getElementById('colleges')?.scrollIntoView({ behavior: 'smooth' }); }}>
              {q}
            </button>
          ))}
        </div>

        <div style={styles.stats}>
          {[
            { num: '261', label: 'Colleges' },
            { num: '3', label: 'States' },
            { num: '50K+', label: 'Helped' },
            { num: '20+', label: 'Courses' },
          ].map(s => (
            <div key={s.label} style={styles.stat}>
              <strong style={styles.statNum}>{s.num}</strong>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles = {
  hero: {
    position: 'relative', minHeight: '100svh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', padding: 'clamp(80px, 12vw, 120px) 20px 60px',
  },
  bg: { position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0D1117 0%, #1a2a4a 50%, #0D1117 100%)', zIndex: 0 },
  bgCircle1: { position: 'absolute', top: '-100px', right: '-100px', width: 'clamp(200px,40vw,500px)', height: 'clamp(200px,40vw,500px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,71,10,0.15) 0%, transparent 70%)', zIndex: 1 },
  bgCircle2: { position: 'absolute', bottom: '-80px', left: '-80px', width: 'clamp(160px,35vw,400px)', height: 'clamp(160px,35vw,400px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,108,168,0.2) 0%, transparent 70%)', zIndex: 1 },
  content: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', maxWidth: '780px', width: '100%', gap: '18px',
  },
  badge: {
    background: 'rgba(232,71,10,0.15)', border: '1px solid rgba(232,71,10,0.4)',
    color: '#F5A623', padding: '6px 16px', borderRadius: '40px',
    fontSize: 'clamp(11px,2.5vw,13px)', fontWeight: 600, letterSpacing: '0.5px',
    animation: 'fadeUp 0.5s ease both',
  },
  heading: {
    fontFamily: 'Playfair Display, serif',
    fontSize: 'clamp(30px, 7vw, 68px)', fontWeight: 900,
    color: '#fff', lineHeight: 1.15, letterSpacing: '-1px',
    animation: 'fadeUp 0.6s ease 0.1s both',
  },
  highlight: { color: 'var(--accent)', textShadow: '0 0 40px rgba(232,71,10,0.4)' },
  sub: {
    color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(13px,2.5vw,16px)',
    lineHeight: 1.7, animation: 'fadeUp 0.6s ease 0.2s both',
    maxWidth: '560px',
  },
  searchBox: {
    display: 'flex', alignItems: 'center',
    background: '#fff', borderRadius: '12px', overflow: 'hidden',
    width: '100%', maxWidth: '560px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    border: '2px solid rgba(232,71,10,0.3)',
    animation: 'fadeUp 0.6s ease 0.3s both',
  },
  searchIcon: { padding: '0 12px', fontSize: '16px', flexShrink: 0 },
  searchInput: {
    flex: 1, padding: '14px 0', fontSize: 'clamp(13px,2vw,15px)',
    border: 'none', background: 'transparent', color: 'var(--deep)',
    fontFamily: 'DM Sans, sans-serif', minWidth: 0,
  },
  searchBtn: {
    padding: '12px 20px', background: 'var(--accent)', color: '#fff',
    border: 'none', fontWeight: 700, fontSize: 'clamp(12px,2vw,14px)',
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0,
  },
  quickLinks: {
    display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
    justifyContent: 'center', animation: 'fadeUp 0.6s ease 0.4s both',
  },
  quickLabel: { color: 'rgba(255,255,255,0.5)', fontSize: '12px' },
  quickChip: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', padding: '5px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
  },
  stats: {
    display: 'flex', gap: 'clamp(16px,4vw,40px)', marginTop: '8px',
    animation: 'fadeUp 0.6s ease 0.5s both', flexWrap: 'wrap', justifyContent: 'center',
  },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  statNum: { fontSize: 'clamp(20px,4vw,28px)', fontFamily: 'Playfair Display, serif', color: '#fff' },
  statLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' },
};