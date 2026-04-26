import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyCopyright, getMyCopyrightApplications } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Copyright() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    work_type: 'Literary',
    description: ''
  });
  
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadApplications();
    }
  }, [currentUser]);

  const loadApplications = async () => {
    try {
      const data = await getMyCopyrightApplications(currentUser.id);
      setApplications(data.applications || []);
    } catch (e) {
      console.error("Failed to load applications", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: 'info', msg: 'Submitting copyright application...' });
    
    try {
      await applyCopyright(formData, currentUser.id);
      setStatus({ type: 'success', msg: 'Copyright application filed successfully!' });
      setFormData({ title: '', author: '', work_type: 'Literary', description: '' });
      setShowForm(false);
      loadApplications();
    } catch (e) {
      setStatus({ type: 'error', msg: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const WORK_TYPES = [
    'Literary', 'Dramatic', 'Musical', 'Artistic', 
    'Cinematograph Film', 'Sound Recording', 'Software/Computer Program'
  ];

  return (
    <div className="workspace">
      <div className="top-nav">
        <span className="top-nav-title">Copyright Management</span>
        <button className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--navy)' }}>Intellectual Property</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Manage and file new copyright registrations</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 20px' }}
          >
            {showForm ? 'Cancel Application' : '+ New Application'}
          </button>
        </div>

        {status && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            background: status.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            color: status.type === 'error' ? '#991B1B' : '#166534',
            border: `1px solid ${status.type === 'error' ? '#FECACA' : '#BBF7D0'}`
          }}>
            {status.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 1fr' : '1fr', gap: '24px' }}>
          
          {/* Applications List */}
          <div className="card">
            <div className="card-header">Recent Filings</div>
            <div style={{ padding: '0' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>
              ) : applications.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📜</div>
                  <p>No copyright applications found.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Application ID</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Work Title</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} className="table-row-hover">
                        <td style={{ padding: '16px', fontSize: '13px', fontWeight: '700', color: 'var(--maroon)' }}>{app.id}</td>
                        <td style={{ padding: '16px', fontSize: '13px' }}>
                          <div style={{ fontWeight: '600' }}>{app.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.work_type}</div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                            background: '#FEF3C7', color: '#92400E'
                          }}>
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Application Form */}
          {showForm && (
            <div className="card" style={{ height: 'fit-content' }}>
              <div className="card-header">New Copyright Filing</div>
              <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="input-label">Title of Work *</label>
                  <input 
                    className="input-field" 
                    type="text" 
                    required 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. The Quantum Jurisprudence"
                  />
                </div>
                
                <div>
                  <label className="input-label">Author Name *</label>
                  <input 
                    className="input-field" 
                    type="text" 
                    required 
                    value={formData.author}
                    onChange={e => setFormData({...formData, author: e.target.value})}
                    placeholder="Full legal name"
                  />
                </div>

                <div>
                  <label className="input-label">Category of Work</label>
                  <select 
                    className="input-field"
                    value={formData.work_type}
                    onChange={e => setFormData({...formData, work_type: e.target.value})}
                  >
                    {WORK_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Brief Description</label>
                  <textarea 
                    className="input-field" 
                    rows="4"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the nature of the work..."
                    style={{ resize: 'none' }}
                  />
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={submitting}
                    style={{ width: '100%', height: '44px' }}
                  >
                    {submitting ? 'PROCESSING...' : 'SUBMIT FILING'}
                  </button>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                    By submitting, you certify that you are the rightful owner or authorized agent of this work.
                  </p>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
