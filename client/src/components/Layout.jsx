import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, ClipboardList, History, Settings, User, LogOut,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Products', icon: Package, to: '/products' },
];

const opsItems = [
  { label: 'Receipts', icon: ArrowDownToLine, to: '/receipts' },
  { label: 'Deliveries', icon: ArrowUpFromLine, to: '/deliveries' },
  { label: 'Transfers', icon: ArrowLeftRight, to: '/transfers' },
  { label: 'Adjustments', icon: ClipboardList, to: '/adjustments' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [opsOpen, setOpsOpen] = useState(true);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📦</div>
          <span className="sidebar-logo-text">CoreInventory</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label">Operations</div>

          <button
            className={`nav-item w-full`}
            onClick={() => setOpsOpen(o => !o)}
            style={{ justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ArrowLeftRight size={17} /> Operations
            </span>
            <ChevronDown size={14} style={{ transform: opsOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
          </button>

          {opsOpen && opsItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: 26 }}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label">Records</div>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <History size={17} />
            Move History
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={17} />
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {user?.profilePicture ? (
              <img 
                src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${user.profilePicture}`}                alt="Profile" 
                style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '2px solid var(--accent)'
                }} 
              />
            ) : (
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          </NavLink>
          <button className="nav-item w-full" onClick={logout} style={{ color: 'var(--danger)', marginTop: 4 }}>
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
