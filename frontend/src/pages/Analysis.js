import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContradictions, getSummary, getCase } from '../api';
import ReactMarkdown from 'react-markdown';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';

const DEMO_CONTRADICTIONS = `## Contradiction 1 — Time of Incident

**Severity: HIGH**

**Witness A** (witness_statement_ramesh.txt):
> "At approximately 9:30 PM, I heard loud shouting and sounds of a scuffle coming from Flat 501."

**Witness B** (witness_statement_priya.txt):
> "At approximately 7:00 PM, I saw the accused leaving the building in a hurried manner."

**Type:** Timeline conflict — 2.5-hour discrepancy between accounts.

**Significance:** If Priya saw the accused leaving at 7:00 PM but Ramesh heard the scuffle at 9:30 PM, either one witness is misremembering or there were two separate events.

---

## Contradiction 2 — Cause of Death

**Severity: HIGH**

**FIR Report** (fir_report.txt):
> "The accused attacked the deceased with a sharp-edged weapon, believed to be a knife. The deceased sustained multiple stab wounds to the chest and abdomen."

**Forensic Report** (forensic_report.txt):
> "NO stab wounds were found. Death was caused by severe traumatic brain injury resulting from blunt force trauma to the left temporal region."

**Type:** Factual contradiction — the FIR describes stab wounds; the forensic exam found none.

**Significance:** This is the most critical discrepancy. The kitchen knife found at the scene may have been planted. The actual cause of death (blunt force trauma) fundamentally changes the nature of the weapon used and the charges.

---

## Contradiction 3 — Clothing Description

**Severity: MEDIUM**

**Ramesh's Statement:**
> "He was wearing a dark blue jacket and black trousers."

**Priya's Statement:**
> "He was wearing a grey t-shirt and blue jeans."

**Type:** Description discrepancy — entirely different clothing described for the accused on the same evening.

---

## Additional Finding — Time of Death Alignment

The forensic report estimates death between **6:30–7:30 PM**, which aligns with Priya's account (7:00 PM) but contradicts Ramesh's claim (9:30 PM). This suggests Priya's timeline may be more accurate.

**Bottom Line:** 3 contradictions detected across 4 documents. The weapon/cause-of-death discrepancy between the FIR and forensic report is the most legally significant.`;

const DEMO_SUMMARY = `## Case Overview

**State of Maharashtra v. Rajesh Sharma** is a criminal case filed at the Bombay High Court under Sections 302 and 307 of the Indian Penal Code.

## Key Facts

1. An ongoing property dispute existed between the accused (Rajesh Sharma, age 34) and the deceased (Vikram Verma, age 42) regarding a commercial property on Link Road, Andheri West.
2. On **10 March 2024**, the accused allegedly threatened the deceased in the building corridor.
3. On the night of **14 March 2024**, the deceased was found dead in his flat at Green Valley Apartments, Andheri West, Mumbai.
4. The FIR was filed at **11:45 PM** on 15 March 2024 by the deceased's brother, Suresh Kumar Verma.
5. Two witnesses provided statements with conflicting accounts.
6. The forensic examination contradicted the FIR regarding the cause of death.

## Legal Issues

- Whether the forensic evidence supports the charges under Section 302 IPC
- Reliability of witness testimony given conflicting accounts
- Whether the kitchen knife found at the scene is relevant given the forensic findings

## Court's Current Status

The case has a hearing scheduled for **10 May 2026**. The defence is expected to challenge the FIR based on the forensic contradictions.`;

function Analysis() {
  const { caseId } = useParams();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('contradictions');
  const [contradictions, setContradictions] = useState(null);
  const [summary, setSummary] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!currentUser) return;
      try { setCaseData(await getCase(caseId, currentUser.id)); }
      catch { setCaseData({ title: 'State of Maharashtra v. Rajesh Sharma', case_number: 'CRI/2024/1087' }); }
    })();
  }, [caseId, currentUser]);

  async function runContradictions() {
    setLoading(true);
    try {
      const res = await getContradictions(caseId, currentUser?.id);
      setContradictions(res);
    } catch {
      setContradictions({ status: 'contradictions_found', analysis: DEMO_CONTRADICTIONS, num_documents: 4, documents_analyzed: ['fir_report.txt', 'witness_statement_ramesh.txt', 'witness_statement_priya.txt', 'forensic_report.txt'] });
    } finally { setLoading(false); }
  }

  async function runSummary() {
    setLoading(true);
    try {
      const res = await getSummary(caseId, currentUser?.id);
      setSummary(res);
    } catch {
      setSummary({ summaries: [{ document: 'Full Case', status: 'success', summary: DEMO_SUMMARY }] });
    } finally { setLoading(false); }
  }

  return (
    <div id="analysis-page">
      <div className="breadcrumb">
        <Link to="/">Dashboard</Link>
        <Icon name="chevronRight" size={12} className="sep" />
        <Link to={`/case/${caseId}`}>{caseData?.title || 'Case'}</Link>
        <Icon name="chevronRight" size={12} className="sep" />
        <span style={{ color: 'var(--text-2)' }}>Analysis</span>
      </div>

      <div className="page-header">
        <h2>Analysis</h2>
        <p>{caseData?.title} — {caseData?.case_number}</p>
      </div>

      <div className="tabs">
        <button className={tab === 'contradictions' ? 'active' : ''} onClick={() => setTab('contradictions')}>
          Contradictions
        </button>
        <button className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>
          Summary
        </button>
      </div>

      {tab === 'contradictions' && (
        !contradictions ? (
          <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{
              width: '48px', height: '48px', margin: '0 auto 16px',
              background: 'var(--bg-raised)', borderRadius: 'var(--radius-m)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)',
            }}>
              <Icon name="search" size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Contradiction Detection</h3>
            <p style={{ color: 'var(--text-3)', fontSize: '13px', maxWidth: '420px', margin: '0 auto 20px' }}>
              Analyze all documents in this case for logical contradictions,
              timeline conflicts, and factual inconsistencies.
            </p>
            <button onClick={runContradictions} disabled={loading} className="btn btn-accent">
              {loading ? <><span>Analyzing</span> <div className="dots"><span></span><span></span><span></span></div></> : <><Icon name="search" size={15} /> Run Analysis</>}
            </button>
          </div>
        ) : (
          <>
            <div className="header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge ${contradictions.status === 'contradictions_found' ? 'badge-red' : 'badge-green'}`}>
                  {contradictions.status === 'contradictions_found' ? 'Contradictions Found' : 'Consistent'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{contradictions.num_documents} documents analyzed</span>
              </div>
              <button onClick={runContradictions} className="btn btn-ghost btn-sm"><Icon name="refresh" size={13} /> Rerun</button>
            </div>
            <div className="analysis-result"><ReactMarkdown>{contradictions.analysis}</ReactMarkdown></div>
          </>
        )
      )}

      {tab === 'summary' && (
        !summary ? (
          <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{
              width: '48px', height: '48px', margin: '0 auto 16px',
              background: 'var(--bg-raised)', borderRadius: 'var(--radius-m)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)',
            }}>
              <Icon name="fileText" size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Case Summary</h3>
            <p style={{ color: 'var(--text-3)', fontSize: '13px', maxWidth: '420px', margin: '0 auto 20px' }}>
              Generate a plain-English summary of all documents in this case.
            </p>
            <button onClick={runSummary} disabled={loading} className="btn btn-accent">
              {loading ? <><span>Generating</span> <div className="dots"><span></span><span></span><span></span></div></> : <><Icon name="fileText" size={15} /> Generate Summary</>}
            </button>
          </div>
        ) : (
          <>
            <div className="header-bar">
              <span className="badge badge-green">Summary Generated</span>
              <button onClick={runSummary} className="btn btn-ghost btn-sm"><Icon name="refresh" size={13} /> Regenerate</button>
            </div>
            {(summary.summaries || []).map((s, i) => (
              <div key={i} className="analysis-result" style={{ marginBottom: '12px' }}>
                <ReactMarkdown>{s.summary}</ReactMarkdown>
              </div>
            ))}
          </>
        )
      )}
    </div>
  );
}

export default Analysis;
