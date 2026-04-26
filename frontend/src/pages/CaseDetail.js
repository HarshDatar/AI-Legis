import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCase, sendMessage } from '../api';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';

export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate   = useNavigate();
  const { currentUser } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // AI panel
  const [messages, setMessages]   = useState([]);
  const [query,    setQuery]      = useState('');
  const [thinking, setThinking]   = useState(false);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    getCase(caseId, currentUser.id)
      .then(d  => setCaseData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [caseId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendAI = async (customMsg) => {
    const msg = customMsg || query.trim();
    if (!msg || thinking) return;
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setQuery('');
    setThinking(true);
    try {
      const res = await sendMessage(msg, messages, caseId, currentUser?.id);
      setMessages(p => [...p, { role: 'assistant', content: res.response }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: `⚠️ AI Error: ${e.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  if (loading) return (
    <div className="workspace">
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading case file...</div>
    </div>
  );

  if (!caseData) return (
    <div className="workspace">
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--maroon)' }}>Case not found.</div>
    </div>
  );

  const docs = caseData.documents || [];

  return (
    <div className="workspace">
      {/* TOP NAV */}
      <div className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }} onClick={() => navigate('/')}>← DOCKET</button>
          <span style={{ color: 'var(--border-mid)' }}>|</span>
          <span className="top-nav-title">{caseData.case_number} — {caseData.title}</span>
        </div>
        <button className="btn-primary" onClick={() => navigate(`/upload?caseId=${caseId}`)}>+ UPLOAD EVIDENCE</button>
      </div>

      {/* SPLIT VIEW */}
      <div className="split-view">

        {/* LEFT: CASE METADATA + DOCUMENTS */}
        <div className="pane-left" style={{ width: '420px' }}>
          <div style={{ padding: '24px' }}>

            {/* Identity bar */}
            <div style={{ borderLeft: '4px solid var(--maroon)', paddingLeft: '14px', marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--maroon)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Matter Details</div>
              <h2 style={{ fontFamily: 'IBM Plex Serif, serif', fontSize: '20px', color: 'var(--navy)', fontWeight: '600' }}>{caseData.title}</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{caseData.court} · {caseData.category}</div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'CASE NO.',     value: caseData.case_number },
                { label: 'STATUS',       value: caseData.status },
                { label: 'PETITIONER',   value: caseData.parties?.petitioner || '—' },
                { label: 'RESPONDENT',   value: caseData.parties?.respondent || '—' },
                { label: 'DATE FILED',   value: caseData.date_filed || '—' },
                { label: 'NEXT HEARING', value: caseData.next_hearing || 'Not scheduled', highlight: !!caseData.next_hearing },
              ].map(item => (
                <div key={item.label} style={{ padding: '12px', background: 'var(--surface-alt)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: item.highlight ? 'var(--maroon)' : 'var(--navy)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Documents */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--navy)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Evidence Vault ({docs.length})
              </div>
              {docs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed var(--border-mid)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>📂</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>No Documents Yet</div>
                  <div style={{ fontSize: '11px' }}>Upload FIRs, witness statements, or medical reports</div>
                </div>
              ) : (
                <table className="legal-table" style={{ border: '1px solid var(--border)' }}>
                  <thead><tr><th>Document</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {docs.map((d, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '600', fontSize: '13px' }}>{d.name}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(d.type || 'general').toUpperCase()}</td>
                        <td><span className="badge badge-indexed">INDEXED</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: AI ANALYSIS ENGINE */}
        <div className="pane-right">
          {/* AI Header */}
          <div style={{ padding: '14px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--navy)', letterSpacing: '1px' }}>LEGIS AI ENGINE</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ fontSize: '10px', padding: '5px 10px' }}
                onClick={() => sendAI('Find all contradictions and inconsistencies in this case documents.')}>
                SCAN CONTRADICTIONS
              </button>
              <button className="btn-secondary" style={{ fontSize: '10px', padding: '5px 10px' }}
                onClick={() => sendAI('List all applicable IPC sections and relevant case laws for this matter.')}>
                APPLICABLE LAWS
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 && (
              <div className="empty-state" style={{ marginTop: '40px' }}>
                <div className="empty-state-icon">🤖</div>
                <div className="empty-state-title">AI Ready</div>
                <p style={{ fontSize: '12px' }}>Ask about witness statements, applicable laws, or click a quick action above.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'msg-user' : 'msg-ai'}>
                <div className="msg-label" style={{ color: m.role === 'user' ? 'rgba(255,255,255,0.5)' : 'var(--maroon)' }}>
                  {m.role === 'user' ? 'YOU' : 'AI-LEGIS'}
                </div>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ))}
            {thinking && (
              <div className="msg-ai">
                <div className="msg-label" style={{ color: 'var(--maroon)' }}>AI-LEGIS</div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Analyzing evidence...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                className="input-field"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAI()}
                placeholder="Ask about this case..."
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={() => sendAI()} disabled={thinking} style={{ padding: '10px 20px' }}>
                {thinking ? '...' : 'ASK'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
