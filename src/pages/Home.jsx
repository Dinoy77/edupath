import React, { useState, useMemo, useEffect } from 'react';
import Hero from '../components/Hero';
import RegionSection from '../components/RegionSection';
import CollegeCard from '../components/CollegeCard';
import Footer from '../components/Footer';
import { colleges, regions, courseFilters, typeFilters } from '../data/colleges';

export default function Home({ selectedCourse }) {
  const [activeRegion, setActiveRegion] = useState('All');
  const [activeCourse, setActiveCourse] = useState('All Courses');

  useEffect(() => {
    if (selectedCourse && selectedCourse !== activeCourse) {
      setActiveCourse(selectedCourse);
    }
  }, [selectedCourse]);
  const [activeType, setActiveType] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const handler = (e) => {
      setActiveCourse(e.detail);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.getElementById('colleges')?.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('courseFilter', handler);
    return () => window.removeEventListener('courseFilter', handler);
  }, []);
  const [sortBy, setSortBy] = useState('rating');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = colleges;
    if (activeRegion !== 'All') result = result.filter(c => c.region === activeRegion);
    if (activeCourse !== 'All Courses') result = result.filter(c => c.courses.some(course => course.toLowerCase().includes(activeCourse.toLowerCase())));
    if (activeType !== 'All Types') result = result.filter(c => c.type.toLowerCase().includes(activeType.toLowerCase().replace('all types', '')));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.district?.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q) ||
        c.courses.some(course => course.toLowerCase().includes(q)) ||
        c.type.toLowerCase().includes(q) ||
        c.approval?.toLowerCase().includes(q) ||
        c.affiliation?.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return [...result].sort((a, b) =>
      sortBy === 'rating' ? b.rating - a.rating :
        sortBy === 'reviews' ? b.reviews - a.reviews :
          a.name.localeCompare(b.name)
    );
  }, [activeRegion, activeCourse, activeType, searchQuery, sortBy]);

  const resetAll = () => {
    setActiveRegion('All');
    setActiveCourse('All Courses');
    setActiveType('All Types');
    setSearchQuery('');
  };

  return (
    <div>
      <Hero onSearch={setSearchQuery} />
      <RegionSection activeRegion={activeRegion} onRegionChange={setActiveRegion} />

      <section id="colleges" style={styles.section}>
        {/* Header row */}
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              {activeRegion === 'All' ? 'All Colleges' : `${activeRegion} Colleges`}
            </h2>
            <p style={styles.sectionSub}>{filtered.length} colleges found</p>
          </div>
          <div style={styles.headerRight}>
            <select style={styles.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="rating">Sort: Rating</option>
              <option value="reviews">Sort: Reviews</option>
              <option value="name">Sort: A-Z</option>
            </select>
            {/* Mobile filter toggle */}
            <button style={styles.filterToggle} className="hide-desktop" onClick={() => setFiltersOpen(!filtersOpen)}>
              {filtersOpen ? '✕ Close' : '⚙ Filters'}
            </button>
          </div>
        </div>

        {/* Filters — always visible on desktop, toggled on mobile */}
        <div style={{ ...styles.filters, display: filtersOpen ? 'flex' : undefined }}
          className="hide-mobile">
          <FilterGroup label="Region" items={regions} active={activeRegion} onSelect={setActiveRegion} activeColor="var(--deep)" />
          <FilterGroup label="Course" items={courseFilters} active={activeCourse} onSelect={setActiveCourse} activeColor="var(--accent)" />
          <FilterGroup label="Type" items={typeFilters} active={activeType} onSelect={setActiveType} activeColor="#7C3AED" />
        </div>

        {/* Mobile filters drawer */}
        {filtersOpen && (
          <div style={{ ...styles.filters, marginBottom: '16px' }} className="hide-desktop">
            <FilterGroup label="Region" items={regions} active={activeRegion} onSelect={v => { setActiveRegion(v); }} activeColor="var(--deep)" />
            <FilterGroup label="Course" items={courseFilters} active={activeCourse} onSelect={setActiveCourse} activeColor="var(--accent)" />
            <FilterGroup label="Type" items={typeFilters} active={activeType} onSelect={setActiveType} activeColor="#7C3AED" />
          </div>
        )}

        {filtered.length > 0 ? (
          <div style={styles.grid}>
            {filtered.map((college, i) => (
              <CollegeCard key={college.id} college={college} delay={Math.min(i * 60, 400)} />
            ))}
          </div>
        ) : (
          <div style={styles.empty}>
            <div style={{ fontSize: '48px' }}>🔍</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px' }}>No colleges found</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Try adjusting your filters or search</p>
            <button style={styles.resetBtn} onClick={resetAll}>Reset All Filters</button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function FilterGroup({ label, items, active, onSelect, activeColor }) {
  return (
    <div style={fg.group}>
      <span style={fg.label}>{label}:</span>
      <div style={fg.chips}>
        {items.map(item => (
          <button key={item} style={{
            ...fg.chip,
            background: active === item ? activeColor : '#fff',
            color: active === item ? '#fff' : 'var(--muted)',
            borderColor: active === item ? activeColor : 'var(--border)',
          }} onClick={() => onSelect(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

const fg = {
  group: { display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' },
  label: { fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', paddingTop: '6px', minWidth: '52px' },
  chips: { display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 },
  chip: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1.5px solid', cursor: 'pointer', transition: 'all 0.2s' },
};

const styles = {
  section: { padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px) 60px', maxWidth: '1200px', margin: '0 auto' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
  sectionTitle: { fontFamily: 'Playfair Display, serif', fontSize: 'clamp(22px,4vw,32px)' },
  sectionSub: { color: 'var(--muted)', fontSize: '13px', marginTop: '4px' },
  headerRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', background: '#fff', cursor: 'pointer' },
  filterToggle: { padding: '8px 14px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', fontWeight: 600, background: '#fff', cursor: 'pointer' },
  filters: { display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff', borderRadius: '12px', padding: 'clamp(14px,2vw,20px)', border: '1px solid var(--border)', marginBottom: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 'clamp(14px,2vw,24px)' },
  empty: { textAlign: 'center', padding: '60px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  resetBtn: { padding: '11px 26px', borderRadius: '10px', fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', marginTop: '8px' },
};