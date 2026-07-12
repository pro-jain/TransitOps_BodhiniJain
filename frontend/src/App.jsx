import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import Login from './auth/Login.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import VehiclesPage from './pages/VehiclesPage.jsx';
import DriversPage from './pages/DriversPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import MaintenancePage from './pages/MaintenancePage.jsx';
import FuelExpensePage from './pages/FuelExpensePage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="vehicles" element={<ProtectedRoute roles={['FleetManager', 'Driver']}><VehiclesPage /></ProtectedRoute>} />
        <Route path="drivers" element={<ProtectedRoute roles={['FleetManager', 'SafetyOfficer']}><DriversPage /></ProtectedRoute>} />
        <Route path="trips" element={<ProtectedRoute roles={['FleetManager', 'Driver']}><TripsPage /></ProtectedRoute>} />
        <Route path="maintenance" element={<ProtectedRoute roles={['FleetManager']}><MaintenancePage /></ProtectedRoute>} />
        <Route path="fuel-expense" element={<ProtectedRoute roles={['FleetManager', 'FinancialAnalyst', 'Driver']}><FuelExpensePage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['FleetManager', 'FinancialAnalyst']}><ReportsPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
