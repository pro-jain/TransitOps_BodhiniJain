import { useEffect, useState } from "react";
import Topbar from "../components/layout/Topbar.jsx";
import KpiCard from "../components/dashboard/KpiCard.jsx";
import FleetSizingWidget from "../components/dashboard/FleetSizingWidget.jsx";
import ComplianceWidget from "../components/dashboard/ComplianceWidget.jsx";
import UtilizationChart from "../components/dashboard/UtilizationChart.jsx";
import axiosClient from "../api/axiosClient.js";

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [vehicleBreakdown, setVehicleBreakdown] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    axiosClient.get("/dashboard/kpis").then(({ data }) => setKpis(data));

    axiosClient.get("/vehicles").then(({ data }) => {
      const counts = {
        Available: 0,
        "On Trip": 0,
        "In Shop": 0,
        Retired: 0,
      };

      data.forEach((v) => {
        counts[v.status] = (counts[v.status] || 0) + 1;
      });

      setVehicleBreakdown(counts);
    });

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Topbar title="Dashboard" subtitle="Real-time Fleet Operations Center" />

      <div className="page-body">

        <div className="hero-banner">

          <div>

            <h2>Fleet Command Center</h2>

            <p>
              Monitor fleet operations, dispatch efficiency and compliance
              in real time.
            </p>

          </div>

          <div className="hero-time">

            <div>{currentTime.toLocaleDateString()}</div>

            <strong>{currentTime.toLocaleTimeString()}</strong>

          </div>

        </div>

        <div className="kpi-grid">

          <KpiCard
            label="Active Vehicles"
            value={kpis?.activeVehicles ?? "—"}
          />

          <KpiCard
            label="Available Vehicles"
            value={kpis?.availableVehicles ?? "—"}
            tone="teal"
          />

          <KpiCard
            label="In Maintenance"
            value={kpis?.vehiclesInMaintenance ?? "—"}
          />

          <KpiCard
            label="Active Trips"
            value={kpis?.activeTrips ?? "—"}
            tone="accent"
          />

          <KpiCard
            label="Pending Trips"
            value={kpis?.pendingTrips ?? "—"}
          />

          <KpiCard
            label="Drivers On Duty"
            value={kpis?.driversOnDuty ?? "—"}
          />

          <KpiCard
            label="Fleet Utilization"
            value={
              kpis ? `${kpis.fleetUtilizationPct}%` : "—"
            }
            tone="accent"
          />

        </div>

        <div className="dashboard-summary">

          <div className="summary-card">

            <h3>Fleet Health</h3>

            <p>
              {kpis
                ? `${kpis.availableVehicles} vehicles are currently available for dispatch.`
                : "Loading..."}
            </p>

          </div>

          <div className="summary-card">

            <h3>Today's Status</h3>

            <p>
              Monitor active trips, maintenance schedules and compliance
              alerts from a single dashboard.
            </p>

          </div>

          <div className="summary-card">

            <h3>Quick Actions</h3>

            <div className="quick-buttons">

              <button className="btn btn-secondary">
                Add Trip
              </button>

              <button className="btn btn-secondary">
                Add Vehicle
              </button>

            </div>

          </div>

        </div>

        <div className="panel-grid-2">

          <FleetSizingWidget />

          <div className="panel">

            <div className="panel-header">

              <div className="panel-title">
                Fleet Status Breakdown
              </div>

            </div>

            {vehicleBreakdown && (

              <UtilizationChart
                available={vehicleBreakdown.Available}
                onTrip={vehicleBreakdown["On Trip"]}
                inShop={vehicleBreakdown["In Shop"]}
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