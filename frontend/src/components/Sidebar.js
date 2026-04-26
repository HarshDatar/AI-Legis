import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

const NAV = [
  { to: '/', icon: 'dashboard', label: 'COMMAND CENTER' },
  { to: '/chat', icon: 'scales', label: 'AI ASSOCIATE' },
  { to: '/new-case', icon: 'plus', label: 'NEW MATTER' },
  { to: '/upload', icon: 'upload', label: 'UPLOAD FILE' },
];

function Sidebar() {
  const { currentUser, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">AI-LEGIS</div>
        <div className="sidebar-tagline">Judicial Intelligence</div>
      </div>

      <nav style={{ flex: 1, paddingTop: '12px' }}>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {currentUser && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '4px',
              background: 'var(--maroon)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700', flexShrink: 0
            }}>
              {currentUser.initials || currentUser.name?.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>{currentUser.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '7px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8',
              fontSize: '10px', fontWeight: '700', cursor: 'pointer',
              borderRadius: '4px', letterSpacing: '0.5px', fontFamily: 'inherit'
            }}
          >
            SIGN OUT
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
