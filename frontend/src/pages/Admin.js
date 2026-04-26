import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CLIENTS = [
  {
    id: 'c1', initials: 'RS', name: 'Rajesh Sharma', type: 'Individual', color: '#DCFCE7', textColor: '#166534',
    email: 'r.sharma@email.com', phone: '+91 98200 11234', city: 'Mumbai',
    cases: [
      { case_id: 'demo001', case_number: 'WP/1042/2024', title: 'State of Maharashtra v. Rajesh Sharma', status: 'urgent', court: 'Bombay High Court', next_hearing: '2026-05-10' }
    ]
  },
  {
    id: 'c2', initials: 'ME', name: 'Mehta Industries Pvt. Ltd.', type: 'Corporate', color: '#DBEAFE', textColor: '#1E40AF',
    email: 'legal@mehtaindustries.com', phone: '+91 11 4000 5678', city: 'Delhi',
    cases: [
      { case_id: 'demo002', case_number: 'CIV/2024/0532', title: 'Mehta Industries v. Patel Enterprises', status: 'active', court: 'Delhi High Court', next_hearing: '2026-04-28' }
    ]
  },
  {
    id: 'c3', initials: 'SD', name: 'Sunita Devi', type: 'Individual', color: '#FEF9C3', textColor: '#92400E',
    email: 'sunita.devi@email.com', phone: '+91 94500 22345', city: 'Lucknow',
    cases: [
      { case_id: 'demo003', case_number: 'WP/2024/1204', title: 'Sunita Devi v. Municipal Corporation', status: 'active', court: 'Allahabad High Court', next_hearing: '2026-05-15' }
    ]
  },
];

const STATUS_MAP = {
  urgent: { label: 'Urgent', cls: 'b-urg' },
  hearing_scheduled: { label: 'Hearing', cls: 'b-hrg' },
  active: { label: 'Active', cls: 'b-act' },
  closed: { label: 'Closed', cls: 'b-plain' },
};

export function Clients() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const client = selected ? CLIENTS.find(c => c.id === selected) : null;

  return (
    <>
      <header className="topbar">
        <div>
          <div className="topbar-title">Client Directory</div>
          <div className="topbar-sub">{CLIENTS.length} clients · {CLIENTS.reduce((a, c) => a + c.cases.length, 0)} active matters</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-gold" onClick={() => setShowAdd(true)}>+ Add Client</button>
        </div>
      </header>

      <div className="content" style={{ flexDirection: 'row', gap: '18px', overflow: 'hidden' }}>
        {/* CLIENT LIST */}
        <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CLIENTS.map(c => (
            <div
              key={c.id}
              className={`client-card ${selected === c.id ? 'active' : ''}`}
              onClick={() => setSelected(c.id)}
            >
              <div className="client-av" style={{ background: c.color, color: c.textColor }}>{c.initials}</div>
              <div style={{ flex: 1 }}>
                <div className="client-name">{c.name}</div>
                <div className="client-sub">{c.type} · {c.city}</div>
              </div>
              <div className="client-case-count">{c.cases.length}</div>
            </div>
          ))}
        </div>

        {/* CLIENT DETAIL */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {client ? (
            <div className="card" style={{ overflow: 'visible' }}>
              <div style={{ background: 'var(--navy)', padding: '24px', borderRadius: '12px 12px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="client-av-lg" style={{ background: client.color, color: client.textColor }}>{client.initials}</div>
                  <div>
                    <div style={{ fontFamily: ''IBM Plex Serif', serif', fontSize: '20px', fontWeight: 600, color: '#fff' }}>{client.name}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{client.type} · {client.city}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline-light" onClick={() => alert(`Calling ${client.phone}`)}>📞 Call</button>
                    <button className="btn btn-outline-light" onClick={() => alert(`Emailing ${client.email}`)}>✉️ Email</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Email</div><div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{client.email}</div></div>
                  <div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Phone</div><div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{client.phone}</div></div>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <div className="sec-lbl" style={{ marginBottom: '12px' }}>Active Matters ({client.cases.length})</div>
                {client.cases.map(cas => {
                  const st = STATUS_MAP[cas.status] || STATUS_MAP.active;
                  return (
                    <div
                      key={cas.case_id}
                      className="client-case-row"
                      onClick={() => navigate(`/case/${cas.case_id}`)}
                      title="Click to open case file"
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ fontFamily: ''IBM Plex Serif', serif', fontWeight: 700, fontSize: '13px', color: 'var(--gold)' }}>{cas.case_number}</span>
                          <span className={`bdg ${st.cls}`}><span className="bdg-dot"></span>{st.label}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)', marginBottom: '4px' }}>{cas.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🏛️ {cas.court} · Next: {cas.next_hearing || 'TBD'}</div>
                      </div>
                      <div className="open-case-btn">Open Case →</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card" style={{ height: '100%', minHeight: '300px' }}>
              <div className="empty" style={{ paddingTop: '100px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                Select a client to view their case portfolio
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add New Client</div>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row"><label>Full Name / Company</label><input className="form-input" placeholder="e.g. Rajesh Sharma or Mehta Pvt. Ltd." /></div>
              <div className="form-row-2">
                <div className="form-row"><label>Type</label><select className="form-input"><option>Individual</option><option>Corporate</option><option>NGO</option></select></div>
                <div className="form-row"><label>City</label><input className="form-input" placeholder="Mumbai" /></div>
              </div>
              <div className="form-row"><label>Email</label><input className="form-input" type="email" placeholder="client@email.com" /></div>
              <div className="form-row"><label>Phone</label><input className="form-input" placeholder="+91 98200 00000" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={() => { alert('Client saved!'); setShowAdd(false); }}>Save Client</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .client-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          cursor: pointer; transition: all 0.2s;
        }
        .client-card:hover, .client-card.active { border-color: var(--gold); background: var(--gold); }
        .client-av { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
        .client-av-lg { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
        .client-name { font-size: 14px; font-weight: 600; color: var(--navy); }
        .client-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .client-case-count { background: var(--gold); color: var(--navy); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .client-case-row {
          display: flex; align-items: center; gap: 16px;
          padding: 16px; border: 1px solid var(--border); border-radius: 10px;
          cursor: pointer; transition: all 0.2s; margin-bottom: 10px;
        }
        .client-case-row:hover { border-color: var(--gold); background: var(--gold); transform: translateX(4px); }
        .open-case-btn { background: var(--navy); color: var(--gold); padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; white-space: nowrap; flex-shrink: 0; font-family: 'IBM Plex Sans', sans-serif; transition: opacity 0.2s; }
        .client-case-row:hover .open-case-btn { opacity: 0.85; }

        /* Shared modal styles */
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
        .form-input { padding: 10px 14px; border: 1px solid var(--border-mid); border-radius: 8px; font-size: 14px; font-family: 'IBM Plex Sans', sans-serif; outline: none; background: var(--surface); transition: border-color 0.2s; width: 100%; }
        .form-input:focus { border-color: var(--gold); }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      `}</style>
    </>
  );
}

export function Settings() {
  const [isDark, setIsDark] = React.useState(false);
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.body.style.filter = !isDark ? 'invert(0.9) hue-rotate(180deg)' : 'none';
  };
  return (
    <>
      <header className="topbar">
        <div><div className="topbar-title">Workspace Settings</div><div className="topbar-sub">Firm preferences and appearance</div></div>
      </header>
      <div className="content">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div className="card-header"><div className="card-title">Preferences</div></div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div><div style={{ fontWeight: 600, fontSize: '13px' }}>Display Theme</div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Switch between Light and Dark mode</div></div>
              <button onClick={toggleTheme} style={{ fontWeight: 600, color: isDark ? 'white' : 'var(--navy)', fontSize: '12px', background: isDark ? 'var(--navy)' : 'var(--surface-alt)', border: '1px solid var(--border-mid)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' }}>
                {isDark ? '🌙 Dark Active' : '☀️ Light Active'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div><div style={{ fontWeight: 600, fontSize: '13px' }}>Email Notifications</div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Daily case summaries and hearing alerts</div></div>
              <div style={{ background: '#16A34A', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>ENABLED</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600, fontSize: '13px' }}>Automated Document Indexing</div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>OCR scan uploaded PDFs automatically</div></div>
              <div style={{ background: '#16A34A', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>ENABLED</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
