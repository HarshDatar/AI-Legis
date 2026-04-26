import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../api';
import { useAuth } from '../contexts/AuthContext';

const COURTS = [
  'Supreme Court of India',
  'Bombay High Court',
  'Delhi High Court',
  'Madras High Court',
  'Calcutta High Court',
  'Other / District Court',
];

const CATEGORIES = ['Criminal', 'Civil', 'Constitutional', 'Family', 'Property', 'Arbitration', 'Tax', 'Other'];

export default function NewCase() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [useAI,   setUseAI]   = useState(false);
  const [form, setForm] = useState({
    title: '', case_number: '', court: '', category: 'Criminal',
    petitioner: '', respondent: '', next_hearing: ''
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await createCase({ ...form, status: 'active' }, currentUser.id);
      const cid = res.case?.case_id;
      if (useAI) {
        navigate(`/upload?caseId=${cid}&autoAI=true`);
      } else {
        navigate(`/case/${cid}`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace">
      <div className="top-nav">
        <span className="top-nav-title">Register New Matter</span>
        <button className="btn-secondary" onClick={() => navigate('/')}>← Back to Docket</button>
      </div>

      <div className="main-content" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">Case Registration Form</div>
          <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {error && (
              <div style={{ background: 'var(--maroon-light)', border: '1px solid #FECACA', color: 'var(--maroon)', padding: '12px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label">Case Number *</label>
                <input required className="input-field" placeholder="e.g. WP/1042/2026"
                  value={form.case_number} onChange={e => set('case_number', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Court / Jurisdiction *</label>
                <select required className="input-field" value={form.court} onChange={e => set('court', e.target.value)}>
                  <option value="">Select Court...</option>
                  {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Matter Title */}
            <div>
              <label className="input-label">Matter Title *</label>
              <input required className="input-field" placeholder="e.g. State of Maharashtra v. Rajesh Sharma"
                value={form.title} onChange={e => set('title', e.target.value)} />
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label">Petitioner</label>
                <input className="input-field" placeholder="Name of Petitioner"
                  value={form.petitioner} onChange={e => set('petitioner', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Respondent</label>
                <input className="input-field" placeholder="Name of Respondent"
                  value={form.respondent} onChange={e => set('respondent', e.target.value)} />
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label">Category</label>
                <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Next Hearing Date</label>
                <input className="input-field" type="date"
                  value={form.next_hearing} onChange={e => set('next_hearing', e.target.value)} />
              </div>
            </div>

            {/* Processing Mode */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <div className="input-label" style={{ marginBottom: '12px' }}>Processing Mode</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { value: false, icon: '📋', title: 'Manual Entry', sub: 'Add to docket without AI scan' },
                  { value: true,  icon: '🤖', title: 'AI Assisted',  sub: 'Run Ollama analysis after creation' },
                ].map(opt => (
                  <div key={String(opt.value)}
                    onClick={() => setUseAI(opt.value)}
                    style={{
                      flex: 1, padding: '16px', cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${useAI === opt.value ? 'var(--maroon)' : 'var(--border)'}`,
                      background: useAI === opt.value ? 'var(--maroon-light)' : 'var(--surface)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '22px', marginBottom: '6px' }}>{opt.icon}</div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: useAI === opt.value ? 'var(--maroon)' : 'var(--navy)' }}>{opt.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ height: '46px', fontSize: '13px' }}>
              {loading ? 'CREATING...' : useAI ? 'CREATE & LAUNCH AI SCAN →' : 'REGISTER MATTER →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
