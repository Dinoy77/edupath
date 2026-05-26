import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colleges } from '../data/colleges';

const courseOptions = [
  'B.Pharm', 'M.Pharm', 'D.Pharm', 'Pharm.D',
  'BSc Nursing', 'GNM', 'ANM', 'MSc Nursing',
  'BPT (Bachelor of Physiotherapy)',
  'BSc MLT - Medical Lab Technician',
  'BSc Allied Health Sciences',
  'BSc Medical Imaging Technology',
  'BSc Clinical Psychology',
  'BHA (Bachelor of Hospital Administration)',
  'BSc Blood Banking Technology',
  'BSc Cardiac Care Technology',
  'BSc Neuroscience Technology',
  'BSc Food Science Technology',
];

const locationOptions = [
  { label: 'Kerala', icon: '🌴' },
  { label: 'Bangalore', icon: '🏙' },
  { label: 'Tamil Nadu', icon: '🏛' },
  { label: 'Any Location', icon: '🗺' },
];

const budgetOptions = [
  'Under ₹30,000/yr',
  '₹30,000 – ₹80,000/yr',
  '₹80,000 – ₹1,50,000/yr',
  'Above ₹1,50,000/yr',
];

// Filter colleges smartly before sending to AI — reduces payload size
function getFilteredColleges(course, location) {
  let filtered = colleges;

  // Filter by location
  if (location && location !== 'Any Location') {
    filtered = filtered.filter(c => c.region === location);
  }

  // Filter by course match
  if (course) {
    const courseMatched = filtered.filter(c =>
      c.courses.some(co =>
        co.toLowerCase().includes(course.toLowerCase().split(' ')[0])
      )
    );
    // If we have matches, use them; otherwise use location-filtered
    if (courseMatched.length >= 5) filtered = courseMatched;
  }

  // Send max 40 colleges to keep payload small
  return filtered.slice(0, 40).map(c => ({
    id: c.id,
    name: c.name,
    region: c.region,
    city: c.city,
    type: c.type,
    courses: c.courses.slice(0, 5),
    fees: c.fees,
    rating: c.rating,
  }));
}

export default function AIBot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const formRef = useRef({ course: '', location: '', budget: '' });
  const bottomRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [messages]);

  const addBot = (content, extra = {}) => {
    setMessages(prev => [...prev, { role: 'bot', content, id: Date.now() + Math.random(), ...extra }]);
  };

  const addUser = (content) => {
    setMessages(prev => [...prev, { role: 'user', content, id: Date.now() + Math.random() }]);
  };

  const startChat = () => {
    setOpen(true);
    if (stage === 'idle') {
      setStage('starting');
      setTimeout(() => {
        addBot("Hi there! 👋 I'm your AI College Advisor.");
        setTimeout(() => {
          addBot("I'll find the perfect college for you in 3 quick steps!");
          setTimeout(() => {
            addBot('Which course are you interested in?', { type: 'course' });
            setStage('course');
          }, 700);
        }, 700);
      }, 400);
    }
  };

  const handleCourse = (course) => {
    if (stage !== 'course') return;
    formRef.current.course = course;
    addUser(course);
    setStage('wait');
    setTimeout(() => {
      addBot('Great choice! 🎓 Where would you prefer to study?', { type: 'location' });
      setStage('location');
    }, 500);
  };

  const handleLocation = (location) => {
    if (stage !== 'location') return;
    formRef.current.location = location;
    addUser(location);
    setStage('wait');
    setTimeout(() => {
      addBot('Almost there! What is your annual fee budget?', { type: 'budget' });
      setStage('budget');
    }, 500);
  };

  const handleBudget = (budget) => {
    if (stage !== 'budget') return;
    formRef.current.budget = budget;
    addUser(budget);
    setStage('loading');
    setLoading(true);
    setTimeout(() => {
      addBot('🔍 Finding your best college matches...', { type: 'loading' });
      fetchRecommendations(budget);
    }, 500);
  };

  const fetchRecommendations = async (budget) => {
    const form = formRef.current;

    try {
      // Smart filter — only send relevant colleges
      const collegeList = getFilteredColleges(form.course, form.location);

      if (collegeList.length === 0) {
        throw new Error('No colleges found');
      }

      const prompt = `You are a college advisor for South India. A student wants:
Course: ${form.course}
Location: ${form.location}
Budget: ${budget}

From these colleges, pick the TOP 5 best matches:
${JSON.stringify(collegeList)}

Reply ONLY with valid JSON, no markdown, no explanation:
{"summary":"One sentence about why these colleges suit the student","recommendations":[{"id":1,"reason":"Why this matches","matchScore":92}]}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || 'API error');
      }

      const data = await response.json();
      const rawText = data.content?.map(b => b.text || '').join('') || '';

      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid recommendations format');
      }

      const matched = parsed.recommendations
        .map(rec => {
          const college = colleges.find(c => c.id === Number(rec.id));
          return college
            ? { ...college, reason: rec.reason, matchScore: rec.matchScore }
            : null;
        })
        .filter(Boolean)
        .slice(0, 5);

      if (matched.length === 0) throw new Error('No matches found');

      setLoading(false);
      setMessages(prev => prev.filter(m => m.type !== 'loading'));

      setTimeout(() => {
        addBot(parsed.summary || 'Here are your top college recommendations!');
        setTimeout(() => {
          addBot('🎉 Your top 5 matches — click any to view full details!', {
            type: 'results',
            colleges: matched,
          });
          setStage('done');
        }, 600);
      }, 300);

    } catch (err) {
      console.error('AI Bot error:', err);
      setLoading(false);
      setMessages(prev => prev.filter(m => m.type !== 'loading'));

      // Fallback — show top rated colleges from filter
      const fallback = getFilteredColleges(form.course, form.location)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
        .map((c, i) => {
          const college = colleges.find(col => col.id === c.id);
          return college
            ? { ...college, reason: `Highly rated ${c.type} in ${c.city} offering ${form.course}`, matchScore: 90 - i * 3 }
            : null;
        })
        .filter(Boolean);

      if (fallback.length > 0) {
        addBot("Here are our top-rated colleges matching your preferences! 🎓");
        setTimeout(() => {
          addBot('🎉 Top matches for you — click any to view full details!', {
            type: 'results',
            colleges: fallback,
          });
          setStage('done');
        }, 500);
      } else {
        addBot('⚠️ Could not find matches. Please try again.', { type: 'error' });
        setStage('budget');
      }
    }
  };

  const resetChat = () => {
    setMessages([]);
    formRef.current = { course: '', location: '', budget: '' };
    setStage('idle');
    setLoading(false);
    setTimeout(() => startChat(), 100);
  };

  const rc = (region) =>
    region === 'Kerala' ? '#1B6CA8' :
    region === 'Bangalore' ? '#7C3AED' : '#DC2626';

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => open ? setOpen(false) : startChat()}
        style={{
          ...s.fab,
          boxShadow: pulse
            ? '0 4px 24px rgba(232,71,10,0.5), 0 0 0 0 rgba(232,71,10,0.3)'
            : '0 4px 24px rgba(232,71,10,0.4)',
          animation: pulse ? 'fabPulse 2s ease-in-out infinite' : 'none',
        }}
      >
        {open
          ? <span style={{ fontSize: '20px' }}>✕</span>
          : <>
              <span style={{ fontSize: '24px' }}>🤖</span>
              <span style={s.fabText}>AI Match</span>
              <span style={s.fabOnline} />
            </>
        }
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div style={s.window}>

          {/* Header */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.avatar}>🤖</div>
              <div>
                <p style={s.headerName}>EduPath AI Advisor</p>
                <p style={s.headerStatus}>
                  <span style={s.greenDot} /> Online · Powered by Claude AI
                </p>
              </div>
            </div>
            <button style={s.headerClose} onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div style={s.msgList}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...s.msgRow,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                }}
              >
                {msg.role === 'bot' && <div style={s.msgAvatar}>🤖</div>}

                <div style={{
                  ...s.bubble,
                  ...(msg.role === 'user' ? s.userBubble : s.botBubble),
                  maxWidth: msg.type === 'results' ? '100%' : '85%',
                }}>

                  {/* Plain text */}
                  {(!msg.type || msg.type === 'error') && (
                    <p style={s.bubbleText}>{msg.content}</p>
                  )}

                  {/* Loading */}
                  {msg.type === 'loading' && (
                    <div>
                      <p style={s.bubbleText}>{msg.content}</p>
                      <div style={s.dotsWrap}>
                        <span style={{ ...s.dot, animationDelay: '0s' }} />
                        <span style={{ ...s.dot, animationDelay: '0.2s' }} />
                        <span style={{ ...s.dot, animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}

                  {/* Course chips */}
                  {msg.type === 'course' && stage === 'course' && (
                    <div>
                      <p style={{ ...s.bubbleText, marginBottom: '10px' }}>{msg.content}</p>
                      <div style={s.chipGrid}>
                        {courseOptions.map(c => (
                          <button key={c} style={s.chip}
                            onMouseEnter={e => e.currentTarget.style.background = '#FFF4EE'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            onClick={() => handleCourse(c)}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location chips */}
                  {msg.type === 'location' && stage === 'location' && (
                    <div>
                      <p style={{ ...s.bubbleText, marginBottom: '10px' }}>{msg.content}</p>
                      <div style={s.colChips}>
                        {locationOptions.map(l => (
                          <button key={l.label} style={s.colChip}
                            onMouseEnter={e => e.currentTarget.style.background = '#FFF4EE'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            onClick={() => handleLocation(l.label)}>
                            {l.icon} {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Budget chips */}
                  {msg.type === 'budget' && stage === 'budget' && (
                    <div>
                      <p style={{ ...s.bubbleText, marginBottom: '10px' }}>{msg.content}</p>
                      <div style={s.colChips}>
                        {budgetOptions.map(b => (
                          <button key={b} style={s.colChip}
                            onMouseEnter={e => e.currentTarget.style.background = '#FFF4EE'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            onClick={() => handleBudget(b)}>
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {msg.type === 'results' && (
                    <div>
                      <p style={{ ...s.bubbleText, marginBottom: '10px' }}>{msg.content}</p>
                      <div style={s.resultList}>
                        {msg.colleges.map((col, idx) => (
                          <div
                            key={col.id}
                            style={s.resultCard}
                            onClick={() => { navigate(`/college/${col.id}`); setOpen(false); }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = rc(col.region); e.currentTarget.style.background = '#FAFAFA'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff'; }}
                          >
                            <div style={s.resultTop}>
                              <span style={{
                                ...s.rankBadge,
                                background: idx === 0 ? '#F5A623' : idx === 1 ? '#9CA3AF' : idx === 2 ? '#CD7C2F' : '#E5E7EB',
                                color: idx < 3 ? '#fff' : '#6B7280',
                              }}>#{idx + 1}</span>
                              <div style={s.resultInfo}>
                                <p style={s.resultName}>{col.name}</p>
                                <p style={s.resultCity}>📍 {col.city}, {col.region}</p>
                              </div>
                              <span style={{ ...s.matchPill, background: rc(col.region) }}>
                                {col.matchScore}%
                              </span>
                            </div>
                            <p style={s.resultReason}>💡 {col.reason}</p>
                            <div style={s.resultFoot}>
                              <span style={s.metaTag}>⭐ {col.rating}</span>
                              <span style={s.metaTag}>{col.fees}</span>
                              <span style={{ ...s.metaTag, marginLeft: 'auto', color: rc(col.region), fontWeight: 700 }}>
                                View →
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button style={s.resetBtn} onClick={resetChat}>🔄 Search Again</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(232,71,10,0.5), 0 0 0 0 rgba(232,71,10,0.3); }
          50% { box-shadow: 0 4px 24px rgba(232,71,10,0.5), 0 0 0 14px rgba(232,71,10,0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

const s = {
  fab: {
    position: 'fixed', bottom: '28px', right: '28px', zIndex: 5000,
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: '50px', padding: '12px 18px 12px 12px',
    display: 'flex', alignItems: 'center', gap: '8px',
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    transition: 'transform 0.2s',
  },
  fabText: { fontSize: '14px', fontWeight: 700 },
  fabOnline: {
    position: 'absolute', top: '6px', right: '6px',
    width: '10px', height: '10px', borderRadius: '50%',
    background: '#4ADE80', border: '2px solid #fff',
  },

  window: {
    position: 'fixed', bottom: '90px', right: '28px', zIndex: 4999,
    width: 'min(400px, calc(100vw - 32px))',
    height: 'min(580px, calc(100vh - 130px))',
    background: '#fff', borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    animation: 'fadeUp 0.3s ease both',
  },

  header: {
    background: 'linear-gradient(135deg, #0D1117 0%, #1a2a4a 100%)',
    padding: '14px 16px', flexShrink: 0,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '38px', height: '38px', borderRadius: '50%',
    background: 'rgba(232,71,10,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
  },
  headerName: { fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 },
  headerStatus: { fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '5px' },
  greenDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' },
  headerClose: {
    background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
    width: '28px', height: '28px', borderRadius: '50%',
    cursor: 'pointer', fontSize: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  msgList: {
    flex: 1, overflowY: 'auto', padding: '14px 12px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  msgRow: { display: 'flex', gap: '7px' },
  msgAvatar: {
    width: '26px', height: '26px', borderRadius: '50%',
    background: '#FFF4EE', fontSize: '13px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bubble: { borderRadius: '16px', padding: '10px 13px' },
  botBubble: { background: '#F3F4F6', borderBottomLeftRadius: '4px' },
  userBubble: { background: 'var(--accent)', color: '#fff', borderBottomRightRadius: '4px' },
  bubbleText: { fontSize: '13px', lineHeight: 1.55, margin: 0 },

  dotsWrap: { display: 'flex', gap: '4px', marginTop: '6px' },
  dot: {
    width: '7px', height: '7px', borderRadius: '50%',
    background: 'var(--accent)', display: 'inline-block',
    animation: 'dotBounce 1.2s ease-in-out infinite',
  },

  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '150px', overflowY: 'auto' },
  chip: {
    padding: '5px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
    background: '#fff', border: '1.5px solid var(--border)',
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--deep)',
    transition: 'background 0.15s',
  },

  colChips: { display: 'flex', flexDirection: 'column', gap: '6px' },
  colChip: {
    padding: '9px 13px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    background: '#fff', border: '1.5px solid var(--border)',
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    textAlign: 'left', color: 'var(--deep)', transition: 'background 0.15s',
  },

  resultList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' },
  resultCard: {
    background: '#fff', border: '1.5px solid #E5E7EB',
    borderRadius: '12px', padding: '10px',
    cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
  },
  resultTop: { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '5px' },
  rankBadge: {
    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: 800,
  },
  resultInfo: { flex: 1, minWidth: 0 },
  resultName: { fontSize: '12px', fontWeight: 700, margin: '0 0 2px', lineHeight: 1.3 },
  resultCity: { fontSize: '11px', color: 'var(--muted)', margin: 0 },
  matchPill: {
    color: '#fff', fontSize: '11px', fontWeight: 800,
    padding: '2px 8px', borderRadius: '12px', flexShrink: 0,
  },
  resultReason: { fontSize: '11px', color: '#4B5563', margin: '0 0 7px', lineHeight: 1.4 },
  resultFoot: {
    display: 'flex', gap: '6px', alignItems: 'center',
    flexWrap: 'wrap', paddingTop: '7px',
    borderTop: '1px solid #F3F4F6',
  },
  metaTag: {
    fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
    background: '#F3F4F6', color: '#374151', fontWeight: 500,
  },
  resetBtn: {
    width: '100%', padding: '10px', borderRadius: '10px',
    background: 'var(--deep)', color: '#fff',
    border: 'none', cursor: 'pointer', fontWeight: 700,
    fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
  },
};