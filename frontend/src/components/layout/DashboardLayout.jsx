import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
