import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCases } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cases, setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    getCases(currentUser.id)
      .then(res => setCases(res.cases || []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const urgent   = cases.filter(c => c.status === 'urgent').length;
  const hearings = cases.filter(c => c.next_hearing && c.next_hearing.trim()).length;

  return (
    <div className="workspace">
      {/* TOP NAV */}
      <div className="top-nav">
        <span className="top-nav-title">Legal Command Center</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{currentUser?.name}</span>
          <button className="btn-primary" onClick={() => navigate('/new-case')}>+ NEW MATTER</button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="main-content">

        {error && (
          <div style={{ background: 'var(--maroon-light)', border: '1px solid #FECACA', color: 'var(--maroon)', padding: '12px 16px', marginBottom: '24px', fontSize: '13px' }}>
            <strong>Backend error:</strong> {error}. Showing local state.
          </div>
        )}

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
          <div className="stat-box" style={{ borderLeft: '4px solid var(--maroon)' }}>
            <div className="stat-label" style={{ color: 'var(--maroon)' }}>Critical Alerts</div>
            <div className="stat-value">{urgent}</div>
            <div className="stat-sub">Matters requiring immediate attention</div>
          </div>
          <div className="stat-box" style={{ borderLeft: '4px solid var(--gold)' }}>
            <div className="stat-label" style={{ color: 'var(--gold)' }}>Scheduled Hearings</div>
            <div className="stat-value">{hearings}</div>
            <div className="stat-sub">Upcoming in next 30 days</div>
          </div>
          <div className="stat-box" style={{ borderLeft: '4px solid var(--navy)' }}>
            <div className="stat-label" style={{ color: 'var(--navy)' }}>Total Docket</div>
            <div className="stat-value">{cases.length}</div>
            <div className="stat-sub">Active matters under management</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* LEFT: DOCKET TABLE */}
          <div className="card">
            <div className="card-header">Active Docket</div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading docket...</div>
            ) : cases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚖</div>
                <div className="empty-state-title">Docket Is Empty</div>
                <p style={{ fontSize: '13px', marginBottom: '20px' }}>No matters registered yet. Start by creating a new case.</p>
                <button className="btn-primary" onClick={() => navigate('/new-case')}>Register First Matter</button>
              </div>
            ) : (
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Case No.</th>
                    <th>Matter Title</th>
                    <th>Parties</th>
                    <th>Next Hearing</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.case_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/case/${c.case_id}`)}>
                      <td style={{ fontWeight: '700', color: 'var(--maroon)', fontSize: '13px', whiteSpace: 'nowrap' }}>{c.case_number}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--navy)' }}>{c.title || 'Untitled Matter'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.category}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-main)' }}>{c.parties?.petitioner || '—'}</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>v.</span>
                        <span style={{ color: 'var(--text-main)' }}>{c.parties?.respondent || '—'}</span>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--gold)' }}>{c.next_hearing || 'Not Set'}</div>
                      </td>
                      <td>
                        <span className={`badge ${c.status === 'urgent' ? 'badge-urgent' : c.status === 'closed' ? 'badge-closed' : 'badge-active'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/case/${c.case_id}`}
                          className="btn-secondary"
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none' }}
                        >
                          OPEN →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* RIGHT: HEARINGS BOX */}
          <div className="card">
            <div className="card-header">Hearing Calendar</div>
            <div style={{ padding: '20px' }}>
              {cases.filter(c => c.next_hearing).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '12px' }}>
                  No upcoming hearings scheduled.
                </div>
              ) : (
                cases.filter(c => c.next_hearing).map(c => (
                  <div key={c.case_id} style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                    <div style={{ background: 'var(--gold-light)', color: 'var(--gold)', padding: '8px', textAlign: 'center', minWidth: '60px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '800' }}>DATE</div>
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>{c.next_hearing.split('-')[2] || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy)' }}>{c.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.case_number}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
