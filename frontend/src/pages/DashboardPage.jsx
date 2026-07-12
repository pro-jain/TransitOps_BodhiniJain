import { useEffect, useState } from 'react';
import Topbar from '../components/layout/Topbar.jsx';
import KpiCard from '../components/dashboard/KpiCard.jsx';
import FleetSizingWidget from '../components/dashboard/FleetSizingWidget.jsx';
import ComplianceWidget from '../components/dashboard/ComplianceWidget.jsx';
import UtilizationChart from '../components/dashboard/UtilizationChart.jsx';
import axiosClient from '../api/axiosClient.js';

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [vehicleBreakdown, setVehicleBreakdown] = useState(null);

  useEffect(() => {
    axiosClient.get('/dashboard/kpis').then(({ data }) => setKpis(data));
    axiosClient.get('/vehicles').then(({ data }) => {
      const counts = { Available: 0, 'On Trip': 0, 'In Shop': 0, Retired: 0 };
      data.forEach((v) => { counts[v.status] = (counts[v.status] || 0) + 1; });
      setVehicleBreakdown(counts);
    });
  }, []);

  return (
    <>
      <Topbar title="Dashboard" subtitle="Live operational overview" />
      <div className="page-body">
        <div className="kpi-grid">
          <KpiCard label="Active Vehicles" value={kpis?.activeVehicles ?? '—'} />
          <KpiCard label="Available Vehicles" value={kpis?.availableVehicles ?? '—'} tone="teal" />
          <KpiCard label="In Maintenance" value={kpis?.vehiclesInMaintenance ?? '—'} />
          <KpiCard label="Active Trips" value={kpis?.activeTrips ?? '—'} tone="accent" />
          <KpiCard label="Pending Trips" value={kpis?.pendingTrips ?? '—'} />
          <KpiCard label="Drivers On Duty" value={kpis?.driversOnDuty ?? '—'} />
          <KpiCard label="Fleet Utilization" value={kpis ? `${kpis.fleetUtilizationPct}%` : '—'} tone="accent" />
        </div>

        <div className="panel-grid-2">
          <FleetSizingWidget />
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Fleet Status Breakdown</div>
            </div>
            {vehicleBreakdown && (
              <UtilizationChart
                available={vehicleBreakdown.Available}
                onTrip={vehicleBreakdown['On Trip']}
                inShop={vehicleBreakdown['In Shop']}
                retired={vehicleBreakdown.Retired}
              />
            )}
          </div>
        </div>

        <ComplianceWidget />
      </div>
    </>
  );
}
