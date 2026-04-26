import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sendMessage, getCases, getChatHistory, clearChatHistory } from '../api';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

export default function AIChat() {
  const { caseId: urlCaseId } = useParams();
  const { currentUser } = useAuth();

  const [cases,      setCases]      = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    getCases(currentUser.id).then(res => {
      const list = res.cases || [];
      setCases(list);
      if (urlCaseId) {
        const found = list.find(c => c.case_id === urlCaseId);
        if (found) setActiveCase(found);
      }
    }).catch(console.error);
  }, [currentUser, urlCaseId]);

  useEffect(() => {
    if (!currentUser) return;
    if (activeCase) {
      setLoading(true);
      getChatHistory(currentUser.id, activeCase.case_id)
        .then(res => {
          setMessages(res.map(m => ({ role: m.role, content: m.content })));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setMessages([]);
    }
  }, [currentUser, activeCase]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    
    // 1. Optimistic update for user message
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages([...newMessages, { role: 'assistant', content: '' }]); // Placeholder for AI
    setInput('');
    setLoading(true);
    
    try {
      const { streamMessage } = await import('../api');
      let currentResponse = '';
      
      await streamMessage(
        msg, 
        messages, 
        activeCase?.case_id || null, 
        currentUser?.id,
        (chunk) => {
          currentResponse = chunk; // In values mode, chunk is full content so far
          setMessages([...newMessages, { role: 'assistant', content: currentResponse }]);
        }
      );
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: `⚠️ Error: ${e.message}` }]);
    } finally { 
      setLoading(false); 
    }
  };

  const clearHistory = async () => {
    if (!activeCase || !window.confirm('Clear all conversation history for this case?')) return;
    try {
      await clearChatHistory(currentUser.id, activeCase.case_id);
      setMessages([]);
    } catch (e) {
      alert(`Error clearing history: ${e.message}`);
    }
  };

  return (
    <div className="split-view" style={{ height: '100%' }}>

      {/* CASE SELECTOR */}
      <div className="pane-left" style={{ width: '280px' }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--navy)', letterSpacing: '1px' }}>MATTER CONTEXT</div>
        </div>
        <div style={{ padding: '8px' }}>
          {cases.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No cases found.</div>
          )}
          {cases.map(c => (
            <div
              key={c.case_id}
              className={`case-selector-item${activeCase?.case_id === c.case_id ? ' active' : ''}`}
              onClick={() => setActiveCase(c)}
            >
              <div style={{ fontWeight: '700', fontSize: '12px', color: activeCase?.case_id === c.case_id ? 'var(--maroon)' : 'var(--navy)' }}>
                {c.case_number}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.title || 'Untitled'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT PANEL */}
      <div className="pane-right">
        {/* Header */}
        <div className="top-nav" style={{ flexShrink: 0 }}>
          <span className="top-nav-title">
            AI Associate {activeCase ? `— ${activeCase.case_number}` : '(Global)'}
          </span>
          {activeCase && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ fontSize: '10px', padding: '5px 10px' }}
                onClick={() => send(`Analyze factual contradictions in case ${activeCase.case_number}`)}>
                DETECT CONTRADICTIONS
              </button>
              <button className="btn-secondary" style={{ fontSize: '10px', padding: '5px 10px' }}
                onClick={() => send(`Search for relevant IPC/CrPC sections in case ${activeCase.case_number}`)}>
                SEARCH STATUTES
              </button>
              <button className="btn-secondary" style={{ fontSize: '10px', padding: '5px 10px' }}
                onClick={() => send(`Summarize key evidence and facts for case ${activeCase.case_number}`)}>
                SUMMARIZE EVIDENCE
              </button>
              <button className="btn-outline" style={{ fontSize: '10px', padding: '5px 10px', color: 'var(--red)' }}
                onClick={clearHistory}>
                CLEAR HISTORY
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">⚖</div>
              <div className="empty-state-title">Judicial Research Engine</div>
              <p style={{ fontSize: '13px' }}>
                {activeCase ? 'Use the quick-action buttons above or type a query.' : 'Select a case from the left panel to begin.'}
              </p>
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
          {loading && (
            <div className="msg-ai">
              <div className="msg-label" style={{ color: 'var(--maroon)' }}>AI-LEGIS</div>
              <span style={{ color: 'var(--text-muted)' }}>Processing query via local AI...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              className="input-field"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={activeCase ? `Query case ${activeCase.case_number}...` : 'Select a case first or ask a general question...'}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={() => send()} disabled={loading} style={{ padding: '10px 20px' }}>
              {loading ? '...' : 'SEND'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
