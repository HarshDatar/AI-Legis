import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases, getContradictions, getSummary } from '../api';
import { useAuth } from '../contexts/AuthContext';

// ══════════════════════════════════════════════════════
//  SEMANTIC SEARCH
// ══════════════════════════════════════════════════════
export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const DEMO_RESULTS = [
    { doc: 'Court Order — Interim Stay (Apr 10)', case: 'WP/1042/2024', snippet: '...provisions of Section 88 of the Maharashtra Land Revenue Code were allegedly bypassed. The petitioner claims the eviction notice lacked proper jurisdictional authority...' },
    { doc: 'Witness Statement — Ramesh Nair', case: 'WP/1042/2024', snippet: '...I saw the municipal vehicle parked outside the Sharma residence late at night, sometime around 11:30 PM to midnight on March 3rd...' },
    { doc: 'FIR Copy — Police Station Andheri', case: 'CRI/2024/1087', snippet: '...the incident reportedly occurred at 8:30 PM when the officers arrived unannounced. The accused denied any violation of the notice procedure...' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setTimeout(() => { setResults(DEMO_RESULTS); setLoading(false); }, 800);
  };

  return (
    <>
      <header className="topbar">
        <div><div className="topbar-title">Legal Research</div><div className="topbar-sub">Semantic search across all indexed case documents</div></div>
      </header>
      <div className="content">
        <div className="card" style={{ maxWidth: '860px', margin: '0 auto', width: '100%', padding: '28px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="E.g. Section 88 eviction procedure, witness conflict timeline, property boundary dispute..." autoFocus
              style={{ flex: 1, padding: '14px 18px', border: '1px solid var(--border-mid)', borderRadius: '10px', fontSize: '14px', fontFamily: ''IBM Plex Sans', sans-serif', outline: 'none' }}
            />
            <button className="btn btn-gold" type="submit" style={{ padding: '0 28px', borderRadius: '10px', fontSize: '14px' }} disabled={loading}>
              {loading ? '⏳ Searching…' : '🔍 Deep Search'}
            </button>
          </form>

          {results ? (
            <div style={{ marginTop: '28px' }}>
              <div className="sec-lbl">{results.length} Results — Ranked by Semantic Relevance</div>
              {results.map((r, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px', marginBottom: '12px', background: 'var(--surface)', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>📄</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>{r.doc}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>{r.case}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: '#DCFCE7', color: '#166534', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>OCR Indexed</div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-3)', lineHeight: 1.6, background: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '6px', fontStyle: 'italic' }}>"{r.snippet}"</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
              Enter a legal concept, section number, or fact pattern to search all OCR-indexed documents.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════
//  INCONSISTENCY AI — Full-featured tab
// ══════════════════════════════════════════════════════
const ALL_FLAGS = [
  {
    id: 'f1', severity: 'high', case_number: 'WP/1042/2024', case_id: 'demo001',
    title: 'Witness B timeline contradicts FIR by 3 hours 15 minutes',
    type: 'Timeline Conflict',
    detail: 'Witness B (Ramesh Nair) states the incident occurred at 11:45 PM on March 3rd. The FIR lodged by the complainant records the incident at 8:30 PM — a discrepancy of 3h 15m. Inconsistency detected between oral testimony and documentary record.',
    docs: ['FIR Copy — Police Station Andheri', 'Witness Statement — Ramesh Nair'],
    detected: 'Apr 11, 2026', status: 'open',
    actions: ['View Analysis', 'Mark as Reviewed', 'Dismiss'],
  },
  {
    id: 'f2', severity: 'high', case_number: 'CRI/2024/1087', case_id: 'demo001',
    title: 'Forensic report cause of death contradicts FIR weapon description',
    type: 'Factual Contradiction',
    detail: 'FIR states death caused by "multiple stab wounds from a sharp-edged weapon (kitchen knife)." The forensic report finds NO stab wounds — death was from blunt force trauma to the left temporal region. Factual conflict between initial report and forensic evidence.',
    docs: ['FIR Report', 'Forensic Examination Report'],
    detected: 'Apr 9, 2026', status: 'open',
    actions: ['View Analysis', 'Request Verification', 'Mark as Reviewed'],
  },
  {
    id: 'f3', severity: 'medium', case_number: 'WP/1042/2024', case_id: 'demo001',
    title: 'Eviction notice issued 6 days before gazette notification',
    type: 'Procedural Irregularity',
    detail: 'Notice dated Jan 12, 2024. The amendment to Section 88 enabling such notices was gazetted Jan 18, 2024. Factual sequence error: notice issued prior to gazette notification.',
    docs: ['Eviction Notice (Jan 12)', 'Maharashtra Gazette Extract (Jan 18)'],
    detected: 'Apr 9, 2026', status: 'open',
    actions: ['Compare Sections', 'View Analysis', 'Dismiss'],
  },
  {
    id: 'f4', severity: 'medium', case_number: 'CS/338/2023', case_id: 'demo002',
    title: 'Survey map vs title deed: 260 sq ft property boundary discrepancy',
    type: 'Quantitative Mismatch',
    detail: 'OCR-extracted survey map records plot area as 1,840 sq ft. The registered title deed states 2,100 sq ft — a 260 sq ft discrepancy. Quantitative mismatch in land area measurement.',
    docs: ['Property Survey Map (Scan)', 'Registered Title Deed'],
    detected: 'Apr 8, 2026', status: 'reviewed',
    actions: ['View Analysis', 'Order Re-Survey', 'Dismiss'],
  },
  {
    id: 'f5', severity: 'low', case_number: 'WP/1042/2024', case_id: 'demo001',
    title: 'Witness A and B describe different clothing for accused',
    type: 'Description Discrepancy',
    detail: 'Witness A (Petitioner): "He wore a dark blue jacket and black trousers." Witness B (Ramesh Nair): "He wore a grey t-shirt and blue jeans." Both witnesses claim to have seen the accused on the same evening. Entirely different clothing described.',
    docs: ['Witness Statement — Ramesh Nair', 'Petitioner Affidavit'],
    detected: 'Apr 11, 2026', status: 'dismissed',
    actions: ['Reopen', 'Dismiss'],
  },
];

export function InconsistencyAI() {
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [expanded, setExpanded] = useState(null);
  const [statuses, setStatuses] = useState({});
  const navigate = useNavigate();

  const SEV_COLOR = { high: 'var(--red)', medium: 'var(--amber)', low: '#16A34A' };
  const SEV_BG = { high: 'var(--red-bg)', medium: '#FEF9C3', low: '#DCFCE7' };
  const SEV_TEXT = { high: 'var(--red-text)', medium: '#92400E', low: '#166534' };

  const getStatus = (f) => statuses[f.id] || f.status;

  const filtered = ALL_FLAGS.filter(f => {
    const matchSev = filter === 'all' || f.severity === filter;
    const matchStatus = statusFilter === 'all' || getStatus(f) === statusFilter;
    return matchSev && matchStatus;
  });

  const stats = {
    high: ALL_FLAGS.filter(f => f.severity === 'high' && getStatus(f) === 'open').length,
    medium: ALL_FLAGS.filter(f => f.severity === 'medium' && getStatus(f) === 'open').length,
    open: ALL_FLAGS.filter(f => getStatus(f) === 'open').length,
    reviewed: ALL_FLAGS.filter(f => getStatus(f) === 'reviewed').length,
  };

  const handleAction = (flagId, action) => {
    if (action === 'Mark as Reviewed') setStatuses(s => ({ ...s, [flagId]: 'reviewed' }));
    else if (action === 'Dismiss') setStatuses(s => ({ ...s, [flagId]: 'dismissed' }));
    else if (action === 'Reopen') setStatuses(s => ({ ...s, [flagId]: 'open' }));
    else alert(`Action: ${action}`);
  };

  return (
    <>
      <header className="topbar">
        <div><div className="topbar-title">Inconsistency Monitor</div><div className="topbar-sub">AI-flagged contradictions requiring legal attention</div></div>
        <div className="topbar-right">
          <button className="btn btn-outline" onClick={() => alert('Re-scanning all case documents…')}>🔄 Rescan All Cases</button>
          <button className="btn btn-gold" onClick={() => navigate('/case/demo001')}>Open Case →</button>
        </div>
      </header>

      <div className="content">
        {/* STAT BAR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { label: 'High Priority', value: stats.high, color: 'var(--red)', bg: 'var(--red-bg)' },
            { label: 'Medium Priority', value: stats.medium, color: 'var(--amber)', bg: '#FEF9C3' },
            { label: 'Open Flags', value: stats.open, color: 'var(--navy)', bg: 'var(--surface-alt)' },
            { label: 'Reviewed', value: stats.reviewed, color: '#16A34A', bg: '#DCFCE7' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="tabs" style={{ flex: 1 }}>
            {['all', 'high', 'medium', 'low'].map(f => (
              <div key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All Flags' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="tab-count">{ALL_FLAGS.filter(x => f === 'all' || x.severity === f).length}</span>
              </div>
            ))}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ border: '1px solid var(--border-mid)', borderRadius: '8px', padding: '0 12px', fontSize: '13px', fontFamily: ''IBM Plex Sans', sans-serif', cursor: 'pointer', background: 'var(--surface)' }}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {/* FLAG LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 && (
            <div className="card"><div className="empty" style={{ padding: '80px' }}><div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>No flags match this filter.</div></div>
          )}
          {filtered.map(f => {
            const st = getStatus(f);
            const isOpen = expanded === f.id;
            return (
              <div key={f.id} className="flag-full-card" style={{ opacity: st === 'dismissed' ? 0.55 : 1 }}>
                <div className="flag-header" onClick={() => setExpanded(isOpen ? null : f.id)}>
                  <div className="flag-sev-bar" style={{ background: SEV_COLOR[f.severity] }}></div>
                  <div style={{ fontSize: '20px', marginLeft: '4px' }}>
                    {f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🟢'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: ''IBM Plex Serif', serif', fontWeight: 700, color: 'var(--gold)', fontSize: '12px' }}>{f.case_number}</span>
                      <span style={{ background: SEV_BG[f.severity], color: SEV_TEXT[f.severity], fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>{f.type}</span>
                      {st !== 'open' && <span style={{ background: st === 'reviewed' ? '#DCFCE7' : 'var(--surface-alt)', color: st === 'reviewed' ? '#166534' : 'var(--text-muted)', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>{st.toUpperCase()}</span>}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--navy)' }}>{f.title}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>Detected {f.detected}</div>
                  <div style={{ fontSize: '20px', color: 'var(--text-muted)', marginLeft: '8px' }}>{isOpen ? '▲' : '▼'}</div>
                </div>

                {isOpen && (
                  <div className="flag-body">
                    <div style={{ background: 'var(--surface-alt)', borderRadius: '8px', padding: '14px 16px', marginBottom: '14px', fontSize: '13.5px', lineHeight: 1.65, color: 'var(--ink-2)' }}>
                      {f.detail}
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <div className="sec-lbl" style={{ marginBottom: '8px' }}>Documents Involved</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {f.docs.map((d, i) => (
                          <span key={i} style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>📄 {d}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {f.actions.map((a, i) => (
                        <button key={i} onClick={() => handleAction(f.id, a)}
                          style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontFamily: ''IBM Plex Sans', sans-serif', fontSize: '13px', fontWeight: 600,
                            background: i === 0 ? SEV_COLOR[f.severity] : 'var(--surface-alt)',
                            color: i === 0 ? 'white' : 'var(--ink-3)',
                          }}>
                          {a}
                        </button>
                      ))}
                      <button onClick={() => navigate(`/case/${f.case_id}`)}
                        style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', background: 'var(--navy)', color: 'var(--gold)', border: 'none', cursor: 'pointer', fontFamily: ''IBM Plex Sans', sans-serif', fontSize: '13px', fontWeight: 600 }}>
                        Open Case File →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .flag-full-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: box-shadow 0.2s; }
        .flag-full-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .flag-header { display: flex; align-items: center; gap: 14px; padding: 18px 20px; cursor: pointer; }
        .flag-sev-bar { width: 4px; height: 40px; border-radius: 3px; flex-shrink: 0; }
        .flag-body { padding: 0 20px 20px; border-top: 1px solid var(--border); margin-top: 0; padding-top: 16px; }
      `}</style>
    </>
  );
}

// ══════════════════════════════════════════════════════
//  BRIEF GENERATOR (was AISummary)
// ══════════════════════════════════════════════════════
const DEMO_BRIEF = `# Legal Brief — State of Maharashtra v. Rajesh Sharma
**Case No.:** WP/1042/2024 | **Court:** Bombay High Court | **Date:** ${new Date().toLocaleDateString('en-IN')}

---

## Executive Summary
This writ petition challenges an eviction notice issued under Section 88 of the Maharashtra Land Revenue Code. The petitioner has strong procedural and substantive grounds. AI analysis of 5 case documents has identified 3 critical inconsistencies that significantly strengthen the defense.

## Key Legal Issues

### 1. Procedural Void — Pre-Gazette Notice (HIGH PRIORITY)
The eviction notice (Jan 12, 2024) predates the gazette notification (Jan 18, 2024) by 6 days, rendering it void ab initio. This is the strongest ground requiring no further evidence.

### 2. Witness Timeline Conflict (HIGH PRIORITY)
A 3-hour 15-minute discrepancy between the FIR timestamp (8:30 PM) and Witness B's account (11:45 PM) materially undermines the respondent's evidence. Cross-examination on this point is recommended.

### 3. Property Boundary Discrepancy (MEDIUM PRIORITY)
Survey map records 1,840 sq ft vs. title deed showing 2,100 sq ft. Verification against Sub-Registrar records recommended before the next hearing.

## Case Analysis
1. Discrepancy in notice issuance vs. gazette date (High Significance).
2. Factual conflict in witness timeline (3h 15m gap).
3. Land area measurement mismatch (260 sq ft).

## Next Hearing
**April 18, 2026** at Bombay High Court, Court Room 12, 10:30 AM.`;

export function AISummary() {
  const [selectedCase, setSelectedCase] = useState('');
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('brief');
  const { currentUser } = useAuth();
  const [cases, setCases] = useState([
    { case_id: 'demo001', case_number: 'WP/1042/2024', title: 'State v. Rajesh Sharma' },
    { case_id: 'demo002', case_number: 'CIV/2024/0532', title: 'Mehta Industries v. Patel Enterprises' },
    { case_id: 'demo003', case_number: 'WP/2024/1204', title: 'Sunita Devi v. Municipal Corporation' },
  ]);

  React.useEffect(() => {
    getCases(currentUser?.id).then(d => { if (d.cases?.length > 0) setCases(d.cases); }).catch(() => {});
  }, []);

  const generate = async () => {
    if (!selectedCase) return;
    setLoading(true);
    setBrief(null);
    try {
      const res = await getSummary(selectedCase);
      setBrief(res.summaries?.[0]?.summary || DEMO_BRIEF);
    } catch {
      await new Promise(r => setTimeout(r, 1500));
      setBrief(DEMO_BRIEF);
    }
    setLoading(false);
  };

  return (
    <>
      <header className="topbar">
        <div><div className="topbar-title">Brief Generator</div><div className="topbar-sub">AI-drafted legal summaries and case briefs</div></div>
        {brief && (
          <div className="topbar-right">
            <button className="btn btn-outline" onClick={() => { const b = document.createElement('a'); b.href = 'data:text/plain,' + encodeURIComponent(brief); b.download = 'legal_brief.txt'; b.click(); }}>⬇️ Export</button>
            <button className="btn btn-outline" onClick={() => navigator.clipboard.writeText(brief).then(() => alert('Copied to clipboard!'))}>📋 Copy</button>
            <button className="btn btn-gold" onClick={() => setBrief(null)}>New Brief</button>
          </div>
        )}
      </header>

      <div className="content">
        {!brief ? (
          <div className="card" style={{ maxWidth: '680px', margin: '0 auto', width: '100%', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
              <div style={{ fontFamily: ''IBM Plex Serif', serif', fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Brief Generator</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Select a case and document format to generate an AI-drafted legal brief from all attached evidence and pleadings.</div>
            </div>

            <div className="form-row" style={{ marginBottom: '16px' }}>
              <label>Select Case</label>
              <select className="form-input" value={selectedCase} onChange={e => setSelectedCase(e.target.value)}>
                <option value="">— Choose a case —</option>
                {cases.map(c => <option key={c.case_id} value={c.case_id}>{c.case_number} — {c.title}</option>)}
              </select>
            </div>

            <div className="form-row" style={{ marginBottom: '24px' }}>
              <label>Brief Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '4px' }}>
                {[['brief', '📋', 'Case Analysis', 'Factual summary'], ['memo', '📄', 'Technical Note', 'Internal analysis'], ['timeline', '🕐', 'Chronology', 'Event timeline']].map(([val, emoji, name, desc]) => (
                  <div key={val} onClick={() => setFormat(val)}
                    style={{ border: `2px solid ${format === val ? 'var(--gold)' : 'var(--border-mid)'}`, background: format === val ? 'var(--gold)' : 'var(--surface)', borderRadius: '10px', padding: '14px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{emoji}</div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
              onClick={generate} disabled={!selectedCase || loading}>
              {loading ? '⏳ Generating Brief…' : '⚖️ Generate Legal Brief'}
            </button>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
            <div className="card-header">
              <div><div className="card-title">Generated Legal Brief</div><div className="card-sub">AI-drafted from case documents · Review before filing</div></div>
            </div>
            <div style={{ padding: '28px', fontFamily: ''IBM Plex Serif', serif', lineHeight: 1.85, fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--ink-2)', borderTop: '3px solid var(--gold)' }}>
              {brief}
            </div>
            <div style={{ padding: '16px 24px', background: '#FEF9C3', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: '#92400E', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span><strong>AI Disclaimer:</strong> This analysis is AI-generated for information and case-support purposes only. It is NOT legal advice. Always verify with qualified legal professionals.</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .form-row { display: flex; flex-direction: column; gap: 5px; }
        .form-row label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .form-input { padding: 10px 14px; border: 1px solid var(--border-mid); border-radius: 8px; font-size: 14px; font-family: 'IBM Plex Sans', sans-serif; outline: none; background: var(--surface); transition: border-color 0.2s; width: 100%; }
        .form-input:focus { border-color: var(--gold); }
      `}</style>
    </>
  );
}
