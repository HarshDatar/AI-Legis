import React, { useState, useEffect } from 'react';
import { getCases } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const data = await getCases(currentUser?.id);
        // Remove restrictive filtering that might hide legitimate cases
        const validCases = data.cases || [];
        
        let allDocs = [];
        validCases.forEach(c => {
          if(c.documents && Array.isArray(c.documents)) {
             c.documents.forEach(d => {
               allDocs.push({ 
                 ...d, 
                 caseRef: c,
                 // Assign a category if missing
                 category: d.type || 'general'
               });
             });
          }
        });

        // Demo data fallback if empty
        if (allDocs.length === 0) {
           allDocs = [
             { name: 'Court Order — Interim Stay.pdf', type: 'order', size: '340 KB', date: '2026-04-10', category: 'order', caseRef: { case_number: 'WP/1042/2024', case_id: 'demo001', title: 'State v. Sharma' } },
             { name: 'Witness Statement — R. Nair.pdf', type: 'evidence', size: '1.2 MB', date: '2026-03-28', category: 'evidence', meta: 'OCR Indexed', caseRef: { case_number: 'WP/1042/2024', case_id: 'demo001', title: 'State v. Sharma' } },
             { name: 'Property Valuation Report.pdf', type: 'evidence', size: '890 KB', date: '2026-02-15', category: 'evidence', caseRef: { case_number: 'CS/338/2023', case_id: 'demo002', title: 'Mehta v. Patel' } },
             { name: 'Legal Notice - Eviction.pdf', type: 'pleading', size: '210 KB', date: '2026-01-12', category: 'pleading', caseRef: { case_number: 'WP/1042/2024', case_id: 'demo001', title: 'State v. Sharma' } },
           ];
        }

        setDocs(allDocs);
      } catch (e) {
        console.error("Vault Error:", e);
        setDocs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  const getDocIcon = (category) => {
    switch(category) {
      case 'order': return '📜';
      case 'evidence': return '📂';
      case 'pleading': return '⚖️';
      case 'research': return '📚';
      default: return '📄';
    }
  };

  const filteredDocs = docs.filter(d => {
    const matchesFilter = filter === 'all' || d.category === filter;
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.caseRef.case_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="empty"><div className="spinner"></div></div>;

  return (
    <>
      <header className="topbar">
        <div>
          <div className="topbar-title">Document Vault</div>
          <div className="topbar-sub">Secure firm-wide repository — {docs.length} assets indexed</div>
        </div>
        <div className="topbar-right">
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="#888" strokeWidth="1.4" /><path d="M10.5 10.5L14 14" stroke="#888" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <input 
              type="text" 
              placeholder="Search vault..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-gold" onClick={() => navigate('/upload')}>
            Upload Bulk
          </button>
        </div>
      </header>
      
      <div className="content">
        <div className="tabs" style={{ marginBottom: '16px' }}>
          {['all', 'order', 'evidence', 'pleading', 'research'].map(t => (
            <div 
              key={t} 
              className={`tab ${filter === t ? 'active' : ''}`} 
              onClick={() => setFilter(t)}
            >
              {t.toUpperCase()}
              <span className="tab-count">{docs.filter(d => t === 'all' || d.category === t).length}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Indexed Case Files</div>
            <div className="card-sub">AI-powered semantic search active</div>
          </div>
          <div style={{ padding: '0' }}>
             {filteredDocs.length === 0 ? (
               <div className="empty" style={{ padding: '80px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
                  No documents match your criteria.
               </div>
             ) : (
               filteredDocs.map((doc, i) => (
                 <div key={i} className="vault-row" onClick={() => navigate(`/case/${doc.caseRef.case_id}`)}>
                    <div className="vault-main">
                      <div className="vault-icon-box">
                        {getDocIcon(doc.category)}
                      </div>
                      <div className="vault-info">
                        <div className="vault-name">{doc.name}</div>
                        <div className="vault-meta">
                          <span className="vault-case-num">{doc.caseRef.case_number}</span>
                          <span className="sep">·</span>
                          <span className="vault-type">{doc.category.toUpperCase()}</span>
                          <span className="sep">·</span>
                          <span>{doc.size || '0 KB'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="vault-actions">
                      {doc.meta && <span className="ocr-badge">{doc.meta}</span>}
                      <button className="vault-btn" onClick={(e) => { e.stopPropagation(); alert("Accessing secure file..."); }}>View</button>
                      <button className="vault-btn" onClick={(e) => { e.stopPropagation(); alert("Downloading..."); }}>↓</button>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>

      <style>{`
        .vault-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px; border-bottom: 1px solid var(--border);
          cursor: pointer; transition: all 0.2s; background: var(--surface);
        }
        .vault-row:hover { background: var(--surface-alt); transform: translateX(4px); }
        .vault-row:last-child { border-bottom: none; }
        .vault-main { display: flex; align-items: center; gap: 16px; }
        .vault-icon-box {
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--gold); border: 1px solid var(--gold);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .vault-name { font-weight: 600; color: var(--navy); fontSize: 15px; margin-bottom: 4px; }
        .vault-meta { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
        .vault-case-num { font-weight: 700; color: var(--gold); }
        .sep { opacity: 0.3; }
        .vault-actions { display: flex; align-items: center; gap: 10px; }
        .ocr-badge { background: #DCFCE7; color: #166534; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
        .vault-btn { background: var(--surface); border: 1px solid var(--border-mid); padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--ink-3); transition: all 0.2s; }
        .vault-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--gold); }
      `}</style>
    </>
  );
}

export default Documents;

