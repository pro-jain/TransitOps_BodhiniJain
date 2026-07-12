import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◆', roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
  { to: '/vehicles', label: 'Vehicles', icon: '▣', roles: ['FleetManager', 'Driver'] },
  { to: '/drivers', label: 'Drivers', icon: '☺', roles: ['FleetManager', 'SafetyOfficer'] },
  { to: '/trips', label: 'Trips', icon: '→', roles: ['FleetManager', 'Driver'] },
  { to: '/maintenance', label: 'Maintenance', icon: '⚙', roles: ['FleetManager'] },
  { to: '/fuel-expense', label: 'Fuel & Expense', icon: '⛽', roles: ['FleetManager', 'FinancialAnalyst', 'Driver'] },
  { to: '/reports', label: 'Reports', icon: '▤', roles: ['FleetManager', 'FinancialAnalyst'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="dot" />
        <span className="sidebar-brand-text">Transit<span>Ops</span></span>
      </div>

      <div className="nav-section-label">Operations</div>
      {NAV_ITEMS.filter((item) => item.roles.includes(user?.role)).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div style={{ padding: '0 10px', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</div>
          <span className="role-pill">{user?.role}</span>
        </div>
        <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
