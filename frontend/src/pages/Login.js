import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PRACTITIONERS = [
  { id: 'lawyer1', name: 'Adv. Arjun Mehta',  role: 'Senior Advocate',   initials: 'AM' },
  { id: 'lawyer2', name: 'Adv. Priya Sharma',  role: 'Associate Partner', initials: 'PS' },
  { id: 'lawyer3', name: 'Adv. Rohan Desai',   role: 'Managing Partner',  initials: 'RD' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [selected, setSelected] = useState(PRACTITIONERS[0]);
  const [passkey,  setPasskey]  = useState('');
  const [error,    setError]    = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // NOTE: In production, replace this with a real backend auth call.
    if (passkey === 'admin123') {
      login(selected);
      navigate('/');
    } else {
      setError('Invalid passkey. Access denied.');
    }
  };

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: 'var(--navy)', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: '400px', background: 'var(--surface)',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Header strip */}
        <div style={{ background: 'var(--maroon)', padding: '28px 32px' }}>
          <div style={{ fontSize: '22px', color: '#fff', fontWeight: '600' }}>AI-LEGIS</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', marginTop: '4px' }}>PRACTITIONER ACCESS PORTAL</div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Identity picker */}
          <div>
            <div className="input-label" style={{ marginBottom: '10px' }}>Select Identity</div>
            {PRACTITIONERS.map(p => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', cursor: 'pointer',
                  marginBottom: '8px',
                  border: `1px solid ${selected.id === p.id ? 'var(--maroon)' : 'var(--border)'}`,
                  background: selected.id === p.id ? 'var(--maroon-light)' : 'var(--surface)',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: '32px', height: '32px',
                  background: selected.id === p.id ? 'var(--maroon)' : 'var(--navy)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0
                }}>
                  {p.initials}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-main)' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.role}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Passkey */}
          <div>
            <label className="input-label" htmlFor="passkey">Institutional Passkey</label>
            <input
              id="passkey"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={passkey}
              onChange={e => { setPasskey(e.target.value); setError(''); }}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'var(--maroon-light)',
              color: 'var(--maroon)',
              fontSize: '12px', fontWeight: '600',
              border: '1px solid #FECACA'
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-navy" style={{ height: '46px', fontSize: '13px', letterSpacing: '1px' }}>
            INITIATE SESSION →
          </button>
        </form>
      </div>
    </div>
  );
}
