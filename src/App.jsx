import React, { useState, useEffect } from 'react';
import { Star, MapPin, Search, X, Send, Loader2, ChevronRight } from 'lucide-react';
import './App.css';

const CAMPUSES = ['College Ave', 'Busch', 'Livingston', 'Cook/Douglass'];
const RU_RED = '#CC0033';

const CAMPUS_IMAGES = {
  'College Ave': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Rutgers_spelled_out_in_hedge_on_College_Ave_campus_New_Brunswick_NJ.JPG',
  'Busch': 'https://commons.wikimedia.org/wiki/Special:FilePath/Rutgers_University_Visitors_Center_Busch_campus.JPG',
  'Livingston': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Rutgers_University_Livingston_campus_building_with_flags.JPG',
  'Cook/Douglass': 'https://commons.wikimedia.org/wiki/Special:FilePath/2021-05-24_15_18_33_Front_view_of_Voorhees_Chapel_on_the_Douglass_College_campus_of_Rutgers_University_in_New_Brunswick,_Middlesex_County,_New_Jersey.jpg',
};

const TAGS = [
  { key: 'no_tp', label: 'No toilet paper' },
  { key: 'not_flushed', label: 'Not flushed' },
  { key: 'out_of_soap', label: 'No soap' },
  { key: 'broken_lock', label: 'Broken lock' },
  { key: 'long_wait', label: 'Long wait' },
  { key: 'good_vibes', label: 'Great bathroom' },
  { key: 'hidden_gem', label: 'Hidden gem' },
];

const DETAIL_FIELDS = [
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'occupancy', label: 'Occupancy' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'smell', label: 'Smell' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'all-gender', label: 'All-gender' },
];

const GENDER_COLORS = { male: '#2563eb', female: '#db2777', 'all-gender': '#7c3aed' };

export default function App() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCampus, setActiveCampus] = useState('College Ave');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalToilet, setModalToilet] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // New review fields
  const [newGender, setNewGender] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [newDetailedRatings, setNewDetailedRatings] = useState({ cleanliness: null, occupancy: null, stall_count: null, privacy: null, smell: null });
  const [newTags, setNewTags] = useState([]);
  const [hoveredDetailRating, setHoveredDetailRating] = useState({});
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reqBuilding, setReqBuilding] = useState('');
  const [reqCampus, setReqCampus] = useState('College Ave');
  const [reqFloor, setReqFloor] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSubmitted, setReqSubmitted] = useState(false);

  const fetchToilets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/toilets`);
      setToilets(await res.json() || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchToilets(); }, []);

  const resetForm = () => {
    setNewRating(0);
    setHoveredRating(0);
    setNewComment('');
    setNewGender('');
    setNewFloor('');
    setNewDetailedRatings({ cleanliness: null, occupancy: null, stall_count: null, privacy: null, smell: null });
    setNewTags([]);
    setHoveredDetailRating({});
  };

  const openModal = async (toilet) => {
    setModalToilet(toilet);
    resetForm();
    setReviewsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${toilet.id}`);
      setReviews(await res.json());
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const closeModal = () => {
    setModalToilet(null);
    setReviews([]);
    resetForm();
  };

  const toggleTag = (key) => {
    setNewTags(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || newRating === 0) return;
    setSubmitting(true);
    try {
      const hasDetailedRatings = Object.values(newDetailedRatings).some(v => v !== null);
      const body = {
        toilet_id: modalToilet.id,
        comment: newComment,
        stars: newRating,
        tags: newTags,
        ...(hasDetailedRatings && { detailed_ratings: newDetailedRatings }),
        ...(newGender && { gender: newGender }),
        ...(newFloor.trim() && { floor: newFloor.trim() }),
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const [rRes, tRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${modalToilet.id}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/toilets`),
        ]);
        const updatedReviews = await rRes.json();
        const updatedToilets = await tRes.json();
        setReviews(updatedReviews);
        setToilets(updatedToilets);
        setModalToilet(updatedToilets.find(t => t.id === modalToilet.id) || modalToilet);
        resetForm();
      }
    } catch {
      alert('Submission failed. Please make sure the backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredToilets = toilets.filter(t => {
    const matchCampus = t.campus && t.campus.toLowerCase().includes(activeCampus.split(' ')[0].toLowerCase());
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCampus && matchSearch;
  });

  const StarRow = ({ rating, size = 14 }) => {
    const filled = Math.round(parseFloat(rating) || 0);
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <Star key={n} size={size}
            fill={n <= filled ? RU_RED : 'none'}
            color={n <= filled ? RU_RED : '#d1d5db'}
          />
        ))}
      </div>
    );
  };

  const ratingLabel = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  const DetailStarPicker = ({ field }) => {
    const current = newDetailedRatings[field];
    const hovered = hoveredDetailRating[field] || 0;
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n}
            onClick={() => setNewDetailedRatings(prev => ({ ...prev, [field]: n === current ? null : n }))}
            onMouseEnter={() => setHoveredDetailRating(prev => ({ ...prev, [field]: n }))}
            onMouseLeave={() => setHoveredDetailRating(prev => ({ ...prev, [field]: 0 }))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1 }}>
            <Star size={18}
              fill={n <= (hovered || current || 0) ? RU_RED : 'none'}
              color={n <= (hovered || current || 0) ? RU_RED : '#ddd'}
            />
          </button>
        ))}
      </div>
    );
  };

  const GenderBadge = ({ gender, light = false }) => {
    if (!gender) return null;
    const label = gender === 'all-gender' ? 'All-gender' : gender === 'male' ? 'Male' : 'Female';
    const color = GENDER_COLORS[gender];
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
        backgroundColor: light ? 'rgba(255,255,255,0.2)' : color + '18',
        color: light ? '#fff' : color,
        border: `1px solid ${light ? 'rgba(255,255,255,0.3)' : color + '40'}`,
      }}>{label}</span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif' }}>

      {/* ── TOP UTILITY BAR ── */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '6px 0' }}>
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Rutgers University · Campus Bathroom Reviews
          </span>
          <span style={{ color: '#888', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Rate · Review · Share
          </span>
        </div>
      </div>

      {/* ── HEADER ── */}
      <header style={{ backgroundColor: '#fff', borderBottom: '3px solid #e5e5e5' }}>
        <div className="ru-header-inner" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: RU_RED, letterSpacing: -1, lineHeight: 1 }}>RU FLUSH</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>Rutgers Bathroom Reviews</div>
            </div>
          </div>
          <nav className="ru-nav" style={{ display: 'flex', gap: 4 }}>
            <button className="ru-request-btn" onClick={() => { setRequestModalOpen(true); setReqSubmitted(false); setReqBuilding(''); setReqFloor(''); setReqNote(''); }}
              style={{
                padding: '10px 16px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: 0.5, border: '2px solid #2a2a2a', cursor: 'pointer',
                backgroundColor: '#fff', color: '#2a2a2a', borderRadius: 4, transition: 'all 0.15s', marginRight: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2a2a2a'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#2a2a2a'; }}
            >+ Request Building</button>
            {CAMPUSES.map(campus => (
              <button key={campus} onClick={() => setActiveCampus(campus)}
                style={{
                  padding: '10px 16px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 0.5, border: 'none', cursor: 'pointer',
                  backgroundColor: activeCampus === campus ? RU_RED : '#2a2a2a',
                  color: '#fff', borderRadius: 4, transition: 'background-color 0.15s',
                }}
              >{campus}</button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="ru-hero" style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <img key={activeCampus} src={CAMPUS_IMAGES[activeCampus]} alt={`${activeCampus} campus`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
        <div className="ru-hero-text" style={{ position: 'absolute', top: '50%', left: 48, transform: 'translateY(-50%)' }}>
          <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 900, margin: 0, lineHeight: 1.15 }}>
            {activeCampus} Campus<br />Bathroom Reviews
          </h2>
          <p style={{ color: '#ddd', fontSize: 14, marginTop: 10, marginBottom: 20, fontWeight: 400 }}>
            Find and rate the best (and worst) bathrooms on campus.
          </p>
          <button onClick={() => filteredToilets[0] && openModal(filteredToilets[0])}
            style={{ backgroundColor: RU_RED, color: '#fff', border: 'none', padding: '10px 22px', fontSize: 13, fontWeight: 800, borderRadius: 4, cursor: 'pointer', letterSpacing: 0.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✏ Post a Review
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ backgroundColor: RU_RED, padding: '16px 0' }}>
        <div className="ru-search-inner" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} /> Search Bathrooms
          </span>
          <input type="text" placeholder="Building name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '9px 14px', fontSize: 13, border: 'none', borderRadius: 3, outline: 'none', fontWeight: 500 }} />
          <select value={activeCampus} onChange={e => setActiveCampus(e.target.value)}
            style={{ padding: '9px 14px', fontSize: 13, border: 'none', borderRadius: 3, outline: 'none', fontWeight: 600, cursor: 'pointer' }}>
            {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none', padding: '9px 22px', fontSize: 13, fontWeight: 800, borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Search
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="ru-main-grid" style={{ maxWidth: '100%', margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* Left: Bathroom list */}
        <div>
          <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2, borderRadius: '4px 4px 0 0' }}>
            🚻 {activeCampus} Campus — {filteredToilets.length} Bathroom{filteredToilets.length !== 1 ? 's' : ''}
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Loader2 style={{ color: RU_RED, animation: 'spin 1s linear infinite' }} size={32} />
              </div>
            ) : filteredToilets.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#aaa', fontWeight: 600 }}>No bathrooms found.</div>
            ) : (
              filteredToilets.map((toilet, i) => (
                <div key={toilet.id}>
                  {i > 0 && <div style={{ borderTop: '1px solid #f0f0f0' }} />}
                  <div className="ru-toilet-item" style={{ display: 'flex', gap: 0, padding: 16, alignItems: 'flex-start', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: 32, textAlign: 'center', paddingTop: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: i < 3 ? RU_RED : '#ccc' }}>{i + 1}</span>
                    </div>
                    <div className="ru-toilet-photo" style={{ width: 130, height: 90, flexShrink: 0, borderRadius: 4, overflow: 'hidden', backgroundColor: '#eee' }}>
                      <img src={toilet.photo_url || 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?q=80&w=400'} alt={toilet.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, paddingLeft: 16 }}>
                      <a style={{ fontSize: 16, fontWeight: 800, color: RU_RED, cursor: 'pointer', textDecoration: 'none', display: 'block', marginBottom: 4 }}
                        onClick={() => openModal(toilet)}>{toilet.name}</a>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} color={RU_RED} /> {toilet.campus}
                        </div>
                        {toilet.genders && toilet.genders.map(g => <GenderBadge key={g} gender={g} />)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StarRow rating={toilet.avg_rating} size={14} />
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#333' }}>
                          {parseFloat(toilet.avg_rating) > 0 ? toilet.avg_rating : '—'}
                        </span>
                        <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>
                          {toilet.review_count > 0 ? `${toilet.review_count} review${toilet.review_count > 1 ? 's' : ''}` : 'No reviews yet'}
                        </span>
                      </div>
                      {toilet.avg_detailed_ratings && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 6 }}>
                          {DETAIL_FIELDS.map(({ key, label }) => {
                            const val = toilet.avg_detailed_ratings[key];
                            if (val === null) return null;
                            return (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>{label}</span>
                                <StarRow rating={val} size={10} />
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#666' }}>{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {toilet.top_tags && toilet.top_tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                          {toilet.top_tags.map(tag => {
                            const tagDef = TAGS.find(t => t.key === tag);
                            const isPositive = tag === 'good_vibes' || tag === 'hidden_gem';
                            return (
                              <span key={tag} style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                                backgroundColor: isPositive ? '#dcfce7' : '#fef2f2',
                                color: isPositive ? '#166534' : '#991b1b',
                                border: `1px solid ${isPositive ? '#bbf7d0' : '#fecaca'}`,
                              }}>{tagDef ? tagDef.label : tag}</span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="ru-reviews-btn" style={{ flexShrink: 0, paddingLeft: 12, display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => openModal(toilet)}
                        style={{ backgroundColor: RU_RED, color: '#fff', border: 'none', padding: '8px 16px', fontSize: 12, fontWeight: 800, borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                        Reviews <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ backgroundColor: RU_RED, color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, borderRadius: '4px 4px 0 0' }}>
              ✏ Rate a Bathroom
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderTop: 'none', padding: 16, borderRadius: '0 0 4px 4px' }}>
              <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.5 }}>
                Help fellow Rutgers students find the cleanest bathrooms on campus.
              </p>
              <button onClick={() => filteredToilets[0] && openModal(filteredToilets[0])}
                style={{ width: '100%', backgroundColor: RU_RED, color: '#fff', border: 'none', padding: '10px', fontSize: 12, fontWeight: 800, borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Post Your Review
              </button>
            </div>
          </div>

          {toilets.filter(t => parseFloat(t.avg_rating) > 0).length > 0 && (
            <div>
              <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, borderRadius: '4px 4px 0 0' }}>
                🏅 Top Rated
              </div>
              <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
                {[...toilets]
                  .filter(t => parseFloat(t.avg_rating) > 0)
                  .sort((a, b) => parseFloat(b.avg_rating) - parseFloat(a.avg_rating))
                  .slice(0, 4)
                  .map((t, i) => (
                    <div key={t.id}
                      style={{ display: 'flex', gap: 10, padding: '10px 14px', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => openModal(t)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontSize: 13, fontWeight: 900, color: RU_RED, width: 18, flexShrink: 0 }}>#{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{t.campus}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: RU_RED, flexShrink: 0 }}>{t.avg_rating}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {toilets.filter(t => parseFloat(t.avg_rating) > 0).length > 0 && (
            <div>
              <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, borderRadius: '4px 4px 0 0' }}>
                💩 Worst Rated
              </div>
              <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
                {[...toilets]
                  .filter(t => parseFloat(t.avg_rating) > 0)
                  .sort((a, b) => parseFloat(a.avg_rating) - parseFloat(b.avg_rating))
                  .slice(0, 4)
                  .map((t, i) => (
                    <div key={t.id}
                      style={{ display: 'flex', gap: 10, padding: '10px 14px', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => openModal(t)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#888', width: 18, flexShrink: 0 }}>#{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{t.campus}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#888', flexShrink: 0 }}>{t.avg_rating}</span>
                    </div>
                  ))}
            </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {modalToilet && (
        <div
          onClick={e => e.target === e.currentTarget && closeModal()}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: 560, borderRadius: 6, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

            {/* Modal header — fixed */}
            <div style={{ backgroundColor: RU_RED, padding: '14px 20px', borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>{modalToilet.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} /> {modalToilet.floor} · {modalToilet.campus}
                  </div>
                  {modalToilet.genders && modalToilet.genders.map(g => <GenderBadge key={g} gender={g} light />)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <StarRow rating={modalToilet.avg_rating} size={14} />
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>
                    {parseFloat(modalToilet.avg_rating) > 0 ? modalToilet.avg_rating : '—'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
                    · {modalToilet.review_count || 0} review{modalToilet.review_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body — reviews + write form */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

              {/* ── STATS SUMMARY ── */}
              {(() => {
                const detailAvgs = DETAIL_FIELDS.reduce((acc, { key }) => {
                  const vals = reviews.map(r => r.detailed_ratings?.[key]).filter(v => v !== null && v !== undefined);
                  acc[key] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
                  return acc;
                }, {});
                const tagCounts = {};
                reviews.forEach(r => (r.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
                const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
                const hasAnyDetail = Object.values(detailAvgs).some(v => v !== null);
                if (!hasAnyDetail && topTags.length === 0) return null;
                return (
                  <>
                    <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '6px 16px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                      📊 Bathroom Stats
                    </div>
                    <div style={{ padding: '12px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                      {hasAnyDetail && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: topTags.length > 0 ? 10 : 0 }}>
                          {DETAIL_FIELDS.map(({ key, label }) => {
                            const avg = detailAvgs[key];
                            if (avg === null) return null;
                            return (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: '#888', fontWeight: 600, width: 72, flexShrink: 0 }}>{label}</span>
                                <StarRow rating={avg} size={11} />
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#555' }}>{avg}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {topTags.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Top tags:</span>
                          {topTags.map(([tag, count]) => {
                            const tagDef = TAGS.find(t => t.key === tag);
                            const isPositive = tag === 'good_vibes' || tag === 'hidden_gem';
                            return (
                              <span key={tag} style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                                backgroundColor: isPositive ? '#dcfce7' : '#fef2f2',
                                color: isPositive ? '#166534' : '#991b1b',
                                border: `1px solid ${isPositive ? '#bbf7d0' : '#fecaca'}`,
                              }}>{tagDef ? tagDef.label : tag} ×{count}</span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Reviews section */}
              <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '6px 16px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                💬 Reviews ({reviews.length})
              </div>
              <div style={{ padding: 16 }}>
                {reviewsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                    <Loader2 size={24} style={{ color: '#ccc' }} />
                  </div>
                ) : reviews.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#bbb', fontWeight: 600, padding: '24px 0', fontSize: 13 }}>
                    No reviews yet — be the first!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reviews.map(r => {
                      const likedKey = `liked_review_${r.id}`;
                      const hasLiked = localStorage.getItem(likedKey) === '1';
                      const handleLike = async () => {
                        if (hasLiked) return;
                        localStorage.setItem(likedKey, '1');
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${r.id}/like`, { method: 'POST' });
                        if (res.ok) {
                          const { likes } = await res.json();
                          setReviews(prev => prev.map(rv => rv.id === r.id ? { ...rv, likes } : rv));
                        }
                      };
                      return (
                        <div key={r.id} style={{ border: '1px solid #ebebeb', borderRadius: 4, padding: 12, backgroundColor: '#fafafa' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: (r.gender || r.floor) ? 4 : 6 }}>
                            <StarRow rating={r.stars} size={13} />
                            <span style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>
                              {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {r.gender && <GenderBadge gender={r.gender} />}
                            {r.floor && (
                              <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>
                                Floor {r.floor}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.55, fontWeight: 500 }}>
                            {r.comment}
                          </p>
                          {r.tags && r.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                              {r.tags.map(tag => {
                                const tagDef = TAGS.find(t => t.key === tag);
                                const isPositive = tag === 'good_vibes' || tag === 'hidden_gem';
                                return (
                                  <span key={tag} style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                                    backgroundColor: isPositive ? '#dcfce7' : '#fef2f2',
                                    color: isPositive ? '#166534' : '#991b1b',
                                    border: `1px solid ${isPositive ? '#bbf7d0' : '#fecaca'}`,
                                  }}>{tagDef ? tagDef.label : tag}</span>
                                );
                              })}
                            </div>
                          )}
                          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleLike}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                border: `1px solid ${hasLiked ? '#fca5a5' : '#e0e0e0'}`,
                                backgroundColor: hasLiked ? '#fef2f2' : '#fff',
                                color: hasLiked ? RU_RED : '#aaa',
                                cursor: hasLiked ? 'default' : 'pointer',
                                transition: 'all 0.15s',
                              }}>
                              👍 {r.likes > 0 ? r.likes : ''}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Write review section */}
              <div style={{ borderTop: '2px solid #e0e0e0' }}>
                <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '6px 16px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                  ✏ Write a Review
                </div>
                <div style={{ padding: 16 }}>

                  {/* Overall star picker */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Overall Rating *</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setNewRating(n)}
                          onMouseEnter={() => setHoveredRating(n)}
                          onMouseLeave={() => setHoveredRating(0)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                          <Star size={28}
                            fill={n <= (hoveredRating || newRating) ? RU_RED : 'none'}
                            color={n <= (hoveredRating || newRating) ? RU_RED : '#ddd'}
                          />
                        </button>
                      ))}
                      {(hoveredRating || newRating) > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#555', marginLeft: 4 }}>
                          {ratingLabel[hoveredRating || newRating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Your Review *</div>
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                      placeholder="Share your experience..."
                      style={{ width: '100%', height: 80, padding: 10, fontSize: 13, border: '1px solid #ddd', borderRadius: 4, resize: 'none', outline: 'none', fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Gender + Floor */}
                  <div className="ru-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Bathroom Gender</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {GENDER_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => setNewGender(newGender === opt.value ? '' : opt.value)}
                            style={{
                              flex: 1, fontSize: 10, fontWeight: 700, padding: '5px 2px', borderRadius: 4, cursor: 'pointer',
                              border: `1px solid ${newGender === opt.value ? GENDER_COLORS[opt.value] : '#ddd'}`,
                              backgroundColor: newGender === opt.value ? GENDER_COLORS[opt.value] + '15' : '#fff',
                              color: newGender === opt.value ? GENDER_COLORS[opt.value] : '#888',
                            }}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Floor / Area</div>
                      <input type="text" placeholder="e.g. 1st Floor, Basement..."
                        value={newFloor} onChange={e => setNewFloor(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Detailed ratings */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Detailed Ratings <span style={{ color: '#aaa', fontWeight: 500, textTransform: 'none' }}>(optional)</span></div>
                    <div className="ru-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                      {DETAIL_FIELDS.map(({ key, label }) => (
                        <div key={key}>
                          <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                          <DetailStarPicker field={key} />
                        </div>
                      ))}
                      <div>
                        <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 3 }}>Stall Count</div>
                        <input type="number" min={1} max={20} placeholder="# of stalls"
                          value={newDetailedRatings.stall_count ?? ''}
                          onChange={e => setNewDetailedRatings(prev => ({ ...prev, stall_count: e.target.value ? parseInt(e.target.value) : null }))}
                          style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Quick Tags <span style={{ color: '#aaa', fontWeight: 500, textTransform: 'none' }}>(optional)</span></div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {TAGS.map(tag => {
                        const selected = newTags.includes(tag.key);
                        const isPositive = tag.key === 'good_vibes' || tag.key === 'hidden_gem';
                        const activeColor = isPositive ? '#16a34a' : RU_RED;
                        return (
                          <button key={tag.key} onClick={() => toggleTag(tag.key)}
                            style={{
                              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                              border: `1px solid ${selected ? activeColor : '#ddd'}`,
                              backgroundColor: selected ? (isPositive ? '#dcfce7' : '#fff1f2') : '#f9f9f9',
                              color: selected ? activeColor : '#888',
                              transition: 'all 0.1s',
                            }}>{tag.label}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit */}
                  <button onClick={handleSubmit}
                    disabled={submitting || newRating === 0 || !newComment.trim()}
                    style={{ width: '100%', backgroundColor: newRating > 0 && newComment.trim() ? RU_RED : '#ccc', color: '#fff', border: 'none', padding: '11px', fontSize: 13, fontWeight: 800, borderRadius: 4, cursor: newRating > 0 && newComment.trim() ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background-color 0.15s' }}>
                    {submitting ? <Loader2 size={15} /> : <Send size={15} />}
                    Submit Review
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── REQUEST MODAL ── */}
      {requestModalOpen && (
        <div onClick={e => e.target === e.currentTarget && setRequestModalOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: 440, borderRadius: 6, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ backgroundColor: '#2a2a2a', padding: '14px 20px', borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>Request a Building</div>
              <button onClick={() => setRequestModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {reqSubmitted ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#222', marginBottom: 6 }}>Request Submitted!</div>
                  <div style={{ fontSize: 13, color: '#888' }}>We'll review your request and add the building soon.</div>
                  <button onClick={() => setRequestModalOpen(false)}
                    style={{ marginTop: 20, backgroundColor: '#2a2a2a', color: '#fff', border: 'none', padding: '9px 24px', fontSize: 12, fontWeight: 800, borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase' }}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Building Name *</div>
                    <input type="text" placeholder="e.g. Hill Center, Livingston Student Center..."
                      value={reqBuilding} onChange={e => setReqBuilding(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #ddd', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Campus *</div>
                    <select value={reqCampus} onChange={e => setReqCampus(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #ddd', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}>
                      {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Additional Notes</div>
                    <textarea value={reqNote} onChange={e => setReqNote(e.target.value)}
                      placeholder="Any extra info (location details, why it should be added...)"
                      style={{ width: '100%', height: 72, padding: '8px 12px', fontSize: 13, border: '1px solid #ddd', borderRadius: 4, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <button
                    disabled={reqSubmitting || !reqBuilding.trim()}
                    onClick={async () => {
                      if (!reqBuilding.trim()) return;
                      setReqSubmitting(true);
                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/requests`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ building: reqBuilding.trim(), campus: reqCampus, floor: reqFloor.trim(), note: reqNote.trim() }),
                        });
                        if (res.ok) setReqSubmitted(true);
                      } catch { } finally {
                        setReqSubmitting(false);
                      }
                    }}
                    style={{ width: '100%', backgroundColor: reqBuilding.trim() ? '#2a2a2a' : '#ccc', color: '#fff', border: 'none', padding: '11px', fontSize: 13, fontWeight: 800, borderRadius: 4, cursor: reqBuilding.trim() ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {reqSubmitting ? <Loader2 size={15} /> : <Send size={15} />}
                    Submit Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
