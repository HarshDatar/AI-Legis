import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { uploadDocument, getCases } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Upload() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { currentUser } = useAuth();

  const params       = new URLSearchParams(location.search);
  const initCaseId   = params.get('caseId') || '';
  const initAutoAI   = params.get('autoAI') === 'true';

  const [cases,      setCases]      = useState([]);
  const [caseId,     setCaseId]     = useState(initCaseId);
  const [file,       setFile]       = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [processAI,  setProcessAI]  = useState(initAutoAI);
  const [status,     setStatus]     = useState(null); // { type: 'info'|'success'|'error', msg }

  useEffect(() => {
    if (!currentUser) return;
    getCases(currentUser.id).then(r => setCases(r.cases || [])).catch(console.error);
  }, [currentUser]);

  const handleUpload = async () => {
    if (!file || !caseId) return;
    setUploading(true);
    setStatus({ type: 'info', msg: processAI ? 'Uploading & triggering AI analysis...' : 'Uploading file...' });
    try {
      await uploadDocument(caseId, file, 'general', currentUser.id);
      setStatus({ type: 'success', msg: 'File uploaded and indexed successfully.' });
      setTimeout(() => navigate(`/case/${caseId}`), 1500);
    } catch (e) {
      setStatus({ type: 'error', msg: e.message });
    } finally {
      setUploading(false);
    }
  };

  const STATUS_STYLE = {
    info:    { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
    success: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    error:   { bg: 'var(--maroon-light)', color: 'var(--maroon)', border: '#FECACA' },
  };

  return (
    <div className="workspace">
      <div className="top-nav">
        <span className="top-nav-title">Upload Evidence</span>
        <button className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">Document Ingestion</div>
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Case Selector */}
            <div>
              <label className="input-label">Target Case *</label>
              <select className="input-field" value={caseId} onChange={e => setCaseId(e.target.value)} required>
                <option value="">Select a matter...</option>
                {cases.map(c => (
                  <option key={c.case_id} value={c.case_id}>{c.case_number} — {c.title}</option>
                ))}
              </select>
            </div>

            {/* File Drop Zone */}
            <div>
              <label className="input-label">Document File</label>
              <div
                onClick={() => document.getElementById('file-input').click()}
                style={{
                  border: `2px dashed ${file ? 'var(--maroon)' : 'var(--border-mid)'}`,
                  padding: '40px', textAlign: 'center',
                  cursor: 'pointer', background: file ? 'var(--maroon-light)' : 'var(--surface-alt)',
                  transition: 'all 0.15s'
                }}
              >
                <input id="file-input" type="file" style={{ display: 'none' }}
                  accept=".pdf,.docx,.txt,.html"
                  onChange={e => setFile(e.target.files[0] || null)} />
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{file ? '📄' : '📤'}</div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: file ? 'var(--maroon)' : 'var(--navy)' }}>
                  {file ? file.name : 'Click to select a file'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  PDF, DOCX, TXT or HTML · Max 50MB
                </div>
              </div>
            </div>

            {/* AI Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: 'var(--surface-alt)',
              border: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--navy)' }}>Enable AI Deep-Index</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Runs Ollama analysis on this document after upload</div>
              </div>
              <div
                onClick={() => setProcessAI(p => !p)}
                style={{
                  width: '44px', height: '24px', cursor: 'pointer',
                  background: processAI ? 'var(--maroon)' : 'var(--border-mid)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: processAI ? '23px' : '3px',
                  width: '18px', height: '18px',
                  background: 'white', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
              </div>
            </div>

            {status && (
              <div style={{
                padding: '12px 14px', fontSize: '13px', fontWeight: '600',
                background: STATUS_STYLE[status.type].bg,
                color: STATUS_STYLE[status.type].color,
                border: `1px solid ${STATUS_STYLE[status.type].border}`,
              }}>
                {status.msg}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleUpload}
              disabled={!file || !caseId || uploading}
              style={{ height: '46px', fontSize: '13px', opacity: (!file || !caseId) ? 0.4 : 1 }}
            >
              {uploading ? 'UPLOADING...' : processAI ? 'UPLOAD & ANALYSE' : 'UPLOAD TO DOCKET'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
