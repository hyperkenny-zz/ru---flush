import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, CheckCircle, Clock } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const RU_RED = '#CC0033';

export default function AdminPanel() {
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchRequests = async (adminKey) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/requests`, {
        headers: { 'x-admin-key': adminKey },
      });
      if (res.status === 401) { setAuthError(true); setAuthed(false); return; }
      setRequests(await res.json());
      setAuthed(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(false);
    await fetchRequests(key);
  };

  const updateStatus = async (id, status) => {
    const saved = key;
    await fetch(`${API}/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': saved },
      body: JSON.stringify({ status }),
    });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const deleteRequest = async (id) => {
    if (!confirm('Delete this request?')) return;
    await fetch(`${API}/api/admin/requests/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': key },
    });
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', padding: 40, width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: RU_RED, marginBottom: 4 }}>RU FLUSH</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 }}>Admin Panel</div>
          <form onSubmit={handleLogin}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Admin Key</div>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Enter admin key..."
              autoFocus
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: `1px solid ${authError ? RU_RED : '#ddd'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box', marginBottom: authError ? 6 : 16 }}
            />
            {authError && <div style={{ color: RU_RED, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Incorrect key. Try again.</div>}
            <button type="submit" style={{ width: '100%', backgroundColor: RU_RED, color: '#fff', border: 'none', padding: 11, fontSize: 13, fontWeight: 800, borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: RU_RED }}>RU FLUSH</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</span>
        </div>
        <a href="/" style={{ fontSize: 12, fontWeight: 700, color: '#888', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>← Back to Site</a>
      </div>

      <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 24px' }}>
        {/* Stats */}
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Requests', value: requests.length, color: '#333' },
            { label: 'Pending', value: pendingCount, color: '#d97706' },
            { label: 'Done', value: requests.length - pendingCount, color: '#16a34a' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', borderRadius: 6, padding: '16px 20px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {['all', 'pending', 'done'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, border: 'none', borderRadius: 4, cursor: 'pointer', backgroundColor: filter === f ? '#2a2a2a' : '#e0e0e0', color: filter === f ? '#fff' : '#666' }}>
              {f}
            </button>
          ))}
          <button onClick={() => fetchRequests(key)} style={{ marginLeft: 'auto', padding: '7px 16px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, border: 'none', borderRadius: 4, cursor: 'pointer', backgroundColor: '#e0e0e0', color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
            ↻ Refresh
          </button>
        </div>

        {/* Requests list */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Loader2 size={28} style={{ color: '#ccc', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#aaa', fontWeight: 600 }}>No requests found.</div>
          ) : (
            filtered.map((r, i) => (
              <div key={r.id} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#222' }}>{r.building}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, backgroundColor: r.status === 'done' ? '#dcfce7' : '#fef9c3', color: r.status === 'done' ? '#166534' : '#92400e', border: `1px solid ${r.status === 'done' ? '#bbf7d0' : '#fde68a'}` }}>
                      {r.status === 'done' ? '✓ Done' : '⏳ Pending'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: r.note ? 6 : 0 }}>
                    {r.campus} · {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {r.note && <div style={{ fontSize: 13, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{r.note}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {r.status === 'pending' ? (
                    <button onClick={() => updateStatus(r.id, 'done')}
                      title="Mark as done"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 4, cursor: 'pointer', backgroundColor: '#dcfce7', color: '#166534' }}>
                      <CheckCircle size={13} /> Done
                    </button>
                  ) : (
                    <button onClick={() => updateStatus(r.id, 'pending')}
                      title="Mark as pending"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fef9c3', color: '#92400e' }}>
                      <Clock size={13} /> Pending
                    </button>
                  )}
                  <button onClick={() => deleteRequest(r.id)}
                    title="Delete"
                    style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', fontSize: 11, border: 'none', borderRadius: 4, cursor: 'pointer', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
