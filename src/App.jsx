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

  const openModal = async (toilet) => {
    setModalToilet(toilet);
    setNewRating(0);
    setHoveredRating(0);
    setNewComment('');
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
    setNewRating(0);
    setNewComment('');
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || newRating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toilet_id: modalToilet.id, comment: newComment, stars: newRating }),
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
        setNewRating(0);
        setNewComment('');
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
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: RU_RED, letterSpacing: -1, lineHeight: 1 }}>RU FLUSH</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>Rutgers Bathroom Reviews</div>
            </div>
          </div>

          {/* Campus nav */}
          <nav className="ru-nav" style={{ display: 'flex', gap: 4 }}>
            {CAMPUSES.map(campus => (
              <button
                key={campus}
                onClick={() => setActiveCampus(campus)}
                style={{
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeCampus === campus ? RU_RED : '#2a2a2a',
                  color: '#fff',
                  borderRadius: 4,
                  transition: 'background-color 0.15s',
                }}
              >
                {campus}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="ru-hero" style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <img
          key={activeCampus}
          src={CAMPUS_IMAGES[activeCampus]}
          alt={`${activeCampus} campus`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
        <div className="ru-hero-text" style={{ position: 'absolute', top: '50%', left: 48, transform: 'translateY(-50%)' }}>
          <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 900, margin: 0, lineHeight: 1.15 }}>
            {activeCampus} Campus<br />Bathroom Reviews
          </h2>
          <p style={{ color: '#ddd', fontSize: 14, marginTop: 10, marginBottom: 20, fontWeight: 400 }}>
            Find and rate the best (and worst) bathrooms on campus.
          </p>
          <button
            onClick={() => filteredToilets[0] && openModal(filteredToilets[0])}
            style={{ backgroundColor: RU_RED, color: '#fff', border: 'none', padding: '10px 22px', fontSize: 13, fontWeight: 800, borderRadius: 4, cursor: 'pointer', letterSpacing: 0.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}
          >
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
          <input
            type="text"
            placeholder="Building name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '9px 14px', fontSize: 13, border: 'none', borderRadius: 3, outline: 'none', fontWeight: 500 }}
          />
          <select
            value={activeCampus}
            onChange={e => setActiveCampus(e.target.value)}
            style={{ padding: '9px 14px', fontSize: 13, border: 'none', borderRadius: 3, outline: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none', padding: '9px 22px', fontSize: 13, fontWeight: 800, borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            Search
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="ru-main-grid" style={{ maxWidth: '100%', margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* Left: Bathroom list */}
        <div>
          {/* Section header */}
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
                  <div style={{ display: 'flex', gap: 0, padding: 16, alignItems: 'flex-start', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Rank */}
                    <div style={{ width: 32, textAlign: 'center', paddingTop: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: i < 3 ? RU_RED : '#ccc' }}>{i + 1}</span>
                    </div>

                    {/* Photo */}
                    <div className="ru-toilet-photo" style={{ width: 130, height: 90, flexShrink: 0, borderRadius: 4, overflow: 'hidden', backgroundColor: '#eee' }}>
                      <img
                        src={toilet.photo_url || 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?q=80&w=400'}
                        alt={toilet.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, paddingLeft: 16 }}>
                      <a style={{ fontSize: 16, fontWeight: 800, color: RU_RED, cursor: 'pointer', textDecoration: 'none', display: 'block', marginBottom: 3 }}
                        onClick={() => openModal(toilet)}>
                        {toilet.name}
                      </a>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                        <MapPin size={11} color={RU_RED} /> {toilet.floor} · {toilet.campus}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <StarRow rating={toilet.avg_rating} size={14} />
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#333' }}>
                          {parseFloat(toilet.avg_rating) > 0 ? toilet.avg_rating : '—'}
                        </span>
                        <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>
                          {toilet.review_count > 0 ? `${toilet.review_count} review${toilet.review_count > 1 ? 's' : ''}` : 'No reviews yet'}
                        </span>
                      </div>
                    </div>

                    {/* Button */}
                    <div style={{ flexShrink: 0, paddingLeft: 12, display: 'flex', alignItems: 'center' }}>
                      <button
                        onClick={() => openModal(toilet)}
                        style={{ backgroundColor: RU_RED, color: '#fff', border: 'none', padding: '8px 16px', fontSize: 12, fontWeight: 800, borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
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
          {/* Rate CTA */}
          <div>
            <div style={{ backgroundColor: RU_RED, color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, borderRadius: '4px 4px 0 0' }}>
              ✏ Rate a Bathroom
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderTop: 'none', padding: 16, borderRadius: '0 0 4px 4px' }}>
              <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.5 }}>
                Help fellow Rutgers students find the cleanest bathrooms on campus.
              </p>
              <button
                onClick={() => filteredToilets[0] && openModal(filteredToilets[0])}
                style={{ width: '100%', backgroundColor: RU_RED, color: '#fff', border: 'none', padding: '10px', fontSize: 12, fontWeight: 800, borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Post Your Review
              </button>
            </div>
          </div>

          {/* How it works */}
          <div>
            <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, borderRadius: '4px 4px 0 0' }}>
              ℹ Features
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
              {[
                { icon: '⭐', title: 'Rate Bathrooms', desc: '1–5 star ratings for every location' },
                { icon: '💬', title: 'Leave Reviews', desc: 'Share your experience in detail' },
                { icon: '🏆', title: 'Campus Rankings', desc: 'See the best & worst by campus' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#222', marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top rated */}
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
        </div>
      </div>

      {/* ── MODAL ── */}
      {modalToilet && (
        <div
          onClick={e => e.target === e.currentTarget && closeModal()}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: 520, borderRadius: 6, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

            {/* Modal header */}
            <div style={{ backgroundColor: RU_RED, padding: '14px 20px', borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>{modalToilet.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {modalToilet.floor} · {modalToilet.campus}
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

            {/* Reviews section label */}
            <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '6px 16px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              💬 Reviews ({reviews.length})
            </div>

            {/* Reviews list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 0 }}>
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
                  {reviews.map(r => (
                    <div key={r.id} style={{ border: '1px solid #ebebeb', borderRadius: 4, padding: 12, backgroundColor: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <StarRow rating={r.stars} size={13} />
                        <span style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>
                          {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.55, fontWeight: 500 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write review section */}
            <div style={{ borderTop: '1px solid #e0e0e0' }}>
              <div style={{ backgroundColor: '#2a2a2a', color: '#fff', padding: '6px 16px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                ✏ Write a Review
              </div>
              <div style={{ padding: 16 }}>
                {/* Star picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
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

                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Share your experience..."
                  style={{ width: '100%', height: 88, padding: 10, fontSize: 13, border: '1px solid #ddd', borderRadius: 4, resize: 'none', outline: 'none', fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box', marginBottom: 10 }}
                />

                <button
                  onClick={handleSubmit}
                  disabled={submitting || newRating === 0 || !newComment.trim()}
                  style={{ width: '100%', backgroundColor: newRating > 0 && newComment.trim() ? RU_RED : '#ccc', color: '#fff', border: 'none', padding: '11px', fontSize: 13, fontWeight: 800, borderRadius: 4, cursor: newRating > 0 && newComment.trim() ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background-color 0.15s' }}
                >
                  {submitting ? <Loader2 size={15} /> : <Send size={15} />}
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
