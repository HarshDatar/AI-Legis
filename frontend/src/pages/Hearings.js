import React, { useState, useEffect } from 'react';
import { getCases } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DEMO_HEARINGS = [
  { case_id: 'demo001', next_hearing: '2026-05-10', case_number: 'WP/1042/2024', title: 'State of Maharashtra v. Rajesh Sharma', court: 'Bombay High Court', room: 'Court Room 12', time: '10:30 AM', status: 'urgent', parties: { petitioner: 'Rajesh Sharma' } },
  { case_id: 'demo002', next_hearing: '2026-04-28', case_number: 'CIV/2024/0532', title: 'Mehta Industries v. Patel Enterprises', court: 'Delhi High Court', room: 'Room 7', time: '2:00 PM', status: 'active', parties: { petitioner: 'Mehta Industries' } },
  { case_id: 'demo003', next_hearing: '2026-05-15', case_number: 'WP/2024/1204', title: 'Sunita Devi v. Municipal Corporation', court: 'Allahabad High Court', room: 'Room 3', time: '11:00 AM', status: 'active', parties: { petitioner: 'Sunita Devi' } },
];

function Hearings() {
  const [hearings, setHearings] = useState(DEMO_HEARINGS);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ case_number: '', title: '', court: '', room: '', time: '10:30 AM', date: '', notes: '' });
  const [saved, setSaved] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const data = await getCases(currentUser?.id);
        const live = (data.cases || []).filter(c => c.next_hearing).sort((a, b) => new Date(a.next_hearing) - new Date(b.next_hearing));
        if (live.length > 0) setHearings([...live, ...saved]);
        else setHearings([...DEMO_HEARINGS, ...saved]);
      } catch {
        setHearings([...DEMO_HEARINGS, ...saved]);
      } finally { setLoading(false); }
    })();
  }, [saved]);

  const handleAdd = () => {
    if (!form.date || !form.case_number) return;
    const newH = {
      case_id: `manual_${Date.now()}`,
      next_hearing: form.date,
      case_number: form.case_number,
      title: form.title || form.case_number,
      court: form.court,
      room: form.room,
      time: form.time,
      status: 'active',
      isManual: true,
      parties: { petitioner: form.title.split('v.')[0]?.trim() || '—' }
    };
    setSaved(prev => [...prev, newH]);
    setShowModal(false);
    setForm({ case_number: '', title: '', court: '', room: '', time: '10:30 AM', date: '', notes: '' });
  };

  if (loading) return <div className="empty"><div className="spinner"></div></div>;

  const allHearings = [...hearings].sort((a, b) => new Date(a.next_hearing) - new Date(b.next_hearing));
  const upcoming = allHearings.filter(h => new Date(h.next_hearing) >= new Date());
  const past = allHearings.filter(h => new Date(h.next_hearing) < new Date());

  const HearingCard = ({ c, i }) => {
    const d = new Date(c.next_hearing);
    const day = isNaN(d) ? '??' : d.getDate();
    const mon = isNaN(d) ? 'TBD' : d.toLocaleString('en-IN', { month: 'short' }).toUpperCase();
    const isUrgent = c.status === 'urgent' || c.status === 'Urgent';
    return (
      <div className="h-card" onClick={() => !c.isManual && navigate(`/case/${c.case_id}`)}>
        <div className={`h-date-box ${isUrgent ? 'urgent' : ''}`}>
          <div className="h-day">{day}</div>
          <div className="h-mon">{mon}</div>
        </div>
        <div className="h-body">
          <div className="h-case-num">{c.case_number}</div>
          <div className="h-title">{c.title || `${c.parties?.petitioner} v. ${c.parties?.respondent}`}</div>
          <div className="h-meta">
            <span>🏛️ {c.court || 'Court TBD'}</span>
            {c.room && <span>· {c.room}</span>}
          </div>
        </div>
        <div className="h-right">
          <div className="h-time">{c.time || c.next_hearing}</div>
          {isUrgent && <span className="h-urgent-pill">⚑ URGENT</span>}
          {c.isManual && <span className="h-manual-pill">📌 Manual</span>}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="topbar">
        <div>
          <div className="topbar-title">Hearings Diary</div>
          <div className="topbar-sub">{upcoming.length} upcoming appearances · Firm-wide schedule</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-outline" onClick={() => alert('Sync with Outlook coming soon.')}>📅 Sync Calendar</button>
          <button className="btn btn-gold" onClick={() => setShowModal(true)}>+ Add Hearing</button>
        </div>
      </header>

      <div className="content">
        {upcoming.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Upcoming Listings</div>
              <div className="card-sub">{upcoming.length} appearances scheduled</div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {upcoming.map((c, i) => <HearingCard key={c.case_id + i} c={c} i={i} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="card">
            <div className="card-header" style={{ opacity: 0.7 }}>
              <div className="card-title">Past Appearances</div>
            </div>
            <div style={{ padding: '8px 0', opacity: 0.6 }}>
              {past.map((c, i) => <HearingCard key={c.case_id + i} c={c} i={i} />)}
            </div>
          </div>
        )}

        {allHearings.length === 0 && (
          <div className="card">
            <div className="empty" style={{ padding: '80px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
              No hearings scheduled yet.
              <br />
              <button className="btn btn-gold" style={{ marginTop: '20px' }} onClick={() => setShowModal(true)}>+ Add First Hearing</button>
            </div>
          </div>
        )}
      </div>

      {/* MANUAL ADD MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Schedule Hearing</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Case Number *</label>
                <input className="form-input" placeholder="e.g. WP/1042/2024" value={form.case_number} onChange={e => setForm(f => ({ ...f, case_number: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Case Title</label>
                <input className="form-input" placeholder="e.g. Sharma v. State of Maharashtra" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Hearing Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-row-2">
                <div className="form-row">
                  <label>Time</label>
                  <input className="form-input" placeholder="10:30 AM" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label>Court Room</label>
                  <input className="form-input" placeholder="Court Room 12" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <label>Court / Tribunal</label>
                <input className="form-input" placeholder="Bombay High Court" value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleAdd}>Add to Diary</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .h-card {
          display: flex; align-items: center; gap: 20px;
          padding: 18px 24px; border-bottom: 1px solid var(--border);
          cursor: pointer; transition: all 0.2s;
        }
        .h-card:hover { background: var(--gold); }
        .h-card:last-child { border-bottom: none; }
        .h-date-box {
          min-width: 52px; text-align: center;
          background: var(--gold); border: 1px solid var(--gold);
          border-radius: 10px; padding: 8px 6px; flex-shrink: 0;
        }
        .h-date-box.urgent { background: var(--red-bg); border-color: rgba(201,64,64,0.3); }
        .h-date-box.urgent .h-day { color: var(--red); }
        .h-day { font-family: 'IBM Plex Serif', serif; font-size: 22px; font-weight: 700; color: var(--gold); line-height: 1; }
        .h-mon { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-top: 2px; }
        .h-body { flex: 1; }
        .h-case-num { font-family: 'IBM Plex Serif', serif; font-size: 13px; font-weight: 700; color: var(--gold); margin-bottom: 3px; }
        .h-title { font-size: 14px; font-weight: 600; color: var(--navy); margin-bottom: 4px; }
        .h-meta { font-size: 12px; color: var(--text-muted); display: flex; gap: 6px; }
        .h-right { text-align: right; flex-shrink: 0; }
        .h-time { font-size: 13px; font-weight: 600; color: var(--navy); margin-bottom: 6px; }
        .h-urgent-pill { background: var(--red); color: white; font-size: 10px; padding: 3px 8px; border-radius: 20px; font-weight: 700; display: block; }
        .h-manual-pill { background: #DBEAFE; color: #1E40AF; font-size: 10px; padding: 3px 8px; border-radius: 20px; font-weight: 700; display: block; margin-top: 4px; }
        
        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .modal-box { background: var(--surface); border-radius: 16px; width: 520px; max-width: 95vw; box-shadow: 0 25px 60px rgba(0,0,0,0.2); animation: modalIn 0.25s ease-out; }
        @keyframes modalIn { from { transform: scale(0.95) translateY(-10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .modal-title { font-family: 'IBM Plex Serif', serif; font-size: 18px; font-weight: 600; }
        .modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted); width: 32px; height: 32px; border-radius: 6px; }
        .modal-close:hover { background: var(--surface-alt); }
        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }
        .form-row { display: flex; flex-direction: column; gap: 5px; }
        .form-row label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .form-input { padding: 10px 14px; border: 1px solid var(--border-mid); border-radius: 8px; font-size: 14px; font-family: 'IBM Plex Sans', sans-serif; outline: none; background: var(--surface); transition: border-color 0.2s; }
        .form-input:focus { border-color: var(--gold); }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      `}</style>
    </>
  );
}

export default Hearings;
