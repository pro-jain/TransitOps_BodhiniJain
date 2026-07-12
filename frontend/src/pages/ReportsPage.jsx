import { useEffect, useState } from 'react';
import Topbar from '../components/layout/Topbar.jsx';
import CapacityPlannerPanel from '../components/reports/CapacityPlannerPanel.jsx';
import ROIChart from '../components/reports/ROIChart.jsx';
import axiosClient from '../api/axiosClient.js';

export default function ReportsPage() {
  const [report, setReport] = useState([]);

  useEffect(() => {
    axiosClient.get('/reports/cost-report').then(({ data }) => setReport(data));
  }, []);

  function exportCsv() {
    window.open(`${axiosClient.defaults.baseURL}/reports/cost-report/export/csv`, '_blank');
  }

  return (
    <>
      <Topbar title="Reports & Analytics" subtitle="Fuel efficiency, utilization, operational cost, and ROI per vehicle" />
      <div className="page-body">
        <CapacityPlannerPanel />

        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <div className="panel-title">Vehicle ROI</div>
          </div>
          <ROIChart data={report} />
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <div className="panel-title">Per-Vehicle Cost Report</div>
            <button className="btn btn-sm" onClick={exportCsv}>Export CSV</button>
          </div>
          {report.length === 0 ? <div className="empty-state">No data yet.</div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Trips</th>
                  <th>Distance</th>
                  <th>Fuel Efficiency</th>
                  <th>Fuel Cost</th>
                  <th>Maintenance Cost</th>
                  <th>Other Expenses</th>
                  <th>Operational Cost</th>
                  <th>Revenue</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.vehicleId}>
                    <td className="mono">{r.regNumber}</td>
                    <td>{r.totalTrips}</td>
                    <td>{r.totalDistance} km</td>
                    <td>{r.fuelEfficiencyKmPerL != null ? `${r.fuelEfficiencyKmPerL} km/L` : '—'}</td>
                    <td>{r.totalFuelCost}</td>
                    <td>{r.totalMaintenanceCost}</td>
                    <td>{r.totalOtherExpenses}</td>
                    <td>{r.operationalCost}</td>
                    <td>{r.totalRevenue}</td>
                    <td style={{ color: r.roi != null && r.roi < 0 ? 'var(--red)' : 'var(--green)' }}>
                      {r.roi != null ? r.roi : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
